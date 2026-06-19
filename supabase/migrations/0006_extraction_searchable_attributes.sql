-- Extraction pipeline + searchable attribute layer (01_data_model.md §1, §3).
-- Adds operator-triage state and the bounded equipment attribute/addon vocabulary
-- plus provenance, per instructions/extraction/00_general.md §2-§3.
--
--   operators.rents_gear         triage output (null = not yet triaged)
--   operators.extraction_status  pipeline state, drives the work queue
--   equipment.attributes         per-category searchable bag (keys defined per category file)
--   equipment.addons             bundled accessories/packages, each with optional price
--   equipment.source_url         exact page a price/spec was scraped from (provenance)

-- Operators: triage + pipeline state
alter table operators
  add column if not exists rents_gear        boolean,
  add column if not exists extraction_status text not null default 'untouched';

-- Enforce the bounded status set per the §3 contract (kept as text, not an enum,
-- so values can evolve without an enum migration; drop this if promoting to enum).
alter table operators
  drop constraint if exists operators_extraction_status_check;
alter table operators
  add constraint operators_extraction_status_check
  check (extraction_status in ('untouched', 'triaged', 'extracted', 'needs_review', 'no_rentals'));

-- Work-queue filtering by pipeline state.
create index if not exists operators_extraction_status_idx
  on operators (extraction_status);

-- Equipment: searchable attribute/addon layer + provenance
alter table equipment
  add column if not exists attributes jsonb,
  add column if not exists addons     jsonb,
  add column if not exists source_url text;

-- Granular faceted/quiz filtering acts only on these two jsonb columns.
create index if not exists equipment_attributes_idx
  on equipment using gin (attributes);

create index if not exists equipment_addons_idx
  on equipment using gin (addons);
