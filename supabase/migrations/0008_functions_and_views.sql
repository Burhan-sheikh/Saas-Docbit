-- ============================================================
-- 0008: RPC functions and aggregate views
-- ============================================================

-- Recalculate storage usage for a project (and roll up to workspace)
create or replace function recalc_storage_usage(p_project_id uuid)
returns void as $$
declare
  total_bytes bigint;
  ws_id uuid;
  proj_owner uuid;
begin
  select coalesce(sum(size_bytes), 0) into total_bytes
  from file_nodes
  where project_id = p_project_id and type = 'file' and is_deleted = false;

  select workspace_id, owner_id into ws_id, proj_owner from projects where id = p_project_id;

  insert into storage_usage (project_id, workspace_id, user_id, bytes_used, updated_at)
  values (p_project_id, ws_id, proj_owner, total_bytes, now())
  on conflict (project_id) do update
    set bytes_used = excluded.bytes_used, updated_at = now(), workspace_id = excluded.workspace_id;

  -- storage limit check
  perform check_storage_limit(proj_owner);
end;
$$ language plpgsql security definer set search_path = public;

create or replace function check_storage_limit(p_user_id uuid)
returns void as $$
declare
  total_used bigint;
  max_allowed bigint;
begin
  select coalesce(sum(su.bytes_used), 0) into total_used
  from storage_usage su
  join projects p on p.id = su.project_id
  where p.owner_id = p_user_id;

  select pl.max_storage_bytes into max_allowed
  from subscriptions s join plans pl on pl.id = s.plan_id
  where s.user_id = p_user_id;

  if max_allowed is not null and total_used >= max_allowed then
    perform notify_user(
      p_user_id, 'storage_limit_reached', 'Storage limit reached',
      'You have reached your plan storage limit. Upgrade to add more files.',
      '/billing'
    );
  end if;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function trg_recalc_storage_on_file_change()
returns trigger as $$
begin
  if TG_OP = 'DELETE' then
    perform recalc_storage_usage(old.project_id);
    return old;
  else
    perform recalc_storage_usage(new.project_id);
    return new;
  end if;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_file_nodes_recalc_storage
  after insert or update of size_bytes, is_deleted or delete on file_nodes
  for each row execute function trg_recalc_storage_on_file_change();

-- ---------- Aggregate views ----------
create or replace view workspace_stats as
select
  w.id as workspace_id,
  (select count(*) from projects p where p.workspace_id = w.id and p.status = 'active') as project_count,
  (select count(*) from workspace_members wm where wm.workspace_id = w.id) as member_count,
  (select coalesce(sum(su.bytes_used), 0) from storage_usage su where su.workspace_id = w.id) as storage_used_bytes
from workspaces w;

create or replace view project_stats as
select
  p.id as project_id,
  (select count(*) from file_nodes f where f.project_id = p.id and f.type = 'file' and f.is_deleted = false) as file_count,
  (select count(*) from file_nodes f where f.project_id = p.id and f.type = 'folder' and f.is_deleted = false) as folder_count,
  (select count(*) from project_members m where m.project_id = p.id and m.accepted = true) as member_count,
  (select count(*) from project_links l where l.project_id = p.id and l.is_active = true) as link_count,
  (select coalesce(su.bytes_used, 0) from storage_usage su where su.project_id = p.id) as storage_used_bytes
from projects p;

-- ---------- Public link resolution (safe, security definer) ----------
create or replace function resolve_share_link(p_slug text)
returns table (
  id uuid,
  project_id uuid,
  target_type link_target_type,
  target_ids uuid[],
  requires_password boolean,
  expired boolean,
  downloads_exhausted boolean,
  require_login boolean,
  permission link_permission,
  is_active boolean,
  project_name text
) as $$
begin
  return query
  select
    pl.id, pl.project_id, pl.target_type, pl.target_ids,
    (pl.password_hash is not null) as requires_password,
    (pl.expires_at is not null and pl.expires_at < now()) as expired,
    (pl.max_downloads is not null and pl.download_count >= pl.max_downloads) as downloads_exhausted,
    pl.require_login, pl.permission, pl.is_active,
    p.name as project_name
  from project_links pl
  join projects p on p.id = pl.project_id
  where pl.slug = p_slug;
end;
$$ language plpgsql security definer stable set search_path = public;

grant execute on function resolve_share_link(text) to anon, authenticated;

-- ---------- Record a link view / download (bumps counters + analytics) ----------
create or replace function record_link_event(p_slug text, p_event analytics_event_type, p_country text default null, p_device text default null, p_browser text default null)
returns void as $$
declare
  link_row project_links%rowtype;
begin
  select * into link_row from project_links where slug = p_slug;
  if not found then
    return;
  end if;

  if p_event = 'link_download' then
    update project_links set download_count = download_count + 1 where id = link_row.id;
  else
    update project_links set view_count = view_count + 1 where id = link_row.id;
  end if;

  insert into analytics_events (project_id, event_type, link_id, country, device, browser)
  values (link_row.project_id, p_event, link_row.id, p_country, p_device, p_browser);
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function record_link_event(text, analytics_event_type, text, text, text) to anon, authenticated;

-- ---------- Approve / deny permission requests atomically ----------
create or replace function resolve_permission_request(p_request_id uuid, p_approve boolean, p_role project_role default 'viewer')
returns void as $$
declare
  req project_permission_requests%rowtype;
begin
  select * into req from project_permission_requests where id = p_request_id;
  if not found then
    raise exception 'Request not found';
  end if;

  if req.status <> 'pending' then
    raise exception 'Request already resolved';
  end if;

  if project_role_for(req.project_id, auth.uid()) <> 'owner' then
    raise exception 'Only the project owner can resolve requests';
  end if;

  update project_permission_requests
  set status = case when p_approve then 'approved' else 'denied' end,
      resolved_by = auth.uid(),
      resolved_at = now()
  where id = p_request_id;

  if p_approve then
    insert into project_members (project_id, user_id, role, accepted, invited_by)
    values (req.project_id, req.requester_id, p_role, true, auth.uid())
    on conflict (project_id, user_id) do update set role = excluded.role, accepted = true;
  end if;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function resolve_permission_request(uuid, boolean, project_role) to authenticated;
