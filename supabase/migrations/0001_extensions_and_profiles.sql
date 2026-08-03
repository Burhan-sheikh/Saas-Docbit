-- ============================================================
-- 0001: Extensions, enums, profiles
-- ============================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ---------- Enums ----------
create type workspace_role as enum ('owner', 'admin', 'member');
create type project_role as enum ('owner', 'editor', 'viewer');
create type workspace_status as enum ('active', 'archived');
create type project_status as enum ('active', 'archived');
create type node_type as enum ('folder', 'file');
create type file_category as enum (
  'images', 'pdfs', 'documents', 'spreadsheets',
  'presentations', 'archives', 'design_files', 'other'
);
create type permission_request_status as enum ('pending', 'approved', 'denied');
create type link_target_type as enum ('file', 'folder', 'category', 'project');
create type link_permission as enum ('view', 'download');
create type billing_cycle as enum ('monthly', 'yearly');
create type subscription_status as enum ('active', 'trialing', 'past_due', 'canceled', 'expired');
create type billing_provider as enum ('mock', 'razorpay');
create type notification_type as enum (
  'project_created', 'project_updated', 'workspace_updated',
  'link_generated', 'link_expired', 'permission_request',
  'permission_approved', 'permission_denied', 'member_joined',
  'member_removed', 'storage_limit_reached', 'plan_upgraded',
  'plan_expired', 'billing_updated'
);
create type analytics_event_type as enum (
  'project_view', 'file_upload', 'file_download', 'link_view', 'link_download'
);

-- ---------- profiles ----------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  avatar_url text,
  google_id text,
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_email on profiles (email);

alter table profiles enable row level security;

create policy "profiles_select_own_or_shared_context"
  on profiles for select
  using (auth.uid() = id or auth.role() = 'authenticated');

create policy "profiles_update_own"
  on profiles for update
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on profiles for insert
  with check (auth.uid() = id);

-- generic updated_at trigger function reused by many tables
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- Automatic profile creation on signup (also backfills Google metadata)
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, google_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'provider_id'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Keep profile in sync when Google (or any provider) metadata updates on subsequent logins
create or replace function handle_user_metadata_update()
returns trigger as $$
begin
  update public.profiles
  set
    full_name = coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', profiles.full_name),
    avatar_url = coalesce(new.raw_user_meta_data->>'avatar_url', profiles.avatar_url),
    google_id = coalesce(new.raw_user_meta_data->>'provider_id', profiles.google_id),
    email = new.email,
    updated_at = now()
  where id = new.id;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_on_auth_user_updated
  after update on auth.users
  for each row execute function handle_user_metadata_update();
