-- ============================================================
-- 0006: Notifications, storage usage, analytics, activity logs
-- ============================================================

create table notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles (id) on delete cascade,
  type notification_type not null,
  title text not null,
  message text not null,
  link text,
  is_read boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_notifications_user on notifications (user_id);
create index idx_notifications_user_unread on notifications (user_id, is_read);
create index idx_notifications_created on notifications (created_at desc);

alter table notifications enable row level security;

create policy "notifications_select_own"
  on notifications for select
  using (auth.uid() = user_id);

create policy "notifications_update_own"
  on notifications for update
  using (auth.uid() = user_id);

create policy "notifications_insert_system"
  on notifications for insert
  with check (true);

create table storage_usage (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces (id) on delete cascade,
  project_id uuid references projects (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  bytes_used bigint not null default 0,
  updated_at timestamptz not null default now(),
  unique (project_id)
);

create index idx_storage_usage_workspace on storage_usage (workspace_id);
create index idx_storage_usage_user on storage_usage (user_id);

alter table storage_usage enable row level security;

create policy "storage_usage_select_related"
  on storage_usage for select
  using (
    (project_id is not null and is_project_member(project_id, auth.uid()))
    or (workspace_id is not null and is_workspace_member(workspace_id, auth.uid()))
    or user_id = auth.uid()
  );

create policy "storage_usage_upsert_system"
  on storage_usage for all
  using (true)
  with check (true);

create table analytics_events (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects (id) on delete cascade,
  event_type analytics_event_type not null,
  actor_id uuid references profiles (id),
  link_id uuid references project_links (id) on delete set null,
  country text,
  device text,
  browser text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_analytics_project on analytics_events (project_id);
create index idx_analytics_type on analytics_events (event_type);
create index idx_analytics_created on analytics_events (created_at desc);

alter table analytics_events enable row level security;

create policy "analytics_select_project_members"
  on analytics_events for select
  using (is_project_member(project_id, auth.uid()));

create policy "analytics_insert_system"
  on analytics_events for insert
  with check (true);

create table activity_logs (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces (id) on delete cascade,
  project_id uuid references projects (id) on delete cascade,
  actor_id uuid not null references profiles (id),
  action text not null,
  target_type text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_activity_workspace on activity_logs (workspace_id);
create index idx_activity_project on activity_logs (project_id);
create index idx_activity_created on activity_logs (created_at desc);

alter table activity_logs enable row level security;

create policy "activity_logs_select_related"
  on activity_logs for select
  using (
    (project_id is not null and is_project_member(project_id, auth.uid()))
    or (workspace_id is not null and is_workspace_member(workspace_id, auth.uid()))
  );

create policy "activity_logs_insert_system"
  on activity_logs for insert
  with check (true);
