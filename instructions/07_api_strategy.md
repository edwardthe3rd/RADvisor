# RADvisor — Inventory Sync Strategy

**What this file covers:** How RADvisor gets and keeps accurate inventory/availability data from operators — the hardest data problem, and how to phase it realistically.
**Input:** `operators.inventory_sync_type`, `equipment.quantity_available`.
**Output:** A phased plan; no full implementation required in Sprint 1 beyond honest "contact to confirm" UX.
**Sprint:** Strategy spans 1–3.

---

## 1. The Core Problem

Rental availability changes constantly and lives in dozens of different operator systems (or in someone's head / paper book). There is no single API to plug into. Trying to solve real-time availability for all operators at launch would sink the timeline. So we phase it.

---

## 2. Phased Approach

### Tier 1 — Manual (Launch / Sprint 1) ✅ Build this
- Data entered and verified through the admin dashboard (`06A`).
- `inventory_sync_type = 'manual'`, `quantity_available = null`.
- Consumer UX: show gear that exists with pricing and a **"Contact to confirm availability"** CTA (phone/website/booking link). Honest, shippable, works for all operators immediately.

### Tier 2 — Operator self-serve (Sprint 2)
- Operators you pre-sell update their own inventory and a simple availability calendar via the portal (`06B`).
- `inventory_sync_type = 'manual'` but now operator-maintained; `quantity_available` can become meaningful.
- Highest-value because it doubles as your SaaS product.

### Tier 3 — Direct API / booking-platform integrations (Sprint 3+)
- Many rental shops use booking platforms (e.g. FareHarbor, Checkfront, Rezdy, Peek). Where an operator uses one, integrate via that platform's API rather than building per-shop.
- `inventory_sync_type = 'api'`. Scheduled jobs (or webhooks where supported) refresh `quantity_available` and pricing.
- Prioritize whichever platform the most regional operators already use — find this out during outreach.

### Tier 4 — Scheduled scrape (opportunistic, any time)
- For operators with public real-time booking pages but no API, a scheduled scraper can refresh pricing/availability.
- `inventory_sync_type = 'scrape'`. Higher maintenance, brittle — use only where it clearly pays off, and respect each site's terms.

---

## 3. Recommended Launch Posture

**Ship Tier 1 only.** Add a `last_verified` date to everything and a clear freshness indicator (`03 §5`). This is honest and removes the integration blocker from the critical path. Treat Tiers 2–4 as a roadmap, not a launch requirement.

When you talk to operators (for seeding and pre-sales), capture two things that drive later tiers:
1. **What booking/inventory system do they use today?** (reveals Tier 3 opportunities and which platform to integrate first).
2. **Would they maintain their own listing if given a simple tool?** (validates the Sprint 2 portal).

---

## 4. Data Handling Rules

- `quantity_available = null` means **unknown**, never zero. UI must reflect this.
- Never show a hard "in stock / out of stock" claim unless it comes from a live Tier 2/3 source.
- Any synced source must update `last_verified` on write so freshness stays truthful.

---

## 5. Known Gaps / Open Questions

- Which booking platform dominates among Reno-Tahoe operators? **Answer via outreach before committing Tier 3 engineering.**
- Some operators have no digital system at all; for them, Tier 2 (giving them a tool) may be the *only* path to fresh data — another reason the portal matters.
