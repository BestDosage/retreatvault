-- Conversion layer for RetreatVault: gated booking leads + referral-click ledger.
-- Both tables are anon INSERT-only (like public.email_subscribers in 007) — all
-- writes go through the NEXT_PUBLIC anon key. No service-role key exists, so RLS
-- allows INSERT only; no anon SELECT/UPDATE/DELETE. With an insert-only policy,
-- PostgREST upsert(onConflict) FAILS (it needs UPDATE) — use plain .insert().

-- ─────────────────────────────────────────────────────────────────────────
-- Booking leads: the gated "Check Availability & Rates" concierge requests.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.booking_leads (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  phone text,
  retreat_slug text not null,
  retreat_name text,
  travel_month text,
  party_size int,
  budget_band text,
  message text,
  source text default 'detail_page',
  created_at timestamptz default now(),
  metadata jsonb default '{}'::jsonb
);

create index if not exists idx_booking_leads_retreat_slug
  on public.booking_leads (retreat_slug);

alter table public.booking_leads enable row level security;

create policy "Anyone can submit a booking lead" on public.booking_leads
  for insert with check (true);
-- No select/update/delete for anon — only service role can read lead data.

-- ─────────────────────────────────────────────────────────────────────────
-- Referral clicks: the outbound "Visit Official Site" ledger (/go/[slug]).
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.referral_clicks (
  id uuid default gen_random_uuid() primary key,
  retreat_slug text not null,
  destination_url text,
  referrer text,
  user_agent text,
  clicked_at timestamptz default now()
);

create index if not exists idx_referral_clicks_retreat_slug
  on public.referral_clicks (retreat_slug);

alter table public.referral_clicks enable row level security;

create policy "Anyone can log a referral click" on public.referral_clicks
  for insert with check (true);
-- No select/update/delete for anon — only service role can read click data.
