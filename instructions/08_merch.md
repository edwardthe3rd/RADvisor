# RADvisor — Merch (RAD: Real Adventures Daily)

**What this file covers:** The `/shop` merch storefront — print-on-demand apparel and gear under the RAD (Real Adventures Daily) brand.
**Input:** Printful catalog (source of truth for products); Stripe (payment); AWS SES (confirmation email). No input from the rental schema.
**Output:** `/app/shop/*`, server-only Printful + Stripe clients, three API route handlers.
**Sprint:** 3 (Phase 2 in `00_vision.md`) | Status: Spec only. **Do not build in Sprint 1.** See §11 for timing.

---

## 1. Purpose & Strategic Fit

RAD merch turns brand affinity into revenue and turns customers into walking advertising. It is the cheapest layer in the stack to operate: print-on-demand means **zero inventory, zero warehousing, zero upfront capital** — Printful manufactures and ships each item only after it sells. That fits bootstrap discipline perfectly.

"Real Adventures Daily" is the consumer-facing expression of the mission in `00_vision.md` §1: presence, the outdoors as meditation, adventure as a daily practice. The merch is the message, not a side hustle.

---

## 2. The Three Decisions (and why)

1. **It lives at `theradvisor.com/shop`** — a route in the existing Next.js app, not a separate domain or subdomain. This inherits the main domain's authority, adds no hosting cost, and keeps cross-sell with the rental marketplace one click away. A separate Shopify store or domain would forfeit all three.
2. **Printful for fulfillment** — POD via their API. No capital tied up in stock, no fulfillment ops for a solo founder.
3. **Plain Stripe for checkout — NOT Stripe Connect.** Connect is for the marketplace commission splits (paying operators their 85% in Sprint 3). Merch is RAD's own product with no third-party payee, so it uses standard Stripe Checkout. Do not route merch through Connect; that's needless complexity.

---

## 3. Architecture (WHAT)

```
Printful  ──(catalog: products, variants, retail prices, images)──►  cached fetch  ──►  /shop UI
Customer cart (client state) ──► /api/shop/checkout ──► Stripe Checkout Session ──► Stripe-hosted payment
Stripe webhook (checkout.session.completed) ──► /api/shop/webhook ──► Printful create+confirm order ──► SES email
```

- **Printful is the source of truth for the catalog and retail prices.** We never duplicate the product catalog into Supabase. We fetch and cache it.
- **Stripe is the source of truth for payments. Printful is the source of truth for fulfillment.** For v1, those two dashboards are your order records — no first-party orders table required (see §4).
- The cart is **client state only** (React state / URL), mirroring the no-DB-state pattern from the questionnaire (`04 §2`). No account, no server cart for v1.

---

## 4. No New Core Schema

**This file adds nothing to `01_data_model.md`.** Merch is a separate domain from `operators`/`equipment`; conflating them would pollute the clean rental schema. Products live in Printful; orders live in Stripe + Printful.

**Optional, deferred — not for v1:** if you later want first-party order records (for customer service or rental cross-sell linkage), add an *isolated* `shop_orders` table in its own migration — **not** in the core data model file:

```sql
-- FUTURE / OPTIONAL. Separate concern from the rental schema.
-- stripe_session_id (pk/unique) · printful_order_id · email
-- line_items jsonb · amount_total · status · created_at
```

Until then, lean on Stripe + Printful. Ship less.

---

## 5. Checkout Flow (HOW)

1. **Cart** — client adds Printful variant IDs + quantities to React state; a cart drawer shows line items and subtotal from cached retail prices.
2. **Checkout** — `POST /api/shop/checkout` with the cart. Server creates a Stripe Checkout Session (`mode: 'payment'`): `line_items` built from cached Printful retail prices, `shipping_address_collection` on, `shipping_options` (see §8), `automatic_tax` via Stripe Tax, and a compact cart encoded in session `metadata`. Return the session URL; client redirects to Stripe.
3. **Payment** — Stripe hosts payment and shipping-address collection. We never touch card data.
4. **Fulfillment** — Stripe webhook `checkout.session.completed` → `/api/shop/webhook`. Verify the signature, read the cart + shipping address, then call Printful **create order** and **confirm order**. Use the Stripe session id as Printful's `external_id` so a duplicate webhook delivery can't double-create an order (idempotency, same principle as the idempotent seed in `02 §2`).
5. **Confirmation** — send a confirmation email via AWS SES; show `/shop/success` keyed off the `session_id` query param.

---

## 6. Launch Catalog

Start narrow and high-margin. Priority order:

