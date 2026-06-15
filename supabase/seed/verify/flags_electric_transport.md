# Electric Transportation — flags for manual review

Generated 2026-06-14 from `gather_evidence.mjs electric_transport` (66 active operators).

**Already applied:** subcategory tags for **48** operators with a confirmed rental
signal (mostly `e_bike_city`, a few `e_scooter` / `onewheel`). No flags changed.

**16 hard conflicts** below (the subcat-scope bug that mixed in water tags is fixed).

---

## A. Miscategorized / not an e-transport rental — review for deactivation or recategorize
- `numotion` — **medical mobility** (wheelchairs/scooters), not consumer e-transport rental → deactivate or recategorize
- `kawasaki-yamaha-of-reno`, `reno-harley-davidson` — **motorcycle dealers**; belong in `motorcycles`, and sell rather than rent → recategorize / `offers_rental=false`
- `kiwanis-activity-center-and-bike-program` — charity bike program, not a rental operator
- `reno-bike-project` — nonprofit bike co-op (retail/repair/education); flagged retail-only → review

## B. Bike shops — verify rent vs retail/repair only
- `bike-lake-tahoe`, `college-cyclery`, `pacos-truckee`, `sierra-bicycle-supply`,
  `sierra-cyclesmith-bicycle-shop`, `velo-reno` — bicycle shops; confirm whether they
  rent e-bikes or are sales/service only (these also appear under cycling categories).

## C. No website — needs manual look
- `wilderbike` — no website on file.

## D. Lease flag — cross-category false alarm, NO ACTION
`tahoe-sports-ltd`, `west-shore-sports`, `west-shore-sports-qmz5wvbk`,
`west-shore-sports-sunnyside` — operator-wide season-lease flag (correct for their
snow gear), not validatable from e-transport pages.

---
Apply decisions via `operator_website_verified.json` + `apply_operator_verified.mjs`.
Note: motorcycle dealers / bike shops here also surface in `motorcycles` /
`mountain_biking` / `road_cycling` runs — decide categorization once.
