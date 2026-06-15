# Intake classifier — raw Google Places → categorized rental operators

A repeatable filter that takes a new batch of businesses (Google Places data) and
decides, for each: **is it a gear-rental operator?** and if so, **what does it
rent?** — reproducing the accept/reject/categorize decisions already baked into the
live database.

## The decision

Each operator gets one of three outcomes:

| Outcome | Meaning | What to do |
|---------|---------|------------|
| **keep** | confident gear-rental operator | auto-add (categories + subcategories + rental/demo/lease flags are filled in) |
| **reject** | confident *not* a rental operator (tour, charter, dealer, retail, nonprofit, school, gym, aerial experience, closed) | drop |
| **review** | ambiguous — no rental signal and no clear non-rental marker (often a JS-only site, missing Google summary, or a borderline shop) | check by hand |

It is tuned so the confident decisions are high-precision; everything genuinely
uncertain is routed to **review** rather than guessed.

## Running a new batch

1. Make an input file — a JSON array of place IDs or objects:
   ```json
   ["ChIJ…","ChIJ…"]
   // or
   [{ "place_id": "ChIJ…", "name": "Optional", "website": "https://optional" }]
   ```
   (Objects with a `notes_internal` containing `google_place_id:ChIJ…`, i.e.
   operators.json rows, also work.)

2. Classify:
   ```
   node supabase/seed/verify/intake/classify_batch.mjs --input my_batch.json
   ```
   Needs `GOOGLE_PLACES_API_KEY` (backend/.env) + network.

3. Outputs land in `intake/out/`:
   - `<batch>.review.md` — keep / review / reject grouped, with reasons
   - `<batch>.keep.seed.json` — operators.json-shaped rows for the confident keeps
   - `<batch>.classified.json` — full results incl. raw signals

4. Merge the keeps into `operators.json`, hand-resolve the review list, then seed.

## How it works

`signals.mjs` turns a place_id into a feature bundle: Google `primaryType` / `types`
/ editorial-generative-review summary, plus website-derived signals (rental / demo /
lease keywords, equipment-type subcategories per category, and a closed-business
check). `classify.mjs` scores that bundle.

Signals were **empirically calibrated against the live DB** — only signals with zero
active-operator false-rejects auto-reject (e.g. primaryType
`association_or_organization` / `educational_institution` / `gym` / `airport` /
`car_dealer`; aerial/nonprofit name patterns; "dealership"/"boat charter" summaries).
Ambiguous markers (a lone `bicycle_store`/`clothing_store` type, a "tours"/"charter"
name, a dealer name) only trigger **review** unless two independent markers stack up.

## Validating / re-tuning

```
node supabase/seed/verify/intake/build_dataset.mjs   # refresh labels+signals from current DB (network, ~10 min)
node supabase/seed/verify/intake/validate.mjs --errors
```

`validate.mjs` segments operators into `active` (should never be rejected),
`non_rental_deact` (the businesses you deactivated as non-rental — should never be
kept), and `other_inactive` (geography/duplicate — informational). It prints a
confusion matrix and lists every misclassification. Re-run `build_dataset.mjs`
whenever the DB labels change so the calibration tracks your decisions.

## Latest validation (vs live DB, 398 operators)

**Filter (the "match the active businesses" job) — the validated core:**
- Active operators wrongly rejected: **0 / 245 (0%)**
- Non-rental businesses wrongly kept: **2 / 62 (3%)** — and both are *duplicates* of
  other active operators (i.e. genuinely rental businesses), so **0 true false-keeps**
- Active auto-kept (no review): **78%** · non-rental auto-rejected: **35%** · routed to review: **30%**

**Categorization — a strong suggestion, not the source of truth:**
- Exact category match: **47%**; operators with ≥1 false category: **24%** (down from 65% before tuning)
- **86%** of kept operators get at least one correct category (a usable head-start); 11% get none (JS-only sites)

The filter reliably reproduces *which* businesses belong. Categories are a first pass —
precise subcategory tagging is the job of the per-category `gather_evidence` pipeline
(`../gather_evidence.mjs`), which an operator goes through after it's filed under a category.
Run `tune_categories.mjs` to compare category-combination rules offline.

## Two-stage workflow (how this fits the whole system)

1. **Intake** (this folder) — raw Google batch → keep/reject/review + suggested categories.
   Confident keeps land in `out/<batch>.keep.seed.json`.
2. **Per-category verification** (`../gather_evidence.mjs <category>`) — for the kept
   operators, accurate within-category subcategory + rental/demo/lease tagging, with a
   `flags_<category>.md` worksheet for founder confirmation (the pipeline used for the
   original catalog build).

## Known limits (handled elsewhere, by design)

- **Duplicates** (two listings for one shop) classify as rental operators correctly —
  the classifier can't dedup. Resolve duplicates separately (by website / name+location).
- **Geography** (50-mi radius) is not the classifier's job — that filter lives in
  `export_django.py`. `other_inactive` operators are often real rental shops outside
  the radius, so the classifier rightly keeps/queues them.
- **JS-only sites with no Google summary** carry no readable rental signal → routed to
  review. This is the bulk of the review pile and unavoidable without a manual look.
