# RADvisor — Discovery Page

**What this file covers:** The browse-by-category discovery experience (the first of three discovery methods).
**Input:** `operators` and `equipment` tables; `CATEGORIES` config.
**Output:** `/app/discover/page.tsx` plus supporting components.
**Sprint:** 1 | Status: Core launch feature.

---

## 1. Purpose

The discovery page is for users who don't yet know exactly what they want. It answers "what can I rent around here?" through a visually appealing, scannable, category-organized layout. It is the default landing experience.

---

## 2. Requirements (WHAT)

- A hero area with a one-line value prop and a prominent entry point into both the **guided questionnaire** (`/find`) and **search** (`/search`).
- A grid of **category cards**, one per active category, each with icon, label, and item count. Hide categories with zero active equipment.
- For each major category, a **horizontal scroll row of popular items** (`is_popular = true`), showing 6–10 item cards.
- Each item card shows: image (or category placeholder), name, brand/model if present, operator name, starting price, and a freshness indicator if `last_verified` is older than 90 days.
- Tapping a category card → category listing page (`/discover/[category]`) showing all active equipment in that category with the same filter panel used by advanced search (`05`).
- Tapping an item card → the operator detail page anchored to that item.
- Fully responsive; horizontal rows become swipeable on mobile.

---

## 3. Layout Spec

```
┌─────────────────────────────────────────┐
│  HERO                                     │
│  "Find your next adventure's gear"        │
│  [ Take the quiz ]   [ Search gear ]      │
└─────────────────────────────────────────┘

  Browse by category
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│ Snow │ │ Bike │ │Water │ │ Camp │  ...
│ 42   │ │ 31   │ │ 28   │ │ 19   │
└──────┘ └──────┘ └──────┘ └──────┘

  Popular in Snow Sports                →
┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐
│item│ │item│ │item│ │item│ │item│   (scroll)
└────┘ └────┘ └────┘ └────┘ └────┘

  Popular in Mountain Biking            →
  ...repeats per category
```

---

## 4. Implementation Notes (HOW)

- **Server component** for the page; fetch data server-side in `page.tsx`.
- One query for category counts (group equipment by category where `is_active`).
- One query per featured row, or a single query for all `is_popular` items then group in memory — prefer the latter to limit round trips.
- Category list and ordering come from `/lib/config/categories.ts`, not the DB.
- Item card and category card are reusable components in `/components` — the same `ItemCard` is reused by search and questionnaire results, so build it generically (props: equipment row + operator summary).
- Use the `frontend-design` skill's guidance for visual polish; lean into a clean, outdoorsy, photo-forward aesthetic. Avoid a generic template look.
- Image placeholders: when `image_url` is null, show a tasteful category-colored placeholder with the category icon, not a broken image.

---

## 5. Freshness Indicator

If an item's `last_verified` is more than 90 days ago, show a small muted "Prices may have changed" note on the card and detail view. Never hide the item — just be honest. This reinforces the "honesty about freshness" principle.

---

## 6. Empty & Loading States

- **Loading:** skeleton cards, not spinners.
- **Empty category:** shouldn't happen (we hide empty categories), but guard against it with a friendly "No gear listed here yet — check back soon."

---

## 7. Known Gaps

- "Popular" is human-curated at launch (`02 §7`). Wire the card so it can later sort by real popularity metrics without a redesign.
- No personalization in v1 — everyone sees the same discovery page.
