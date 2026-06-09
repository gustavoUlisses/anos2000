create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  nick text not null,
  personal_message text not null default '',
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);

alter table public.profiles drop constraint if exists profiles_nick_key;
alter table public.profiles add column if not exists personal_message text not null default '';

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('msn', 'uol')),
  room_id text,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid references public.profiles(id) on delete set null,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

create table if not exists public.msn_blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  blocked_nick_snapshot text not null,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

alter table public.profiles enable row level security;
alter table public.chat_messages enable row level security;
alter table public.msn_blocks enable row level security;

drop policy if exists "profiles are readable" on public.profiles;
create policy "profiles are readable"
on public.profiles
for select
using (true);

drop policy if exists "anonymous users can create non-admin profiles" on public.profiles;
create policy "anonymous users can create non-admin profiles"
on public.profiles
for insert
with check (is_admin = false and lower(nick) <> 'gusdev');

drop policy if exists "anonymous users can update their last seen profile data" on public.profiles;
create policy "anonymous users can update their last seen profile data"
on public.profiles
for update
using (is_admin = false and lower(nick) <> 'gusdev')
with check (is_admin = false and lower(nick) <> 'gusdev');

drop policy if exists "messages are readable for realtime MVP" on public.chat_messages;
create policy "messages are readable for realtime MVP"
on public.chat_messages
for select
using (true);

drop policy if exists "anonymous users can send messages" on public.chat_messages;
create policy "anonymous users can send messages"
on public.chat_messages
for insert
with check (char_length(body) between 1 and 1000);
