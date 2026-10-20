create table if not exists kv_store (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);
alter table kv_store enable row level security;
create policy "pilot read"   on kv_store for select using (true);
create policy "pilot write"  on kv_store for insert with check (true);
create policy "pilot update" on kv_store for update using (true);

-- Push notifications: stores each device's push subscription
create table if not exists push_subscriptions (
  endpoint text primary key,
  sub jsonb not null,
  updated_at timestamptz default now()
);
alter table push_subscriptions enable row level security;
-- Only the serverless functions (using the secret key) touch this table,
-- so no anon policies are added. RLS on with no policy = anon has no access.
