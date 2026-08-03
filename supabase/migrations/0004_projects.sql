-- ============================================================
-- 0004: Projects, membership, permissions, permission requests
-- ============================================================

create table projects (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  name text not null,
  description text,
  icon text,
  status project_status not null default 'active',
  owner_id uuid not null references profiles (id) on delete cascade,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_projects_workspace on projects (workspace_id);
create index idx_projects_owner on projects (owner_id);
create index idx_projects_status on projects (status);

create trigger trg_projects_updated_at
  before update on projects
  for each row execute function set_updated_at();

create table project_members (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects (id) on delete cascade,
  user_id uuid references profiles (id) on delete cascade,
  role project_role not null default 'viewer',
  invited_by uuid references profiles (id),
  invited_email text,
  accepted boolean not null default false,
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create index idx_project_members_project on project_members (project_id);
create index idx_project_members_user on project_members (user_id);

create table project_permissions (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  can_upload boolean not null default false,
  can_delete boolean not null default false,
  can_share boolean not null default false,
  can_manage_members boolean not null default false,
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create table project_permission_requests (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects (id) on delete cascade,
  requester_id uuid not null references profiles (id) on delete cascade,
  reason text,
  status permission_request_status not null default 'pending',
  resolved_by uuid references profiles (id),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_ppr_project on project_permission_requests (project_id);
create index idx_ppr_requester on project_permission_requests (requester_id);

-- ---------- Helper functions ----------
create or replace function is_project_member(pid uuid, uid uuid)
returns boolean as $$
  select exists (
    select 1 from project_members
    where project_id = pid and user_id = uid and accepted = true
  )
  or exists (
    select 1 from projects p
    join workspace_members wm on wm.workspace_id = p.workspace_id
    where p.id = pid and wm.user_id = uid and wm.role in ('owner', 'admin')
  );
$$ language sql security definer stable set search_path = public;

create or replace function project_role_for(pid uuid, uid uuid)
returns project_role as $$
  select role from project_members
  where project_id = pid and user_id = uid and accepted = true
  limit 1;
$$ language sql security definer stable set search_path = public;

-- ---------- RLS ----------
alter table projects enable row level security;
alter table project_members enable row level security;
alter table project_permissions enable row level security;
alter table project_permission_requests enable row level security;

create policy "projects_select_members_or_workspace_admin"
  on projects for select
  using (
    is_project_member(id, auth.uid())
    or workspace_role_for(workspace_id, auth.uid()) in ('owner', 'admin')
  );

create policy "projects_insert_workspace_member"
  on projects for insert
  with check (is_workspace_member(workspace_id, auth.uid()));

create policy "projects_update_owner_editor"
  on projects for update
  using (
    project_role_for(id, auth.uid()) in ('owner', 'editor')
    or workspace_role_for(workspace_id, auth.uid()) in ('owner', 'admin')
  );

create policy "projects_delete_owner"
  on projects for delete
  using (
    owner_id = auth.uid()
    or workspace_role_for(workspace_id, auth.uid()) = 'owner'
  );

create policy "project_members_select_members"
  on project_members for select
  using (is_project_member(project_id, auth.uid()) or user_id = auth.uid());

create policy "project_members_insert_owner_editor"
  on project_members for insert
  with check (project_role_for(project_id, auth.uid()) in ('owner', 'editor') or user_id = auth.uid());

create policy "project_members_update_owner"
  on project_members for update
  using (project_role_for(project_id, auth.uid()) = 'owner' or user_id = auth.uid());

create policy "project_members_delete_owner"
  on project_members for delete
  using (project_role_for(project_id, auth.uid()) = 'owner' or user_id = auth.uid());

create policy "project_permissions_select_members"
  on project_permissions for select
  using (is_project_member(project_id, auth.uid()));

create policy "project_permissions_write_owner"
  on project_permissions for all
  using (project_role_for(project_id, auth.uid()) = 'owner')
  with check (project_role_for(project_id, auth.uid()) = 'owner');

create policy "ppr_select_involved"
  on project_permission_requests for select
  using (
    requester_id = auth.uid()
    or project_role_for(project_id, auth.uid()) = 'owner'
  );

create policy "ppr_insert_self"
  on project_permission_requests for insert
  with check (requester_id = auth.uid());

create policy "ppr_update_owner"
  on project_permission_requests for update
  using (project_role_for(project_id, auth.uid()) = 'owner');

-- ---------- Triggers ----------
create or replace function handle_new_project()
returns trigger as $$
begin
  insert into project_members (project_id, user_id, role, accepted)
  values (new.id, new.owner_id, 'owner', true)
  on conflict (project_id, user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_on_project_created
  after insert on projects
  for each row execute function handle_new_project();

create or replace function enforce_project_limit()
returns trigger as $$
declare
  current_count int;
  max_allowed int;
  owner uuid;
begin
  select owner_id into owner from workspaces where id = new.workspace_id;

  select count(*) into current_count from projects where workspace_id = new.workspace_id and status = 'active';

  select p.max_projects_per_workspace into max_allowed
  from subscriptions s
  join plans p on p.id = s.plan_id
  where s.user_id = owner;

  if max_allowed is not null and current_count >= max_allowed then
    raise exception 'PROJECT_LIMIT_REACHED: Your plan allows a maximum of % projects per workspace', max_allowed;
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_enforce_project_limit
  before insert on projects
  for each row execute function enforce_project_limit();
