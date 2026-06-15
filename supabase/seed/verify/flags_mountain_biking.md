# Mountain Biking — flags for manual review

Generated 2026-06-14 from `gather_evidence.mjs mountain_biking` (51 active operators).

**Already applied:** subcategory tags (`xc_bike` / `trail_bike` / `enduro_bike` /
`downhill_bike` / `ebike_mtb` / `kids_bike`) for **26** operators with a confirmed
rental signal. No flags changed.

**11 hard conflicts:**

## A. Bike shops — verify rent vs retail/repair (recurring across cycling categories)
`bike-lake-tahoe`, `college-cyclery`, `pacos-truckee`, `sierra-cyclesmith-bicycle-shop`,
`velo-reno` — also flagged under `road_cycling` / `electric_transport`. Decide rent
vs sales/service once.

## B. Not a rental operator
`kiwanis-activity-center-and-bike-program` — charity bike program.

## C. Cross-category flag artifacts — NO ACTION
- `rmu-truckee-ski-shop` — `offers_demo=true` is correct for its **snow** demo status;
  it shows here because it's also tagged `mountain_biking` (verify that categorization).
- `tahoe-sports-ltd`, `west-shore-sports` ×3 — operator-wide snow-lease flag.
