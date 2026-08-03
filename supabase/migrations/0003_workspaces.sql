-- ============================================================
-- 0003: Workspaces and workspace membership
-- ============================================================

create table workspaces (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  description text,
  icon text,
  owner_id uuid not null references profiles (id) on delete cascade,
  status workspace_status not null default 'active',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_workspaces_owner on workspaces (owner_id);
create index idx_workspaces_status on workspaces (status);

create trigger trg_workspaces_updated_at
  before update on workspaces
  for each row execute function set_updated_at();

create table workspace_members (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  role workspace_role not null default 'member',
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create index idx_workspace_members_workspace on workspace_members (workspace_id);
create index idx_workspace_members_user on workspace_members (user_id);

-- Helper: is user a member of workspace (security definer avoids RLS recursion)
create or replace function is_workspace_member(ws_id uuid, uid uuid)
returns boolean as $$
  select exists (
    select 1 from workspace_members
    where workspace_id = ws_id and user_id = uid
  );
$$ language sql security definer stable set search_path = public;

create or replace function workspace_role_for(ws_id uuid, uid uuid)
returns workspace_role as $$
  select role from workspace_members
  where workspace_id = ws_id and user_id = uid
  limit 1;
$$ language sql security definer stable set search_path = public;

alter table workspaces enable row level security;
alter table workspace_members enable row level security;

create policy "workspaces_select_members"
  on workspaces for select
  using (is_workspace_member(id, auth.uid()));

create policy "workspaces_insert_own"
  on workspaces for insert
  with check (owner_id = auth.uid());

create policy "workspaces_update_owner_admin"
  on workspaces for update
  using (workspace_role_for(id, auth.uid()) in ('owner', 'admin'));

create policy "workspaces_delete_owner"
  on workspaces for delete
  using (owner_id = auth.uid());

create policy "workspace_members_select_same_workspace"
  on workspace_members for select
  using (is_workspace_member(workspace_id, auth.uid()));

create policy "workspace_members_insert_owner_admin"
  on workspace_members for insert
  with check (
    workspace_role_for(workspace_id, auth.uid()) in ('owner', 'admin')
    or user_id = auth.uid()
  );

create policy "workspace_members_update_owner_admin_or_self_favorite"
  on workspace_members for update
  using (
    workspace_role_for(workspace_id, auth.uid()) in ('owner', 'admin')
    or user_id = auth.uid()
  );

create policy "workspace_members_delete_owner_admin_or_self"
  on workspace_members for delete
  using (
    workspace_role_for(workspace_id, auth.uid()) in ('owner', 'admin')
    or user_id = auth.uid()
  );

-- Auto-add creator as owner member
create or replace function handle_new_workspace()
returns trigger as $$
begin
  insert into workspace_members (workspace_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (workspace_id, user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_on_workspace_created
  after insert on workspaces
  for each row execute function handle_new_workspace();

-- Enforce plan limits on workspace creation
create or replace function enforce_workspace_limit()
returns trigger as $$
declare
  current_count int;
  max_allowed int;
begin
  select count(*) into current_count from workspaces where owner_id = new.owner_id and status = 'active';

  select p.max_workspaces into max_allowed
  from subscriptions s
  join plans p on p.id = s.plan_id
  where s.user_id = new.owner_id;

  if max_allowed is not null and current_count >= max_allowed then
    raise exception 'WORKSPACE_LIMIT_REACHED: Your plan allows a maximum of % workspaces', max_allowed;
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_enforce_workspace_limit
  before insert on workspaces
  for each row execute function enforce_workspace_limit();
