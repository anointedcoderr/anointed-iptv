-- Anointed IPTV — Auth & Admin Schema
-- Run this AFTER the base schema.sql in your Supabase SQL Editor.

-- ── USERS ──────────────────────────────────────────────────────────────────
create table if not exists iptv_users (
  id              bigserial primary key,
  email           text unique not null,
  password_hash   text not null,
  name            text,
  is_verified     boolean default false,
  is_admin        boolean default false,
  verify_token    text,
  created_at      timestamptz default now()
);

create index if not exists idx_iptv_users_email on iptv_users(email);
create index if not exists idx_iptv_users_verify_token on iptv_users(verify_token);

-- ── USER WATCHLIST (replaces in-memory) ────────────────────────────────────
create table if not exists iptv_user_watchlist (
  id          bigserial primary key,
  user_id     bigint references iptv_users(id) on delete cascade,
  channel_id  integer not null,
  added_at    timestamptz default now(),
  unique(user_id, channel_id)
);

create index if not exists idx_iptv_watchlist_user on iptv_user_watchlist(user_id);

-- ── RLS ────────────────────────────────────────────────────────────────────
alter table iptv_users enable row level security;
alter table iptv_user_watchlist enable row level security;

-- Allow the service role (API routes use service key) full access
create policy "Service role full access" on iptv_users for all using (true);
create policy "Service role full access" on iptv_user_watchlist for all using (true);
