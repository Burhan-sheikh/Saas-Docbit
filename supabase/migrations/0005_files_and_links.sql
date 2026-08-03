-- ============================================================
-- 0005: File nodes (folders/files) and sharing links
-- ============================================================

create table file_nodes (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects (id) on delete cascade,
  parent_id uuid references file_nodes (id) on delete cascade,
  name text not null,
  type node_type not null,
  category file_category,
  is_system_folder boolean not null default false,
  mime_type text,
  size_bytes bigint not null default 0,
  storage_key text,
  storage_url text,
  checksum text,
  created_by uuid not null references profiles (id),
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_file_nodes_project on file_nodes (project_id);
create index idx_file_nodes_parent on file_nodes (parent_id);
create index idx_file_nodes_category on file_nodes (category);
create index idx_file_nodes_type on file_nodes (type);
create index idx_file_nodes_deleted on file_nodes (is_deleted);
create index idx_file_nodes_name_trgm on file_nodes using gin (name gin_trgm_ops);

create extension if not exists pg_trgm;

create trigger trg_file_nodes_updated_at
  before update on file_nodes
  for each row execute function set_updated_at();

alter table file_nodes enable row level security;

create policy "file_nodes_select_project_members"
  on file_nodes for select
  using (is_project_member(project_id, auth.uid()));

create policy "file_nodes_insert_upload_permission"
  on file_nodes for insert
  with check (
    project_role_for(project_id, auth.uid()) in ('owner', 'editor')
  );

create policy "file_nodes_update_editor_owner"
  on file_nodes for update
  using (project_role_for(project_id, auth.uid()) in ('owner', 'editor'));

create policy "file_nodes_delete_owner_editor"
  on file_nodes for delete
  using (project_role_for(project_id, auth.uid()) in ('owner', 'editor'));

-- Auto-create the 8 standard format folders whenever a project is created
create or replace function create_default_format_folders()
returns trigger as $$
declare
  folder_names text[] := array['Images', 'PDFs', 'Documents', 'Spreadsheets', 'Presentations', 'Archives', 'Design Files', 'Other'];
  folder_categories file_category[] := array['images', 'pdfs', 'documents', 'spreadsheets', 'presentations', 'archives', 'design_files', 'other'];
  i int;
begin
  for i in 1 .. array_length(folder_names, 1) loop
    insert into file_nodes (project_id, parent_id, name, type, category, is_system_folder, created_by)
    values (new.id, null, folder_names[i], 'folder', folder_categories[i], true, new.owner_id);
  end loop;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_on_project_created_folders
  after insert on projects
  for each row execute function create_default_format_folders();

-- ---------- project_links (sharing) ----------
create table project_links (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects (id) on delete cascade,
  target_type link_target_type not null,
  target_ids uuid[] not null default '{}',
  slug text not null unique,
  password_hash text,
  expires_at timestamptz,
  max_downloads int,
  download_count int not null default 0,
  view_count int not null default 0,
  require_login boolean not null default false,
  permission link_permission not null default 'download',
  is_active boolean not null default true,
  created_by uuid not null references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_project_links_project on project_links (project_id);
create index idx_project_links_slug on project_links (slug);
create index idx_project_links_active on project_links (is_active);

create trigger trg_project_links_updated_at
  before update on project_links
  for each row execute function set_updated_at();

alter table project_links enable row level security;

create policy "project_links_select_members"
  on project_links for select
  using (is_project_member(project_id, auth.uid()));

create policy "project_links_insert_share_permission"
  on project_links for insert
  with check (project_role_for(project_id, auth.uid()) in ('owner', 'editor'));

create policy "project_links_update_owner_editor"
  on project_links for update
  using (project_role_for(project_id, auth.uid()) in ('owner', 'editor'));

create policy "project_links_delete_owner_editor"
  on project_links for delete
  using (project_role_for(project_id, auth.uid()) in ('owner', 'editor'));

-- Public (anon) read access for resolving a share link by slug is handled via
-- a dedicated SECURITY DEFINER RPC (see 0008_functions.sql) rather than direct table RLS,
-- so unauthenticated visitors never get broad table access.
