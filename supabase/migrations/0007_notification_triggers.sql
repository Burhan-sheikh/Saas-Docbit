-- ============================================================
-- 0007: Notification-producing triggers
-- ============================================================

create or replace function notify_user(
  p_user_id uuid,
  p_type notification_type,
  p_title text,
  p_message text,
  p_link text default null,
  p_metadata jsonb default '{}'::jsonb
) returns void as $$
begin
  insert into notifications (user_id, type, title, message, link, metadata)
  values (p_user_id, p_type, p_title, p_message, p_link, p_metadata);
end;
$$ language plpgsql security definer set search_path = public;

-- Project created -> notify workspace owner (if not the creator)
create or replace function on_project_created_notify()
returns trigger as $$
declare
  ws_owner uuid;
begin
  select owner_id into ws_owner from workspaces where id = new.workspace_id;
  if ws_owner is not null and ws_owner <> new.owner_id then
    perform notify_user(
      ws_owner, 'project_created', 'New project created',
      new.name || ' was created in your workspace.',
      '/projects/' || new.id
    );
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_notify_project_created
  after insert on projects
  for each row execute function on_project_created_notify();

-- Project updated -> notify owner + accepted members
create or replace function on_project_updated_notify()
returns trigger as $$
declare
  member record;
begin
  if (old.name is distinct from new.name) or (old.description is distinct from new.description) or (old.status is distinct from new.status) then
    for member in
      select user_id from project_members where project_id = new.id and accepted = true and user_id <> auth.uid()
    loop
      perform notify_user(
        member.user_id, 'project_updated', 'Project updated',
        new.name || ' was updated.',
        '/projects/' || new.id
      );
    end loop;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_notify_project_updated
  after update on projects
  for each row execute function on_project_updated_notify();

-- Workspace updated -> notify members
create or replace function on_workspace_updated_notify()
returns trigger as $$
declare
  member record;
begin
  if (old.name is distinct from new.name) or (old.description is distinct from new.description) then
    for member in
      select user_id from workspace_members where workspace_id = new.id and user_id <> auth.uid()
    loop
      perform notify_user(
        member.user_id, 'workspace_updated', 'Workspace updated',
        new.name || ' was updated.',
        '/workspaces/' || new.id
      );
    end loop;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_notify_workspace_updated
  after update on workspaces
  for each row execute function on_workspace_updated_notify();

-- Link generated -> notify project owner
create or replace function on_link_created_notify()
returns trigger as $$
declare
  proj_owner uuid;
  proj_name text;
begin
  select owner_id, name into proj_owner, proj_name from projects where id = new.project_id;
  if proj_owner is not null and proj_owner <> new.created_by then
    perform notify_user(
      proj_owner, 'link_generated', 'New share link created',
      'A share link was created for ' || proj_name || '.',
      '/projects/' || new.project_id || '/sharing'
    );
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_notify_link_created
  after insert on project_links
  for each row execute function on_link_created_notify();

-- Permission request created -> notify project owner
create or replace function on_permission_request_notify()
returns trigger as $$
declare
  proj_owner uuid;
  proj_name text;
  requester_name text;
begin
  select owner_id, name into proj_owner, proj_name from projects where id = new.project_id;
  select coalesce(full_name, email) into requester_name from profiles where id = new.requester_id;

  perform notify_user(
    proj_owner, 'permission_request', 'Access request received',
    requester_name || ' requested access to ' || proj_name || '.',
    '/projects/' || new.project_id || '/members'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_notify_permission_request
  after insert on project_permission_requests
  for each row execute function on_permission_request_notify();

-- Permission request resolved -> notify requester
create or replace function on_permission_resolved_notify()
returns trigger as $$
declare
  proj_name text;
begin
  if old.status = 'pending' and new.status = 'approved' then
    select name into proj_name from projects where id = new.project_id;
    perform notify_user(
      new.requester_id, 'permission_approved', 'Access request approved',
      'Your request to access ' || proj_name || ' was approved.',
      '/projects/' || new.project_id
    );
  elsif old.status = 'pending' and new.status = 'denied' then
    select name into proj_name from projects where id = new.project_id;
    perform notify_user(
      new.requester_id, 'permission_denied', 'Access request denied',
      'Your request to access ' || proj_name || ' was denied.',
      null
    );
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_notify_permission_resolved
  after update on project_permission_requests
  for each row execute function on_permission_resolved_notify();

-- Member joined a project -> notify owner
create or replace function on_project_member_joined_notify()
returns trigger as $$
declare
  proj_owner uuid;
  proj_name text;
  member_name text;
begin
  if new.accepted = true and (old is null or old.accepted = false) then
    select owner_id, name into proj_owner, proj_name from projects where id = new.project_id;
    select coalesce(full_name, email) into member_name from profiles where id = new.user_id;
    if proj_owner <> new.user_id then
      perform notify_user(
        proj_owner, 'member_joined', 'New member joined',
        coalesce(member_name, 'A new member') || ' joined ' || proj_name || '.',
        '/projects/' || new.project_id || '/members'
      );
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_notify_member_joined
  after insert or update on project_members
  for each row execute function on_project_member_joined_notify();

-- Member removed -> notify the removed user
create or replace function on_project_member_removed_notify()
returns trigger as $$
declare
  proj_name text;
begin
  select name into proj_name from projects where id = old.project_id;
  if old.user_id is not null then
    perform notify_user(
      old.user_id, 'member_removed', 'Removed from project',
      'You were removed from ' || coalesce(proj_name, 'a project') || '.',
      null
    );
  end if;
  return old;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_notify_member_removed
  after delete on project_members
  for each row execute function on_project_member_removed_notify();

-- Subscription plan changes -> notify user
create or replace function on_subscription_updated_notify()
returns trigger as $$
declare
  old_plan_price numeric;
  new_plan_price numeric;
begin
  if old.plan_id is distinct from new.plan_id then
    select price_monthly into old_plan_price from plans where id = old.plan_id;
    select price_monthly into new_plan_price from plans where id = new.plan_id;

    if new_plan_price > old_plan_price then
      perform notify_user(new.user_id, 'plan_upgraded', 'Plan upgraded', 'Your subscription plan was upgraded successfully.', '/billing');
    else
      perform notify_user(new.user_id, 'billing_updated', 'Plan changed', 'Your subscription plan was changed.', '/billing');
    end if;
  elsif old.status is distinct from new.status and new.status = 'expired' then
    perform notify_user(new.user_id, 'plan_expired', 'Plan expired', 'Your subscription has expired. Renew to keep full access.', '/billing');
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_notify_subscription_updated
  after update on subscriptions
  for each row execute function on_subscription_updated_notify();
