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

create table if not exists templates (
  id text primary key,
  name text not null,
  slug text not null unique,
  component_key text not null,
  description text not null default '',
  config jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  template_id text not null references templates(id),
  status text not null default 'active' check (status in ('active', 'suspended', 'archived')),
  created_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists tenant_memberships (
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'editor', 'moderator', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

insert into templates (id, name, slug, component_key, description)
values
  ('editorial-memory', 'Editorial Memory', 'editorial-memory', 'editorial', 'Warm editorial memorial layout with generous typography.'),
  ('quiet-gallery', 'Quiet Gallery', 'quiet-gallery', 'gallery', 'Image-led layout for families with a large photo collection.'),
  ('bright-celebration', 'Bright Celebration', 'bright-celebration', 'celebration', 'Lighter event layout for birthdays and celebrations.')
on conflict (id) do nothing;

insert into tenants (id, slug, name, template_id)
values ('00000000-0000-0000-0000-000000000001', 'cecilia-onerhime', 'Cecilia Onerhime', 'editorial-memory')
on conflict (id) do nothing;

alter table tributes add column if not exists tenant_id uuid;
alter table media_submissions add column if not exists tenant_id uuid;
alter table contact_inquiries add column if not exists tenant_id uuid;
alter table memorial_settings add column if not exists tenant_id uuid;

update tributes set tenant_id = '00000000-0000-0000-0000-000000000001' where tenant_id is null;
update media_submissions set tenant_id = '00000000-0000-0000-0000-000000000001' where tenant_id is null;
update contact_inquiries set tenant_id = '00000000-0000-0000-0000-000000000001' where tenant_id is null;
update memorial_settings set tenant_id = '00000000-0000-0000-0000-000000000001' where tenant_id is null;

alter table tributes alter column tenant_id set not null;
alter table media_submissions alter column tenant_id set not null;
alter table contact_inquiries alter column tenant_id set not null;
alter table memorial_settings alter column tenant_id set not null;

alter table tributes drop constraint if exists tributes_tenant_id_fkey;
alter table media_submissions drop constraint if exists media_submissions_tenant_id_fkey;
alter table contact_inquiries drop constraint if exists contact_inquiries_tenant_id_fkey;
alter table memorial_settings drop constraint if exists memorial_settings_tenant_id_fkey;
alter table tributes add constraint tributes_tenant_id_fkey foreign key (tenant_id) references tenants(id) on delete cascade;
alter table media_submissions add constraint media_submissions_tenant_id_fkey foreign key (tenant_id) references tenants(id) on delete cascade;
alter table contact_inquiries add constraint contact_inquiries_tenant_id_fkey foreign key (tenant_id) references tenants(id) on delete cascade;
alter table memorial_settings add constraint memorial_settings_tenant_id_fkey foreign key (tenant_id) references tenants(id) on delete cascade;

create index if not exists tributes_tenant_status_created_idx on tributes (tenant_id, status, created_at desc);
create index if not exists media_tenant_status_created_idx on media_submissions (tenant_id, status, created_at desc);
create index if not exists contact_tenant_created_idx on contact_inquiries (tenant_id, created_at desc);
create unique index if not exists memorial_settings_tenant_idx on memorial_settings (tenant_id);

create table if not exists contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  project_type text not null check (project_type in ('memorial', 'birthday', 'celebration', 'other')),
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists contact_inquiries_created_idx on contact_inquiries (created_at desc);

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
  hero_image_url text not null default '',
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
alter table memorial_settings add column if not exists hero_image_url text not null default '';
alter table memorial_settings add column if not exists foreground_color text not null default '#1f2d2b';
alter table memorial_settings add column if not exists paper_color text not null default '#fbf8f2';
alter table memorial_settings add column if not exists sage_color text not null default '#536b60';
alter table memorial_settings add column if not exists accent_color text not null default '#c48a3a';
alter table memorial_settings add column if not exists line_color text not null default '#d8cec0';
alter table memorial_settings add column if not exists rose_color text not null default '#b8786f';
alter table memorial_settings add column if not exists peach_color text not null default '#d9b5a8';

insert into memorial_settings (id, tenant_id, display_name, footer_text)
values ('default', '00000000-0000-0000-0000-000000000001', 'Cecilia Onerhime', 'Copyright © is the Moses Onerhime Family 2026 All rights reserved')
on conflict (id) do nothing;

-- Note: this table pre-existed in the shared Neon database from earlier,
-- since-abandoned MRU auth work (see ADR-002 in the memories-r-us docs on
-- the shared database). Its shape (uuid id + token_hash, no tenant_id) is
-- kept as-is rather than altered, since it was already there; sessions are
-- not tenant-scoped here because CO is single-tenant today, and tenant is
-- resolved via tenant_memberships at lookup time instead.
create table if not exists auth_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists auth_sessions_user_idx on auth_sessions (user_id);
create index if not exists auth_sessions_expires_idx on auth_sessions (expires_at);

create table if not exists admin_invites (
  tenant_id uuid not null references tenants(id) on delete cascade,
  email text not null,
  role text not null check (role in ('owner', 'admin', 'editor', 'moderator', 'viewer')),
  invited_at timestamptz not null default now(),
  primary key (tenant_id, email)
);

insert into admin_invites (tenant_id, email, role)
values ('00000000-0000-0000-0000-000000000001', 'e1rhyme.dev@gmail.com', 'owner')
on conflict (tenant_id, email) do nothing;

alter table users add column if not exists password_hash text;
alter table users add column if not exists email_verified_at timestamptz;

create table if not exists email_verifications (
  id text primary key,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists email_verifications_user_idx on email_verifications (user_id);

create table if not exists password_reset_tokens (
  id text primary key,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz
);

create index if not exists password_reset_tokens_user_idx on password_reset_tokens (user_id);

alter table users add column if not exists terms_accepted_at timestamptz;

create table if not exists pending_consents (
  id text primary key,
  user_id uuid not null references users(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'editor', 'moderator', 'viewer')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists pending_consents_user_idx on pending_consents (user_id);

alter table memorial_settings add column if not exists music_url text not null default '';
alter table memorial_settings add column if not exists music_autoplay text not null default 'off';
alter table memorial_settings add column if not exists music_loop boolean not null default true;

alter table media_submissions add column if not exists display_order integer not null default 999999;

update media_submissions m
set display_order = ranked.rn
from (
  select id, row_number() over (partition by tenant_id order by created_at desc) as rn
  from media_submissions
) as ranked
where m.id = ranked.id and m.display_order = 999999;

create table if not exists content_blocks (
  tenant_id uuid not null references tenants(id) on delete cascade,
  block_key text not null,
  value text not null default '',
  updated_at timestamptz not null default now(),
  primary key (tenant_id, block_key)
);

alter table memorial_settings add column if not exists music_volume smallint not null default 80 check (music_volume between 0 and 100);
