alter table operators
  add column if not exists offers_delivery boolean not null default false;

create index if not exists operators_offers_delivery_idx
  on operators (offers_delivery)
  where offers_delivery = true;
