-- Email subscriber capture for RetreatvVault
create table if not exists public.email_subscribers (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  first_name text,
  source text not null default 'unknown', -- homepage, footer, retreat_page, quiz, guide
  source_detail text, -- e.g. retreat slug, guide slug, quiz result
  subscribed_at timestamptz default now(),
  unsubscribed_at timestamptz,
  status text not null default 'active' check (status in ('active', 'unsubscribed', 'bounced')),
  metadata jsonb default '{}'::jsonb
);

-- Unique on email (allow re-subscribe by updating status)
create unique index if not exists idx_email_subscribers_email on public.email_subscribers (email);

-- RLS: allow anonymous inserts, no reads
alter table public.email_subscribers enable row level security;

create policy "Anyone can subscribe" on public.email_subscribers
  for insert with check (true);

-- No select/update/delete for anon — only service role can read subscriber data
