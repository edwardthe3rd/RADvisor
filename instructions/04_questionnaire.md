# RADvisor — Guided Questionnaire

**What this file covers:** The step-by-step walkthrough that pinpoints the right gear (the second discovery method).
**Input:** `equipment` + `operators` tables; `CATEGORIES` and `geo` config.
**Output:** `/app/find/page.tsx` (a client-driven multi-step flow) → results view.
**Sprint:** 1 | Status: Core launch feature, most complex.

---

## 1. Purpose

For users who know they want to do *something* outdoors but aren't sure what gear, where, or what it costs. The questionnaire collects activity, skill, location, timing, and budget, then returns a ranked, filtered set of matching gear.

---

## 2. UX Principles

- **One question per screen.** Big tappable options, mobile-first.
- **Progress indicator** (e.g. "Step 2 of 5").
- **Back navigation** preserves prior answers.
- **No account required.** State lives in client memory (React state / URL params), not a DB.
- **Always returns something.** If filters are too narrow and yield zero results, progressively relax the least-important constraint (budget first, then skill) and tell the user you did.

---

## 3. The Flow (Decision Table)

### Step 1 — Activity (always shown)
> "What do you want to do?"

Options are the top-level categories from config:
`Snow Sports · Mountain Biking · Road & Gravel · Water Sports · Camping · Camper Vans & RVs · Off-Road · Rock Climbing · Electric Transport · Aerial · Not sure yet`

"Not sure yet" → skip to a simplified path that only asks location + budget and returns popular items across categories.

### Step 2 — Subtype / Skill (conditional on Step 1)

| Step 1 selection | Step 2 question | Options |
|---|---|---|
| Snow Sports | "Skis or board, and how experienced?" | maps to subcategory + `skill_level` |
| Mountain Biking | "What kind of riding?" | XC / Trail / Enduro / Downhill / E-MTB → subcategory |
| Road & Gravel | "Road, gravel, or electric?" | → subcategory |
| Water Sports | "Which activity?" | Kayak / SUP / Raft / Jet Ski / Wakeboard / Boat → subcategory |
| Camping | "Tent camping or vehicle?" | branches to camping vs camping_vehicles |
| Camper Vans & RVs | "Van, RV, or trailer?" | → subcategory |
| Off-Road | "ATV, UTV, dirt bike, or snowmobile?" | → subcategory |
| Rock Climbing | "Experience level?" | → `skill_level` |
| Electric Transport | "Scooter, e-bike, or onewheel?" | → subcategory |
| Aerial | "Which activity?" | → subcategory |

Where a category implies a skill question, ask it here; otherwise default `skill_level` filter to `all`.

### Step 3 — Location
> "Where's your adventure?"

Options: a curated list of regional spots (predefined in config) plus free text.
- Predefined spots: Lake Tahoe (North/South), Truckee, Mt. Rose, Northstar, Palisades, Pyramid Lake, Carson River, Reno city, Donner, etc.
- Location is used to **sort operators by proximity** to the spot, not to hard-filter (a Reno shop still rents gear used at Tahoe). Store spot coordinates in `/lib/config/locations.ts`.

### Step 4 — Timing
> "When and for how long?"

- Start date (date picker) + duration (Half day / Full day / 2–3 days / Week+).
- Duration selects which price tier to display and sort by (`price_half_day`, `price_full_day`, `price_multi_day`, `price_weekly`).
- If an item lacks the chosen tier, fall back to the next available tier and note it.

### Step 5 — Budget
> "What's your budget per day?"

- Slider, e.g. $0–$500+, plus a "no limit" option.
- Filters on the price tier chosen in Step 4.

---

## 4. Results Logic

Build the query from collected answers:

```
SELECT equipment JOIN operators
WHERE equipment.is_active AND operators.is_active
  AND category = {step1}                       -- unless "not sure"
  AND (subcategory = {step2} OR {step2 is null})
  AND (skill_level IN ({step2_skill}, 'all') OR {no skill asked})
  AND ({chosen_price_tier} <= {budget_max} OR {no limit})
ORDER BY
  operator distance to {step3 location} ASC,
  {chosen_price_tier} ASC
```

- Compute distance in SQL (haversine) or post-query in JS for ~hundreds of rows (fine at this scale).
- **Zero-result fallback:** relax budget → relax skill → broaden subcategory → finally show popular items in the category. Always tell the user what was relaxed ("No advanced downhill bikes under $40/day nearby — here are the closest matches").

---

## 5. Results View

- Reuse the `ItemCard` component from the discovery page.
- Show a summary chip bar of the user's answers, each editable (tap to jump back to that step).
- Each result shows the price for the **chosen duration tier**, the operator, distance from the chosen location, and a CTA to the operator detail page.
- Include a "Start over" and "Refine answers" action.

---

## 6. Implementation Notes (HOW)

- The flow is a **client component** holding answer state; consider encoding answers in the URL (`/find?activity=snow_sports&skill=beginner...`) so results are shareable and back/forward works.
- The final results fetch can be a server action or a route handler that takes the answer params and returns matches.
- Keep the question definitions in a **config-driven structure** (an array of step objects with conditional `next` logic) rather than hard-coded JSX per step — this makes adding/reordering questions trivial.

---

## 7. Known Gaps

- No real-time availability check in v1 — results show gear that *exists*, with a "contact to confirm availability" CTA, not a guaranteed bookable slot.
- Location proximity uses operator location, not where gear can be delivered/used. Good enough for v1.
