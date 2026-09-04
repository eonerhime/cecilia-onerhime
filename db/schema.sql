create table if not exists tributes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  message text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists media_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  media_url text not null,
  media_type text not null check (media_type in ('image', 'video')),
  caption text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists tributes_approved_created_idx on tributes (status, created_at desc);
create index if not exists media_approved_created_idx on media_submissions (status, created_at desc);

create table if not exists admin_rate_limits (
  client_key text primary key,
  failed_attempts integer not null default 0,
  window_started timestamptz not null default now(),
  locked_until timestamptz
);

create table if not exists memorial_settings (
  id text primary key default 'default',
  display_name text not null default 'Cecilia Onerhime',
  footer_text text not null default 'Copyright © is the Moses Onerhime Family 2026 All rights reserved',
  background_color text not null default '#f5f0e8',
  foreground_color text not null default '#1f2d2b',
  paper_color text not null default '#fbf8f2',
  sage_color text not null default '#536b60',
  accent_color text not null default '#c48a3a',
  line_color text not null default '#d8cec0',
  rose_color text not null default '#b8786f',
  peach_color text not null default '#d9b5a8',
  updated_at timestamptz not null default now()
);

alter table memorial_settings add column if not exists background_color text not null default '#f5f0e8';
alter table memorial_settings add column if not exists foreground_color text not null default '#1f2d2b';
alter table memorial_settings add column if not exists paper_color text not null default '#fbf8f2';
alter table memorial_settings add column if not exists sage_color text not null default '#536b60';
alter table memorial_settings add column if not exists accent_color text not null default '#c48a3a';
alter table memorial_settings add column if not exists line_color text not null default '#d8cec0';
alter table memorial_settings add column if not exists rose_color text not null default '#b8786f';
alter table memorial_settings add column if not exists peach_color text not null default '#d9b5a8';

insert into memorial_settings (id, display_name, footer_text)
values ('default', 'Cecilia Onerhime', 'Copyright © is the Moses Onerhime Family 2026 All rights reserved')
on conflict (id) do nothing;
