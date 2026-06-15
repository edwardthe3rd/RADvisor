# aerial — verification worksheet

Generated: 2026-06-14 · 6 active operators

Re-run: `node supabase/seed/verify/gather_evidence.mjs aerial`

Detected = signals scanned from the website + Google Places text. This is a
**proposal for review**, not applied data.

- **Hard conflicts** contradict current data — resolve these first.
- **Proposals** are additive (e.g. a rental shop that also runs demos, or new
  subcategory tags) — confirm before applying.

## Summary

| Signal | Count |
|--------|------:|
| Rental detected | 1 |
| Demo detected | 0 |
| Lease detected | 0 |
| Retail-only suspected | 1 |
| **Hard conflicts** | **5** |
| Proposals (additive) | 1 |
| Needs manual fetch (no html/Google) | 0 |

## Hard conflicts vs current (review first)

| Operator | Slug | Conflict | Detected | Pages | Snippet |
|------|------|------|------|------:|------|
| Hang Gliding Tahoe | `hang-gliding-tahoe` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 1 | Hang Gliding Tahoe &#x2d; Hang Gliding In Lake Tahoe Skip to content Prices &#038; Packages Gift Certificates The Experience Questions Testimonials About Us Contact Driving Directions Call 775-772-8232 0 items Prices &#0 |
| North Shore Parasail | `north-shore-parasail` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 2 | California Parasail - Parasailing in Catalina Island, Lake Tahoe, Newport Beach & Long Beach Home Parasailing Long Beach Catalina Island Lake Tahoe Newport Beach Santa Barbara View All Locations Seal &#038; Dolphin Tours |
| Slide Mountain Hang Glider Landing Zone | `slide-mountain-hang-glider-landing-zone` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 0 | Slide Mountain Hang Glider Landing Zone  airport point_of_interest transportation_service establishment |
| Sport Aviation Center | `sport-aviation-center-llc` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?); looks retail-only — review for deactivation | retail? | 1 | Our instructors are seasoned pilots teaching full time and not &#8220;time building&#8221; to move onto the airlines. |
| Uprising Paragliding | `uprising-paragliding` | offers_rental=true but no rental signal (retail/tours/maintenance/JS site?) | — | 0 | Uprising Paragliding  educational_institution point_of_interest establishment |

## Proposals — additive, confirm before applying

| Operator | Slug | Proposal | Detected | Snippet |
|------|------|------|------|------|
| Uprising Paragliding | `uprising-paragliding` | propose subcategories: paraglider | — | Uprising Paragliding  educational_institution point_of_interest establishment |

## Needs manual fetch (website + Google both empty)

_None._

## All operators (detected signals + proposed subcategories)

| Operator | Slug | Detected | Subcategories (detected) | Current flags |
|------|------|------|------|------|
| Hang Gliding Tahoe | `hang-gliding-tahoe` | — | — | rental |
| North Shore Parasail | `north-shore-parasail` | — | — | rental |
| Slide Mountain Hang Glider Landing Zone | `slide-mountain-hang-glider-landing-zone` | — | — | rental |
| Soaring NV | `soaring-nv` | rental | — | rental |
| Sport Aviation Center | `sport-aviation-center-llc` | retail? | — | rental |
| Uprising Paragliding | `uprising-paragliding` | — | paraglider | rental |

