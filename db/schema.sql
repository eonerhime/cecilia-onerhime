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