| Category | Why | Margin |
|---|---|---|
| Insulated drinkware (tumblers, bottles) | Best margin, broad appeal, low size complexity (no apparel sizing returns) | Highest |
| Performance headwear (beanies, trucker/run caps) | Cheap, impulse-buy, high visibility as advertising | High |
| Technical apparel (tees, hoodies, sun shirts) | Core brand wear; sizing adds complexity | Med |
| Gear bags / packs | Higher ticket, on-brand utility | Med |
| Stickers & decals | Tiny price, near-pure margin, cheap brand seeding | Highest % |

Keep the launch SKU count small (a handful of designs × a few products). A tight, well-designed line beats a sprawling one — same principle as the rental v1.

---

## 7. Cross-Sell — the strategic point of `/shop`

This is *why* merch shares the domain. Wire these once discovery has traffic:
- A subtle "RAD gear" entry point in the global header / footer alongside discovery, find, and search.
- A merch strip on the discovery page (`03`) and operator detail pages ("Gear up before you go").
- A discovery/quiz CTA on `/shop` and in the confirmation email ("Now go find your adventure →").

Merch with no audience sells nothing; the rental side is the audience. The flow runs both directions.

---

## 8. Implementation Notes (HOW)

- **Routes:**
  ```
  /app/shop/page.tsx            ← storefront grid
  /app/shop/[product]/page.tsx  ← product + variant picker
  /app/shop/success/page.tsx    ← post-checkout
  /app/api/shop/catalog         ← server proxy for the Printful catalog (cached)
  /app/api/shop/checkout        ← creates the Stripe session
  /app/api/shop/webhook         ← Stripe → Printful fulfillment
  /lib/printful/                ← Printful client (server-only)
  /lib/stripe/                  ← Stripe client (server-only; reused by booking later)
  ```
- **Secrets — server-side only:** `PRINTFUL_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`. Same rule as the service-role key: never client-side. **Exception by design:** `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` *is* meant for the client — that's its purpose; don't confuse it with the secret key.
- **Catalog caching:** fetch Printful's synced products/variants and cache with periodic revalidation (Next.js `fetch` `revalidate`/ISR). At a few dozen SKUs this is trivial and keeps Printful from being hit on every page load.
- **Retail price = single source of truth in Printful** (set each variant's retail price there). Don't duplicate prices in our config; margin = retail − Printful's charge.
- **Shipping/tax (v1 simplest):** a small set of flat-rate `shipping_options` in Stripe Checkout + Stripe Tax `automatic_tax`. Set flat rates to roughly cover Printful's actual shipping. **Upgrade:** call Printful's shipping-rate estimate before creating the session and pass the real rate.
- **Reuse `ItemCard`?** No — merch needs its own `ProductCard` (variants, sizing, no operator/distance). Keep it separate from the rental components.
- **Polish:** use the `frontend-design` skill for the storefront, same outdoorsy, photo-forward aesthetic as discovery (`03 §4`).

---

## 9. Brand & Design Rules

- **Original designs only.** Never upload copyrighted, licensed, or trademarked artwork (other brands' logos, sports teams, characters, song lyrics). Printful will reject it and it's a legal liability. RAD's own marks and original art only.
- Voice ties to the mission: presence, adrenaline-as-meditation, "Real Adventures Daily." Aspirational but unpretentious — for the person who's never done it as much as the dawn-patrol regular.

---

## 10. Mobile-First

- Storefront grid, variant picker, and cart drawer must all work at 380px.
- Variant/size selection uses big tappable controls, not tiny dropdowns.
- Redirect-based Stripe Checkout is the mobile-friendliest path (no custom card form to maintain).

---

## 11. When to Build It

Merch shares almost nothing with the rental engine, so it's technically decoupled from the booking/commission layer — it could ship as a lightweight standalone at any point after Sprint 1. **But don't build it before the discovery side has real traffic.** A store with no visitors earns nothing; the rental marketplace is the audience that makes merch convert. Recommended trigger: discovery is live, indexed, and pulling visitors → then merch is a fast, low-risk add (largely a catalog fetch + Stripe Checkout + one webhook).

---

## 12. Out of Scope for Merch v1

- **B2B wholesale / operator co-branded staff kits** — a real opportunity (co-branded apparel for the operators you pre-sell), but it's a separate sales motion with bulk pricing and approvals. Later phase.
- Consumer accounts, saved carts, wishlists, subscriptions.
- Loyalty/discount engine beyond a basic Stripe promo code.
- Any inventory the founder holds — POD only.

---

## 13. Known Gaps

- Flat-rate shipping will sometimes under/over-cover Printful's actual cost until the rate-estimate upgrade lands. Acceptable at launch volume.
- No first-party order record in v1 (Stripe + Printful dashboards only); add the isolated `shop_orders` table (§4) if/when customer service or cross-sell linkage needs it.
- Printful production/ship times are longer than stock fulfillment; set expectations in product copy and the confirmation email.
