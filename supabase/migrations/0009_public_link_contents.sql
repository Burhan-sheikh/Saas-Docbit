-- ============================================================
-- 0009: Public listing of file contents for a resolved share link
-- ============================================================

create or replace function resolve_share_link_contents(p_slug text)
returns table (
  id uuid,
  parent_id uuid,
  name text,
  type node_type,
  category file_category,
  mime_type text,
  size_bytes bigint,
  storage_url text,
  created_at timestamptz
) as $$
declare
  link_row project_links%rowtype;
begin
  select * into link_row from project_links where slug = p_slug and is_active = true;

  if not found then
    return;
  end if;

  if link_row.expires_at is not null and link_row.expires_at < now() then
    return;
  end if;

  if link_row.max_downloads is not null and link_row.download_count >= link_row.max_downloads then
    return;
  end if;

  if link_row.target_type = 'project' then
    return query
    select f.id, f.parent_id, f.name, f.type, f.category, f.mime_type, f.size_bytes, f.storage_url, f.created_at
    from file_nodes f
    where f.project_id = link_row.project_id and f.is_deleted = false;

  elsif link_row.target_type = 'category' then
    return query
    with roots as (select unnest(link_row.target_ids) as id)
    select f.id, f.parent_id, f.name, f.type, f.category, f.mime_type, f.size_bytes, f.storage_url, f.created_at
    from file_nodes f
    where f.is_deleted = false
      and (f.id in (select id from roots) or f.parent_id in (select id from roots));

  elsif link_row.target_type = 'folder' then
    return query
    with roots as (select unnest(link_row.target_ids) as id)
    select f.id, f.parent_id, f.name, f.type, f.category, f.mime_type, f.size_bytes, f.storage_url, f.created_at
    from file_nodes f
    where f.is_deleted = false
      and (f.id in (select id from roots) or f.parent_id in (select id from roots));

  else -- file
    return query
    select f.id, f.parent_id, f.name, f.type, f.category, f.mime_type, f.size_bytes, f.storage_url, f.created_at
    from file_nodes f
    where f.is_deleted = false and f.id = any (link_row.target_ids);
  end if;
end;
$$ language plpgsql security definer stable set search_path = public;

grant execute on function resolve_share_link_contents(text) to anon, authenticated;
