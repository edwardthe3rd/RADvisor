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
from apps.catalog.rental_taxonomy import (  # noqa: E402
    filter_aerial_category,
    reconcile_top_level_categories,
)

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

# BlueZone retail stores — founder-verified (road/e-bike, water, snow; not MTB).
BLUEZONE_RETAIL_CATEGORIES = [
    "electric_transport",
    "road_cycling",
    "snow_sports",
    "water_sports",
]

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
    "bluezone-sports-carson-city": {
        "categories": BLUEZONE_RETAIL_CATEGORIES,
    },
    "bluezone-sports-south-lake-tahoe": {
        "categories": BLUEZONE_RETAIL_CATEGORIES,
    },
    "bluezone-sports-tahoe-city": {
        "categories": BLUEZONE_RETAIL_CATEGORIES,
    },
    "granite-chief-powered-by-bluezone-sports": {
        "categories": BLUEZONE_RETAIL_CATEGORIES,
        "description": (
            "Part of the BlueZone Sports retail network — same rental gear as "
            "BlueZone's Carson City, South Lake Tahoe, and Tahoe City stores."
        ),
        "notes_internal": (
            "google_place_id:ChIJmVK1sDPem4AROEdsc6xHzUo; bluezone_retail_network"
        ),
    },
    "bluezone-sports-team-sales-office": {
        "is_active": False,
    },
    "camp-richardson-mountain-sports-center": {
        "categories": ["snow_sports", "water_sports"],
    },
    "coalition-snow": {
        "name": "Coalition Snow (Demo Only)",
        "phone": "(775) 525-8136",
        "categories": ["snow_sports"],
        "notes_internal": (
            "google_place_id:ChIJ6S-mQiVHmYARb2odeGBcd2U; "
            "snow sports demos only — no rentals"
        ),
    },
    "cv-sports": {
        "categories": ["snow_sports"],
    },
    "estelle-sports": {
        "is_active": False,
        "notes_internal": (
            "google_place_id:ChIJF7-iSEXXm4ARZ44Y30OtY1A; retail only — no gear rentals"
        ),
    },
    "forward-ski-system": {
        "is_active": False,
        "notes_internal": (
            "google_place_id:ChIJ_XOgTKNHmYARQ5f51RcNl2g; no gear rentals"
        ),
    },
    "heavenly-sports-cecils-plaza": {
        "categories": ["snow_sports"],
        "description": "Snow sports rentals and alpine ski demos.",
        "notes_internal": (
            "google_place_id:ChIJv-yKNHaQmYARw929njJWAu4; "
            "snow sports rentals and demos"
        ),
    },
    "bobos-ski-patio": {
        "description": (
            "Also listed on Google as Mogul Mouse — same business and location."
        ),
        "notes_internal": (
            "google_place_id:ChIJqyv1rH9AmYARtgff-7iWsyQ; "
            "duplicate Google listing: mogul-mouse"
        ),
    },
    "mogul-mouse": {
        "is_active": False,
        "notes_internal": (
            "google_place_id:ChIJkW3Hrn9AmYARSTxL7AQZDxk; "
            "duplicate of bobos-ski-patio (same business)"
        ),
    },
    "mountain-mikes-tees-and-skis": {
        "name": "Mountain Mikes / Snowshoe Thompson's",
        "phone": "(530) 544-4783",
        "notes_internal": (
            "google_place_id:ChIJE1amPXSQmYAR0IbbbnD6ocI; "
            "duplicate Google listing: snowshoe-thompsons-ski-and-snowboard-rentals"
        ),
    },
    "snowshoe-thompsons-ski-and-snowboard-rentals": {
        "is_active": False,
        "notes_internal": (
            "google_place_id:ChIJ9YtcA7WPmYARBsx33yY9tLI; "
            "duplicate of mountain-mikes-tees-and-skis (same location)"
        ),
    },
    "mountain-west": {
        "categories": ["snow_sports"],
    },
    "nevada-nordic": {
        "is_active": False,
        "notes_internal": (
            "google_place_id:ChIJv39nHstvmYARRthSt17BGyA; "
            "trail association — no gear rentals (refers to Tahoe Multisport)"
        ),
    },
    "new-used-tahoe-sports": {
        "is_active": False,
        "notes_internal": (
            "google_place_id:ChIJtYQxeHZ9mYARNYamcYRoFNY; "
            "consignment retail — no gear rentals"
        ),
    },
    "mountain-mikes-sports": {
        "is_active": False,
        "notes_internal": (
            "google_place_id:ChIJL0PZlOrZm4ARCLy9I1WG14U; "
            "renamed to olympic-valley-ski-bike — duplicate listing"
        ),
    },
    "parallel-mountain-sports": {
        "categories": ["snow_sports"],
        "description": "Snow sports rentals and gear demos.",
        "notes_internal": (
            "google_place_id:ChIJzUBQ9uzZm4ARv8ZP7EJ-tgE; "
            "snow sports rentals and demos"
        ),
    },
    "palisades-tahoe-ski-snowboard-rental": {
        "categories": ["snow_sports"],
        "description": "Snow sports rentals and gear demos.",
        "notes_internal": (
            "google_place_id:ChIJN83rWezZm4ARtHEgfKt-QPs; "
            "snow sports rentals and demos"
        ),
    },
    "olympic-valley-ski-bike": {
        "name": "Olympic Valley Ski & Bike",
        "categories": ["mountain_biking", "road_cycling", "snow_sports"],
        "description": (
            "Snow sports and bike rentals, plus ski and bike demos. "
            "Formerly Mountain Mike's Sports."
        ),
        "notes_internal": (
            "google_place_id:ChIJu5xhn0HZm4ARO3ETVqLq1ec; "
            "snow/bike rentals and demos; "
            "former name: Mountain Mike's Sports (ChIJL0PZlOrZm4ARCLy9I1WG14U)"
        ),
    },
    "modern-house-ski-lease-or-short-term-new-hot-tubgas-insert-by-nordic-center": {
        "is_active": False,
        "notes_internal": (
            "google_place_id:ChIJz1ZizON8mYARvqTqpXTsVYw; "
            "vacation rental listing — not a gear operator"
        ),
    },
    "tahoe-xc": {
        "name": "Tahoe XC",
        "categories": ["snow_sports"],
        "description": (
            "Cross-country ski and snowshoe rentals at Dollar Point — "
            "home of the historic Tahoe Nordic Center."
        ),
        "phone": "(530) 583-5475",
        "website": "https://tahoexc.org/",
        "address": "925 Country Club Dr, Tahoe City, CA 96145, USA",
        "city": "Tahoe City",
        "state": "CA",
        "lat": 39.1937,
        "lng": -120.1039,
        "notes_internal": (
            "founder_verified; xc/nordic rentals — replaces mis-tagged vacation "
            "listing near Nordic Center"
        ),
    },
    "heavenly-sports-marriott": {
        "categories": ["snow_sports"],
        "description": "Snow sports rentals and alpine ski demos.",
        "notes_internal": (
            "google_place_id:ChIJx83JvkSQmYAR37b1G_O0P5E; "
            "snow sports rentals and demos"
        ),
    },
    "gondola-ski-sports": {
        "categories": ["electric_transport", "road_cycling", "snow_sports"],
        "notes_internal": (
            "google_place_id:ChIJy9ppqHeQmYARudCSM07YImA; "
            "cruiser and e-bike rentals (not MTB)"
        ),
    },
    "donner-ski-shop": {
        "categories": ["snow_sports", "water_sports"],
        "description": (
            "Paddleboard rentals for Serene Lakes residents only — choose "
            "Serene Lakes as your location to find this offering. The lakes "
            "are private and not open to the general public."
        ),
        "notes_internal": (
            "google_place_id:ChIJqcC_TFfom4ARrt8jKoleVz0; "
            "serene_lakes_paddleboards_residents_only"
        ),
    },
    "powder-house-ski-board-pro-snow": {
        "name": "Powder House Ski & Board: Pro Snow (Demo Only)",
        "categories": ["snow_sports"],
        "description": (
            "Snow sports demos only — no gear rentals. Part of the Powder "
            "House network; visit Main Store, Gondola, Express, or Zalanta "
            "for rentals."
        ),
        "notes_internal": (
            "google_place_id:ChIJ03PeAneQmYARisbooJUWr4c; "
            "snow sports demos only — no rentals"
        ),
    },
    "powder-house-ski-and-snowboard-main-store": {
        "categories": ["mountain_biking", "road_cycling", "snow_sports"],
        "description": (
            "Snow sports and bike rentals. Part of the Powder House rental "
            "network — five South Lake Tahoe locations."
        ),
        "notes_internal": (
            "google_place_id:ChIJNd1MfXaQmYARGUhCfr5Mou8; "
            "snow and bike rentals"
        ),
    },
    "powder-house-ski-and-snowboard-at-the-gondola": {
        "categories": ["mountain_biking", "road_cycling", "snow_sports"],
        "description": (
            "Ski and bike rentals at Heavenly Village. Part of the Powder "
            "House rental network — five South Lake Tahoe locations."
        ),
        "notes_internal": (
            "google_place_id:ChIJqbAd6naQmYARzmDmLE2LviY; "
            "ski and bike rentals"
        ),
    },
    "powder-house-stateline-at-zalanta": {
        "categories": ["snow_sports"],
        "description": (
            "Ski rentals only. Part of the Powder House rental network — "
            "five South Lake Tahoe locations."
        ),
        "notes_internal": (
            "google_place_id:ChIJuYGQMXaQmYARCO9oO_RTRQQ; ski rentals only"
        ),
    },
    "praxis-skis": {
        "categories": ["snow_sports", "water_sports"],
        "website": "https://www.praxisskis.com/",
        "description": (
            "Snow sports rentals and Praxis ski demos — pickup in Incline Village. "
            "Lift foil demos and rentals (eFoil, wing, wake, downwind) booked "
            "through Praxis; Lift is the foil brand they carry, not a separate "
            "shop. eFoil sessions launch from Adrift Tahoe in Kings Beach."
        ),
        "notes_internal": (
            "google_place_id:ChIJ__-P0xBwmYARBwqqmQYJZvQ; "
            "snow and foil rentals; lift_foils_dealer"
        ),
    },
    "powder-house-express": {
        "name": "Powder House Express",
        "categories": ["mountain_biking", "road_cycling", "snow_sports"],
        "description": (
            "Ski and bike rentals year-round. Part of the Powder House rental "
            "network — five South Lake Tahoe locations."
        ),
        "phone": "(530) 541-6422",
        "website": "http://www.tahoepowderhouse.com/powder-house-express",
        "address": "3668 Lake Tahoe Blvd, South Lake Tahoe, CA 96150, USA",
        "city": "South Lake Tahoe",
        "state": "CA",
        "lat": 38.948057,
        "lng": -119.956927,
        "notes_internal": "founder_verified; ski and bike rentals",
    },
}

# Website-verified corrections (instructions/02 §9). Merged on export so re-sync
# preserves name/category fixes checked against operator websites.
_verified_path = Path(__file__).resolve().parent / "operator_website_verified.json"
if _verified_path.exists():
    _website_verified = json.loads(_verified_path.read_text())
    for _slug, _patch in _website_verified.items():
        _export_patch = {k: v for k, v in _patch.items() if k not in ("verified_at", "source")}
        OPERATOR_EXPORT_OVERRIDES.setdefault(_slug, {}).update(_export_patch)

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
            "categories": filter_aerial_category(
                b.name,
                reconcile_top_level_categories(b.name, cats),
                website=b.website or "",
            ),
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
