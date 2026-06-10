# RADvisor — Search & Advanced Filters

**What this file covers:** Basic keyword search and the advanced filter interface (the third discovery method).
**Input:** `operators` + `equipment` tables.
**Output:** `/app/search/page.tsx`, a shared `FilterPanel` component, and search query helpers.
**Sprint:** 1 | Status: Core launch feature.

---

## 1. Purpose

For users who know what they're looking for. Basic search handles "I'll type what I want"; advanced filters handle "let me narrow precisely."

---

## 2. Basic Search

### Requirements
- A single search box (also present in the global header).
- Matches across: equipment `name`, `brand`, `model`, `category`/`subcategory` labels, and operator `name`.
- Case-insensitive, partial-match, typo-tolerant where cheap.
- Returns a unified result list of equipment items (reusing `ItemCard`), with operators surfaced as a small separate section if the query matches a business name.

### Implementation
- Use Postgres full-text search (`tsvector`) across the relevant columns, or `ilike` for a simpler v1. Recommend a generated `tsvector` column on `equipment` combining name/brand/model + category label for ranked results.
- Debounce input (~250ms); show results as you type on desktop, on submit for mobile.
- Rank: exact name match > brand/model match > category match.

---

## 3. Advanced Filters (`FilterPanel`)

A shared component used by: advanced search, category listing pages (`03`), and optionally questionnaire results refinement. Build it once, reuse everywhere.

### Filters

| Filter | Control | Maps to |
|---|---|---|
| Category | multi-select | `equipment.category` |
| Subcategory | multi-select (depends on category) | `equipment.subcategory` |
| Price range | dual slider | chosen price tier |
| Price tier | toggle | hourly / half / full / multi-day / weekly |
| Skill level | multi-select | `equipment.skill_level` |
| Brand | multi-select (populated from data) | `equipment.brand` |
| Operator | multi-select | `operators.id` |
| Distance from location | slider + location picker | haversine vs `operators` coords |
| Has photos | toggle | `image_url is not null` |
| Verified recently | toggle | `last_verified` within 90 days |

### Behavior
- Filters combine with AND across types, OR within a multi-select.
- Show active-filter chips above results; each chip removable.
- Show live result count as filters change.
- URL-encode all filter state so results are shareable and bookmarkable.
- "Clear all" resets to the unfiltered category/search view.

---

## 4. Results

- Same `ItemCard` grid as discovery and questionnaire.
- Sort options: Price (low→high / high→low), Distance, Recently verified, Alphabetical.
- Default sort: relevance (search) or distance (browse).
- Pagination or infinite scroll; at launch volume (~hundreds of items) simple pagination is fine.

---

## 5. Implementation Notes (HOW)

- Centralize query-building in `/lib/search/buildQuery.ts` so search, browse, and questionnaire all construct Supabase queries the same way from a shared `Filters` type.
- Brand and operator filter option lists come from a lightweight distinct-values query, cached.
- Keep the `Filters` type identical to the questionnaire's answer shape where they overlap, so refinement can hand off cleanly between the two flows.

---

## 6. Known Gaps

- No semantic/AI search in v1 (keyword + filters only). The query-builder abstraction leaves room to add it later.
- Typo tolerance is best-effort; don't over-invest. Trigram similarity (`pg_trgm`) is a good cheap upgrade if needed.
