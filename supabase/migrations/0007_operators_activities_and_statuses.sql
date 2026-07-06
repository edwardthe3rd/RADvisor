-- Align operator extraction state with the Pass A/Pass B instructions.
-- Adds the winter/activity browse axis and allows gate-ladder terminal statuses
-- that are already documented in instructions/01_data_model.md.

alter table operators
  add column if not exists activities text[];

alter table operators
  alter column offers_rental set default false;

create index if not exists operators_activities_idx
  on operators using gin (activities);

alter table operators
  drop constraint if exists operators_extraction_status_check;

alter table operators
  add constraint operators_extraction_status_check
  check (
    extraction_status in (
      'untouched',
      'triaged',
      'extracted',
      'needs_review',
      'no_rentals',
      'out_of_region',
      'out_of_scope',
      'out_of_business',
      'not_an_operator'
    )
  );
