# RADvisor — Project Overview & Master Instructions

**What this file covers:** The north-star vision, tech stack, conventions, and how the rest of these instruction files fit together.
**Read this first.** Every other file assumes you've read this one.

---

## 1. Vision

RADvisor (theradvisor.com) is a discovery platform connecting outdoor enthusiasts with gear-rental operators in the Reno–Tahoe region (a 50-mile radius around Reno, NV). The launch goal is a complete, accurate, browsable database of every rental operator in the region and the gear they rent, surfaced through three discovery experiences:

1. **Discovery page** — a visually appealing, category-organized browse experience.
2. **Guided questionnaire** — a step-by-step walkthrough that pinpoints the right gear by activity, location, skill level, budget, and duration.
3. **Search** — a basic keyword search plus an advanced filter interface.

Long-term the platform expands into operator SaaS tools, booking/commissions, and geographic expansion — but **none of that is in scope for v1.** See "Out of Scope" below.

---

## 2. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 14 (App Router) | Server components by default |
| Language | TypeScript | Strict mode on |
| Database | Supabase (Postgres) | Source of truth for all data |
| Auth | Supabase Auth | Not needed for v1 consumer flows; used in Sprint 2 |
| Storage | Supabase Storage | Operator logos, equipment photos |
| Styling | Tailwind CSS | Mobile-first |
| Email | AWS SES | Transactional only |
| Payments | Stripe + Stripe Connect | Sprint 3 — stub for now |
| Hosting | AWS (Amplify recommended for v1) | |
| Dev tooling | Cursor | Generate Supabase types for accurate completions |

### Why this stack
Speed and solo-founder maintainability. Supabase replaces ~8 AWS services (RDS, Cognito, S3, API Gateway, etc.) with one managed product, freeing engineering time for product and operator outreach. Standard Postgres underneath means no data-layer lock-in.

---

## 3. Core Principles

1. **Mobile-first.** Most users browse near a trailhead on a phone. Design for a 380px viewport first, then scale up.
2. **Speed over perfection.** Launch with manually-seeded data. Automate inventory sync later.
3. **Honesty about freshness.** Every equipment record carries a `last_verified` date. Never imply real-time availability we don't have.
4. **Operator trust.** Every feature should be useful to operators, not just consumers — they are the supply side and future paying customers.
5. **Reference the schema, don't redefine it.** `01_data_model.md` is the single source of truth. Other files reference column names; they never invent new ones.

---

## 4. Repository Conventions

```
/app                    ← Next.js App Router pages
  /discover             ← Discovery page (03)
  /find                 ← Guided questionnaire (04)
  /search               ← Search + advanced filters (05)
  /operators/[slug]     ← Business detail pages
  /admin                ← Internal data-entry dashboard (Sprint 1, gated)
/components             ← Reusable UI
/lib
  /supabase             ← Client + server helpers, generated types
  /config               ← Static config (categories, locations)
/instructions           ← These files
/supabase
  /migrations           ← SQL migrations (schema source of truth)
  /seed                 ← Seed scripts for operator/equipment data
```

### Naming
- Files/components: `PascalCase.tsx` for components, `kebab-case` for routes.
- DB: `snake_case` tables and columns, always plural table names.
- Categories use a stable `snake_case` slug everywhere (`snow_sports`, never "Snow Sports" in code).

---

## 5. Sprint Plan

| Sprint | Focus | Files |
|---|---|---|
| **1 (now)** | Consumer discovery: schema, seed data, discovery page, questionnaire, search, detail pages, admin entry | 01–05 |
| 2 | Operator SaaS dashboard: self-serve inventory, availability, Stripe billing | 06 |
| 3 | Booking + commission layer, accounts, reviews | (future) |

Each feature file is tagged with its sprint. **If a file is tagged Sprint 2/3, build only the stubs described, not the full feature.**

---

## 6. MVP Definition of Done (Sprint 1)

- [ ] Supabase schema deployed via migration (`01`)
- [ ] All regional operators seeded with known equipment (`02`)
- [ ] Every equipment row has a `last_verified` date
- [ ] Discovery page: category grid + popular items (`03`)
- [ ] Guided questionnaire: full conditional flow → results (`04`)
- [ ] Basic search + advanced filter panel (`05`)
- [ ] Operator detail page with full inventory
- [ ] Admin data-entry dashboard (internal, password-gated)
- [ ] Mobile-responsive across all pages
- [ ] Deployed to a public URL

---

## 7. Out of Scope for v1

- Real-time availability / live inventory counts
- Online booking, carts, payments
- Consumer user accounts, favorites, reviews
- Operator self-serve portal (Sprint 2)
- Insurance upsell, subscriptions, financing (later)
- Any geography outside the 50-mile Reno radius

When in doubt, ship less. A tight, accurate, fast v1 beats a broad, half-working one.

---

## 8. How to Use These Files

Each file opens with a **Contract** block (what it covers, its inputs, its outputs). When implementing a feature, read its file plus `01_data_model.md`. If an instruction conflicts with the data model, the data model wins — flag the conflict rather than silently diverging.
