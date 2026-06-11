"""Export Django catalog businesses to supabase/seed/operators.json.

Transitional bridge (instructions/02_database_seeding.md): the legacy Django
backend holds the Google-synced operator list; Supabase is the target source
of truth. Run from backend/ with its venv:

    cd backend && .venv/bin/python ../supabase/seed/export_django.py

Normalization rules applied here (02 §3, §6):
- Django category slugs map to canonical slugs; unmapped slugs are logged and
  the business is skipped only if NO category maps.
- Businesses outside the 50-mile Reno radius are excluded (logged).
- Hours convert from Google's weekday list to {"mon": "...", ...}.
- google_place_id is preserved in notes_internal for idempotent re-export.
"""

import json
import math
import os
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "backend"))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "radvisor.settings")

import django

django.setup()

from apps.catalog.models import Business  # noqa: E402
from apps.catalog.rental_taxonomy import reconcile_top_level_categories  # noqa: E402

# Keep in sync with web/lib/config/geo.ts
REGION_CENTER = (39.5296, -119.8138)
REGION_RADIUS_MILES = 50

# Django slug -> canonical category slug (instructions/01_data_model.md §3).
CATEGORY_MAP = {
    "watersports-gear": "water_sports",
    "boat": "water_sports",
    "raft": "water_sports",
    "kayak": "water_sports",
    "paddleboard": "water_sports",
    "camping": "camping",
    "ski": "snow_sports",
    "nordic": "snow_sports",
    "snowboard": "snow_sports",
    "offroad": "off_road",
    "snowmobile": "off_road",
    "road-bike": "road_cycling",
    "air": "aerial",
    "e-bike": "electric_transport",
    "e-scooter": "electric_transport",
    "mountain-bike": "mountain_biking",
    "climbing": "rock_climbing",
}

# Verified corrections applied on export (founder-verified; survives Django re-sync).
OPERATOR_EXPORT_OVERRIDES: dict[str, dict] = {
    # Factory demo program — snow_sports operator; demo subcategory on equipment row.
    "moment-skis": {
        "is_active": True,
        "name": "Moment Skis (Demo Only)",
        "categories": ["snow_sports"],
        "notes_internal": (
            "google_place_id:ChIJfbp-qiI_mYARD0_70XarbPM; factory alpine ski demo program"
        ),
    },
    "uplyft-tahoe-jet-ski-rentals": {
        "categories": ["water_sports"],
    },
    # Retail shop — alpine ski demos only, no gear rentals.
    "alpenglow-sports": {
        "name": "Alpenglow Sports (Demo Only)",
        "categories": ["snow_sports"],
        "notes_internal": (
            "google_place_id:ChIJfwaAbXZ9mYARDUP7ClnaRuk; alpine ski demos only — no rentals"
        ),
    },
    "black-tie-ski-rentals-of-north-lake-tahoe": {
        "offers_delivery": True,
    },
}

DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def haversine_miles(lat1, lng1, lat2, lng2):
    r = 3958.8
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def normalize_hours(hours):
    weekday = (hours or {}).get("weekday") or []
    if not weekday:
        return None
    out = {}
    for line in weekday:
        # "Monday: 9:00 AM – 5:00 PM" (with narrow no-break spaces from Google)
        name, _, value = line.partition(":")
        value = value.strip().replace(" ", " ").replace(" ", " ")
        for i, day in enumerate(DAY_NAMES):
            if name.strip() == day:
                out[DAY_KEYS[i]] = value
    return out or None


def main():
    out_path = Path(__file__).resolve().parent / "operators.json"
    operators, skipped_radius, skipped_nocat, unmapped = [], [], [], set()

    for b in Business.objects.filter(is_active=True).prefetch_related("categories"):
        cats = sorted(
            {CATEGORY_MAP[c.slug] for c in b.categories.all() if c.slug in CATEGORY_MAP}
        )
        for c in b.categories.all():
            if c.slug not in CATEGORY_MAP:
                unmapped.add(c.slug)
        if not cats:
            skipped_nocat.append(b.slug)
            continue

        lat = float(b.latitude) if b.latitude is not None else None
        lng = float(b.longitude) if b.longitude is not None else None
        if lat is not None and lng is not None:
            dist = haversine_miles(lat, lng, *REGION_CENTER)
            if dist > REGION_RADIUS_MILES:
                skipped_radius.append((b.slug, round(dist)))
                continue

        row = {
            "name": b.name,
            "slug": b.slug,
            "address": b.address or None,
            "city": b.city or None,
            "state": b.state or "NV",
            "lat": lat,
            "lng": lng,
            "phone": b.phone or None,
            "website": b.website or None,
            "hours": normalize_hours(b.hours),
            "categories": reconcile_top_level_categories(b.name, cats),
            "photos": [b.photo_url] if b.photo_url else None,
            "rating_external": float(b.google_rating) if b.google_rating else None,
            "rating_external_count": b.google_rating_count or None,
            "inventory_sync_type": "manual",
            "notes_internal": f"google_place_id:{b.google_place_id}",
            "is_active": True,
            "last_verified": (
                b.last_synced_at.date().isoformat()
                if b.last_synced_at
                else date.today().isoformat()
            ),
        }
        row.update(OPERATOR_EXPORT_OVERRIDES.get(b.slug, {}))
        operators.append(row)

    out_path.write_text(json.dumps(operators, indent=1, ensure_ascii=False))
    print(f"exported: {len(operators)} operators -> {out_path}")
    print(f"skipped (outside {REGION_RADIUS_MILES}mi): {len(skipped_radius)}")
    print(f"skipped (no mappable category): {len(skipped_nocat)}")
    if unmapped:
        print(f"unmapped Django slugs (review): {sorted(unmapped)}")


if __name__ == "__main__":
    main()
