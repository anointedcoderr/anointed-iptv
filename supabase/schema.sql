-- StreamPulse Database Schema

-- CHANNELS TABLE
-- Stores all channels (built-in + imported by users)
create table if not exists channels (
  id          bigserial primary key,
  name        text not null,
  group_title text default 'Uncategorized',
  country     text default '🌍',
  logo        text,
  stream_url  text not null,
  is_builtin  boolean default false,
  user_id     text,
  created_at  timestamptz default now()
);

-- HEALTH LOGS TABLE
-- Records every time we ping a stream
create table if not exists health_logs (
  id          bigserial primary key,
  channel_id  bigint references channels(id) on delete cascade,
  status      text check (status in ('online','offline','degraded')),
  latency_ms  integer,
  checked_at  timestamptz default now()
);

-- WATCHLIST TABLE
-- Saves each user's favourite channels
create table if not exists watchlist (
  id          bigserial primary key,
  user_id     text not null,
  channel_id  bigint references channels(id) on delete cascade,
  added_at    timestamptz default now(),
  unique(user_id, channel_id)
);

-- Indexes to make queries faster
create index if not exists idx_health_logs_channel_id on health_logs(channel_id);
create index if not exists idx_health_logs_checked_at on health_logs(checked_at desc);
create index if not exists idx_watchlist_user_id on watchlist(user_id);