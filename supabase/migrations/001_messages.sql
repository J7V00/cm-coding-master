-- Contact messages for Code Master
create table if not exists public.messages (
  id bigserial primary key,
  name text not null,
  email text not null,
  phone text default '',
  account_code text default '',
  subject text default 'contact',
  message text not null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

-- Public can insert contact messages only.
drop policy if exists "Anyone can insert contact messages" on public.messages;
create policy "Anyone can insert contact messages"
  on public.messages for insert
  to anon, authenticated
  with check (true);

-- Reading/updating/deleting should be limited to service role or authenticated admins.
-- Do NOT allow anon select in production. Use the service role in a secure Edge Function
-- or authenticate admins and add an admin claim policy.
drop policy if exists "No anon read" on public.messages;
-- Intentionally no anon SELECT policy.

-- Optional authenticated admin policy (set user metadata role = admin):
drop policy if exists "Admins manage messages" on public.messages;
create policy "Admins manage messages"
  on public.messages for all
  to authenticated
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
