-- Enums
create type inventory_sync_type as enum ('manual', 'api', 'scrape', 'none');
create type skill_level as enum ('beginner', 'intermediate', 'advanced', 'all');
create type equipment_condition as enum ('new', 'excellent', 'good', 'fair');

-- Operators table
create table operators (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  slug                  text not null unique,
  description           text,
  address               text,
  city                  text,
  state                 text default 'NV',
  zip                   text,
  lat                   float8,
  lng                   float8,
  phone                 text,
  email                 text,
  website               text,
  booking_url           text,
  hours                 jsonb,
  categories            text[],
  logo_url              text,
  photos                text[],
  rating_external       numeric,
  rating_external_count int,
  inventory_sync_type   inventory_sync_type default 'manual',
  notes_internal        text,
  is_active             boolean default true,
  last_verified         date,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- slug uniqueness comes from the column-level UNIQUE constraint (operators_slug_key);
-- a separate explicit unique index would be an identical duplicate (linter 0009).
create index operators_categories_idx on operators using gin (categories);
create index operators_latlng_idx on operators (lat, lng);

-- Equipment table
create table equipment (
  id                  uuid primary key default gen_random_uuid(),
  operator_id         uuid not null references operators (id) on delete cascade,
  category            text not null,
  subcategory         text,
  name                text,
  brand               text,
  model               text,
  size                text,
  description         text,
  skill_level         skill_level default 'all',
  condition           equipment_condition,
  price_hourly        numeric,
  price_half_day      numeric,
  price_full_day      numeric,
  price_multi_day     numeric,
  price_weekly        numeric,
  deposit             numeric,
  quantity_total      int,
  quantity_available  int,
  image_url           text,
  is_popular          boolean default false,
  is_active           boolean default true,
  last_verified       date,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create index equipment_operator_idx on equipment (operator_id);
create index equipment_category_idx on equipment (category);
create index equipment_category_skill_idx on equipment (category, skill_level);
create index equipment_price_full_day_idx on equipment (price_full_day);

-- updated_at trigger (search_path locked for security: linter 0011)
create or replace function set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger operators_updated_at before update on operators
  for each row execute function set_updated_at();
create trigger equipment_updated_at before update on equipment
  for each row execute function set_updated_at();

-- RLS
alter table operators enable row level security;
alter table equipment enable row level security;

create policy "public read active operators" on operators
  for select using (is_active = true);
create policy "public read active equipment" on equipment
  for select using (is_active = true);
