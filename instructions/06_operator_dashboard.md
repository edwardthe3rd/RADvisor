# RADvisor — Admin Dashboard & Operator Portal

**What this file covers:** (A) The internal admin data-entry dashboard needed for Sprint 1, and (B) the Sprint 2 operator self-serve portal — stubbed for now.
**Input:** Full schema from `01_data_model.md`.
**Output (Sprint 1):** `/app/admin/*`, password-gated, server-side writes via service role.
**Sprint:** Part A = 1 · Part B = 2.

---

## PART A — Internal Admin Dashboard (Sprint 1, BUILD NOW)

### Purpose
You (the founder) need a fast way to enter, edit, and verify operator and equipment data without touching SQL. This is what makes manual seeding sustainable and keeps `last_verified` current.

### Requirements
- **Access control:** simple gate for v1 — a single admin login via Supabase Auth, or a shared secret in an env var checked server-side. Must **not** be reachable by the public. All writes use the service-role key **server-side only**.
- **Operator list view:** searchable table of all operators with completeness indicators (which fields/SKUs are missing).
- **Operator edit form:** every column from the `operators` table, with the category multi-select bound to config.
- **Equipment management:** within an operator, list/add/edit/delete equipment rows. Inline editing for price fields is ideal (this is the most-edited data).
- **One-click "verify":** a button that sets `last_verified = today` on a row or all of an operator's rows, for when you've just called and confirmed.
- **Bulk import:** ability to re-run / append the seed import (`02`) from the UI or CLI.
- **Completeness dashboard:** a simple metric view — % of operators with full contact info, % of SKUs with brand/model/price, count of records stale >90 days. This tells you where to focus outreach.

### Implementation Notes
- Server actions for all mutations; never expose service-role key to client.
- Reuse the schema TypeScript types so forms stay in sync with the DB.
- Keep it utilitarian — this is internal tooling, not a polished consumer surface. Function over form.

---

## PART B — Operator Self-Serve Portal (Sprint 2, STUB ONLY)

> **Do not build this in Sprint 1.** Documented here so the data model and admin tooling don't paint us into a corner. In Sprint 1, only ensure the schema and RLS can support it later.

### Future purpose
Let operators manage their own inventory, availability, and (later) bookings — the SaaS product that de-risks the marketplace through pre-sales.

### Future requirements (for context only)
- Operator accounts scoped to their own `operator_id` via RLS policies.
- Self-serve inventory CRUD (the operator-facing version of Part A's equipment management).
- Availability calendar per item.
- Stripe subscription billing for the SaaS tier.
- Basic analytics: views, click-throughs, inquiries.

### What Sprint 1 must NOT preclude
- Schema already has `operator_id` FKs and an `inventory_sync_type` field. ✓
- RLS is enabled with public-read; per-operator write policies can be added without migration pain. ✓
- Keep operator-owned data cleanly separated so a future `auth.uid() → operator_id` mapping is straightforward.

---

## Known Gaps

- v1 admin auth is intentionally minimal. Harden before any non-founder gets access.
- No audit log of who changed what in v1; acceptable for a solo operator. Add in Sprint 2 when multiple users exist.
