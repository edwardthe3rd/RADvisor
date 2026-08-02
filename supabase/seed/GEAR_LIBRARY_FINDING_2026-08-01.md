# Gear libraries: a whole operator class Pass A cannot see

**Trigger:** EC surfaced Carson City's Outdoor Gear Library
(`carsoncity.gov/…/outdoor-equipment-rental`). It is a legitimate, multi-category, publicly-priced
rental operator — and it is **not in the triage ledger at all**.

---

## 1. It is not a gate failure

The obvious suspect was the Gate 3 government-parks block. It is not:

```
GOV_PARKS_HOST_RE = /(^|\.)(parks\.ca\.gov|nps\.gov|fs\.usda\.gov|blm\.gov)$/i
```

`carsoncity.gov` does not match, so the operator was never rejected. **It was never found.**

## 2. It is a Pass A recall failure, and a systematic one

The quadtree sweep is Google Places-driven. A Parks, Recreation & Open Space department is a
`local_government_office` POI named "Carson City Parks and Recreation" or "Robert 'Bob' Crowell
Multi-Purpose Athletic Center" — it will not surface for "kayak rental", "ski rental", or
"bike rental" category searches, no matter how good the AOI coverage is.

**This generalises to an entire operator class:** municipal gear libraries, university outdoor
programs, library-of-things branches, nonprofit lending co-ops, and ranger-station counters. They
rent real gear at published rates, they are frequently the cheapest option in a region, and none
of them are categorised as rental businesses.

This matters directly for the stated portability goal — running a Google-API-populated list
through this system in a new region. **Every region will miss its gear libraries the same way.**

### Suggested fix (Pass A, not Pass B)

Add a small term set to `quadtree_sweep_queries.mjs` aimed at the institution rather than the
gear: `"gear library"`, `"outdoor equipment rental"`, `"equipment checkout"`, `"outdoor program"`,
`"parks and recreation equipment"`, `"library of things"`. Pair it with a targeted host sweep of
`*.gov` / `*.edu` parks-and-rec and outdoor-program pages inside the AOI. These are cheap queries
with a high hit rate, because the operators are few and well-indexed once you ask for them by name.

## 3. It falsified a hard rule in the applier *(fixed)*

The rate card lends a **Disc Golf Set at FREE / FREE / FREE**. The applier rejected any price of
`0` with the message *"free rental gear is not a thing"*. That assumption is simply wrong, and the
rejection was whole-batch — this operator's most user-valuable row would have taken the entire
extraction down with it.

Now: `0` applies and warns; `null` still means unknown; negative still rejects. Documented in
`00_general §7` and covered by three fixtures.

## 4. It exposes a **fourth** duration tier — `weekend`

The rate card has three columns: **DAY / WEEKEND / WEEK**.

`weekend` has no schema tier. This is the fourth independent operator shape the six tiers cannot
model, after: multi-day *rules* (pilot, 4 variants), 2-and-4-hour blocks (Battle Born), and
`$35/month` (Gear Hut).

The pattern is now unambiguous enough to act on. Recommendation, in order of value:

1. **`price_weekend`** — dense here and trivially comparable; a weekend is the single most common
   recreational rental window.
2. **`price_monthly`** — evidenced twice now.
3. A generic `price_block` + `block_hours` pair only if hour-blocks recur; two occurrences so far.

Not implemented — this is a schema change touching the eventual Supabase equipment table, and EC
should decide. But it is the largest remaining source of silently-lost published prices.

## 5. What this operator would contribute if added

Four categories, ~32 items, all with a full three-tier rate card — including the **only**
`disc_golf` inventory found anywhere in the queue:

| Category | Sample items |
|---|---|
| `water_sports` | Sit-on-top kayak (paddle + PFD) $25/$40/$80 · inflatable SUP $25/$40/$80 · PFD · kayak paddle · dry bag · splash jacket/pants · neoprene socks · kayak cart |
| `camping` | Backpacks 50/65/85 L · 2-person tent · backpacking stove · sleeping bag · inflatable + foam pads · trekking poles · mess kit · **bear canister** · headlamp · water filtration · child carrier · 80/123 qt coolers · camping toilet |
| `snow_sports` | Snowshoes $12/$19/$38 · snow gaiters |
| `disc_golf` | **Disc Golf Set — FREE** |

Also notable: a **Snowmaker** ($30/$48/$96, requires air compressor and pressure washer, not
included) which has no gear_type anywhere in the taxonomy, and fee rows (late fee = day charge,
cleaning/repair $15/hour) that are terms rather than inventory.

**Blocked on:** the operator needs a Google `place_id` and a Pass A ledger row before Pass B can
extract it — `pass_b_apply.mjs` keys on `place_id`. That is a Pass A insertion, deliberately not
done here.
