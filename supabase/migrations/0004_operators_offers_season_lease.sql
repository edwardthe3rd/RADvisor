alter table operators
  add column if not exists offers_season_lease boolean not null default false;

create index if not exists operators_offers_season_lease_idx
  on operators (offers_season_lease)
  where offers_season_lease = true;
