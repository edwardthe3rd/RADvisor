# burning_man_bikes — verification worksheet

Generated: 2026-06-14 · 1 active operators

Re-run: `node supabase/seed/verify/gather_evidence.mjs burning_man_bikes`

Detected = signals scanned from the website + Google Places text. This is a
**proposal for review**, not applied data.

- **Hard conflicts** contradict current data — resolve these first.
- **Proposals** are additive (e.g. a rental shop that also runs demos, or new
  subcategory tags) — confirm before applying.

## Summary

| Signal | Count |
|--------|------:|
| Rental detected | 0 |
| Demo detected | 0 |
| Lease detected | 0 |
| Retail-only suspected | 0 |
| **Hard conflicts** | **1** |
| Proposals (additive) | 0 |
| Needs manual fetch (no html/Google) | 0 |

## Hard conflicts vs current (review first)

| Operator | Slug | Conflict | Detected | Pages | Snippet |
|------|------|------|------|------:|------|
| Bicycle Service Center | `bicycle-service-center` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 0 | Bicycle Service Center  bicycle_store sporting_goods_store manufacturer car_repair store point_of_interest service establishment |

## Proposals — additive, confirm before applying

_None._

## Needs manual fetch (website + Google both empty)

_None._

## All operators (detected signals + proposed subcategories)

| Operator | Slug | Detected | Subcategories (detected) | Current flags |
|------|------|------|------|------|
| Bicycle Service Center | `bicycle-service-center` | — | — | rental |

