-- Explicit acquisition flags + per-operator subcategory tags.
-- Replaces the "(Demo Only)" name suffix and the hardcoded demo/lease slug sets:
-- an operator can now offer rentals AND demos (and a season lease) independently,
-- and carry the specific subcategories (equipment types) it actually offers.
alter table operators
  add column if not exists offers_rental  boolean not null default true,
  add column if not exists offers_demo    boolean not null default false,
  add column if not exists subcategories  text[]  not null default '{}';

create index if not exists operators_offers_demo_idx
  on operators (offers_demo)
  where offers_demo = true;

create index if not exists operators_subcategories_idx
  on operators using gin (subcategories);
