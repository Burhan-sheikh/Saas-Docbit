-- ============================================================
-- 0002: Plans and subscriptions (billing architecture, mock-ready)
-- ============================================================

create table plans (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  price_monthly numeric(10, 2) not null default 0,
  price_yearly numeric(10, 2) not null default 0,
  max_workspaces int not null default 1,
  max_projects_per_workspace int not null default 3,
  max_storage_bytes bigint not null default 5368709120, -- 5GB
  max_members_per_project int not null default 3,
  features jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table plans enable row level security;

create policy "plans_select_all_authenticated"
  on plans for select
  using (auth.role() = 'authenticated' or auth.role() = 'anon');

insert into plans (slug, name, description, price_monthly, price_yearly, max_workspaces, max_projects_per_workspace, max_storage_bytes, max_members_per_project, features) values
  ('free', 'Free', 'Get started with the essentials.', 0, 0, 1, 3, 5368709120, 3, '["1 workspace", "3 projects per workspace", "5GB storage", "Basic sharing links"]'::jsonb),
  ('pro', 'Pro', 'For growing teams that need more room.', 12, 120, 5, 20, 107374182400, 10, '["5 workspaces", "20 projects per workspace", "100GB storage", "Password-protected links", "Priority support"]'::jsonb),
  ('business', 'Business', 'Advanced controls for larger teams.', 39, 390, 20, 100, 1099511627776, 50, '["20 workspaces", "100 projects per workspace", "1TB storage", "Advanced analytics", "Custom link domains", "Priority support"]'::jsonb),
  ('enterprise', 'Enterprise', 'Unlimited scale with dedicated support.', 149, 1490, 999, 999, 10995116277760, 999, '["Unlimited workspaces", "Unlimited projects", "10TB storage", "SSO", "Dedicated support", "Custom contracts"]'::jsonb);

create table subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles (id) on delete cascade,
  plan_id uuid not null references plans (id),
  billing_cycle billing_cycle not null default 'monthly',
  status subscription_status not null default 'active',
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz not null default (now() + interval '30 days'),
  cancel_at_period_end boolean not null default false,
  provider billing_provider not null default 'mock',
  provider_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create index idx_subscriptions_user on subscriptions (user_id);

alter table subscriptions enable row level security;

create policy "subscriptions_select_own"
  on subscriptions for select
  using (auth.uid() = user_id);

create policy "subscriptions_insert_own"
  on subscriptions for insert
  with check (auth.uid() = user_id);

create policy "subscriptions_update_own"
  on subscriptions for update
  using (auth.uid() = user_id);

create trigger trg_subscriptions_updated_at
  before update on subscriptions
  for each row execute function set_updated_at();

-- Auto-provision a free subscription for every new profile
create or replace function handle_new_profile_subscription()
returns trigger as $$
declare
  free_plan_id uuid;
begin
  select id into free_plan_id from plans where slug = 'free' limit 1;

  insert into subscriptions (user_id, plan_id, billing_cycle, status, provider)
  values (new.id, free_plan_id, 'monthly', 'active', 'mock')
  on conflict (user_id) do nothing;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_on_profile_created_subscription
  after insert on profiles
  for each row execute function handle_new_profile_subscription();
