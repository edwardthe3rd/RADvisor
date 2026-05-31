"""Gather outdoor-gear rental businesses near Reno/Tahoe from the Google Places API (New).

One-time / infrequent, low-cost ingestion. Results are cached in the Business
table and upserted by google_place_id, so the command is safely re-runnable.

Cost control:
  - Lean field mask (no Photos SKU, which is billed separately).
  - --max-pages caps paginated Text Search calls per query (default 2 => up to 40
    results/query).
  - --dry-run previews without spending quota on writes (still calls the API).

Usage:
    export GOOGLE_PLACES_API_KEY=...        # restricted key
    python manage.py sync_reno_businesses --dry-run
    python manage.py sync_reno_businesses
"""

from __future__ import annotations

import time
from decimal import Decimal

import requests
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from django.utils.text import slugify

from apps.catalog.models import Business, Category
from apps.catalog.rental_taxonomy import all_search_queries, classify

PLACES_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"

# Default search center: downtown Reno, NV. 50 km reaches most of the Tahoe basin.
RENO_LAT = 39.5296
RENO_LNG = -119.8138
DEFAULT_RADIUS_M = 50000.0

FIELD_MASK = ",".join(
    [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.addressComponents",
        "places.location",
        "places.rating",
        "places.userRatingCount",
        "places.priceLevel",
        "places.nationalPhoneNumber",
        "places.websiteUri",
        "places.regularOpeningHours",
        "places.businessStatus",
    ]
)

_PRICE_LEVEL_MAP = {
    "PRICE_LEVEL_FREE": 0,
    "PRICE_LEVEL_INEXPENSIVE": 1,
    "PRICE_LEVEL_MODERATE": 2,
    "PRICE_LEVEL_EXPENSIVE": 3,
    "PRICE_LEVEL_VERY_EXPENSIVE": 4,
}


class Command(BaseCommand):
    help = "Gather outdoor rental businesses near Reno/Tahoe from Google Places (New)."

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true", help="Preview without writing to the DB.")
        parser.add_argument("--max-pages", type=int, default=2, help="Max Text Search pages per query (cost cap).")
        parser.add_argument("--radius", type=float, default=DEFAULT_RADIUS_M, help="Search radius in meters (<=50000).")
        parser.add_argument("--lat", type=float, default=RENO_LAT)
        parser.add_argument("--lng", type=float, default=RENO_LNG)

    def handle(self, *args, **options):
        api_key = settings.GOOGLE_PLACES_API_KEY
        if not api_key:
            raise CommandError(
                "GOOGLE_PLACES_API_KEY is not set. Export it (see backend/.env.example) and retry."
            )

        radius = min(float(options["radius"]), 50000.0)
        max_pages = max(1, int(options["max_pages"]))
        dry_run = options["dry_run"]

        # place_id -> {"place": <raw>, "slugs": set()}
        found: dict[str, dict] = {}
        query_count = 0

        for query, source_slug in all_search_queries():
            query_count += 1
            try:
                places = self._search(api_key, query, options["lat"], options["lng"], radius, max_pages)
            except requests.RequestException as exc:
                self.stderr.write(self.style.ERROR(f"  ! '{query}' failed: {exc}"))
                continue

            for place in places:
                pid = place.get("id")
                if not pid:
                    continue
                entry = found.setdefault(pid, {"place": place, "slugs": set()})
                entry["place"] = place
                name = (place.get("displayName") or {}).get("text", "")
                entry["slugs"].update(classify(f"{name} {query}", source_slug))

            self.stdout.write(f"  {query!r}: {len(places)} results (running unique: {len(found)})")

        self.stdout.write(
            self.style.HTTP_INFO(
                f"\n{query_count} queries -> {len(found)} unique businesses."
            )
        )

        if dry_run:
            for pid, entry in sorted(found.items(), key=lambda kv: (kv[1]["place"].get("displayName") or {}).get("text", "")):
                name = (entry["place"].get("displayName") or {}).get("text", "?")
                slugs = ", ".join(sorted(entry["slugs"])) or "(uncategorized)"
                self.stdout.write(f"   - {name}  [{slugs}]")
            self.stdout.write(self.style.WARNING("\nDry run: nothing written."))
            return

        cats_by_slug = {c.slug: c for c in Category.objects.all()}
        missing = {s for e in found.values() for s in e["slugs"]} - set(cats_by_slug)
        if missing:
            self.stderr.write(
                self.style.WARNING(
                    f"Categories not seeded yet ({', '.join(sorted(missing))}). "
                    f"Run `python manage.py seed_categories` first; tagging will skip them."
                )
            )

        created = updated = 0
        for pid, entry in found.items():
            obj, was_created = self._upsert(entry["place"], pid)
            slugs = [cats_by_slug[s] for s in entry["slugs"] if s in cats_by_slug]
            obj.categories.set(slugs)
            created += int(was_created)
            updated += int(not was_created)

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. {created} created, {updated} updated. Total businesses: {Business.objects.count()}."
            )
        )

    def _search(self, api_key, text_query, lat, lng, radius, max_pages):
        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": api_key,
            "X-Goog-FieldMask": FIELD_MASK + ",nextPageToken",
        }
        body = {
            "textQuery": text_query,
            "locationBias": {
                "circle": {"center": {"latitude": lat, "longitude": lng}, "radius": radius}
            },
            "pageSize": 20,
        }
        results: list[dict] = []
        page_token = None
        for page in range(max_pages):
            if page_token:
                body["pageToken"] = page_token
            resp = requests.post(PLACES_SEARCH_URL, headers=headers, json=body, timeout=20)
            resp.raise_for_status()
            data = resp.json()
            results.extend(data.get("places", []))
            page_token = data.get("nextPageToken")
            if not page_token:
                break
            time.sleep(1.0)  # small courtesy delay between pages
        return results

    def _upsert(self, place, pid):
        comp = self._address_parts(place.get("addressComponents", []))
        name = (place.get("displayName") or {}).get("text", "")[:200] or "Unnamed business"
        loc = place.get("location") or {}
        hours = (place.get("regularOpeningHours") or {}).get("weekdayDescriptions", [])

        defaults = {
            "name": name,
            "slug": self._unique_slug(name, pid),
            "address": (place.get("formattedAddress") or "")[:300],
            "city": comp.get("city", ""),
            "state": comp.get("state", ""),
            "latitude": self._dec(loc.get("latitude"), 6),
            "longitude": self._dec(loc.get("longitude"), 6),
            "phone": (place.get("nationalPhoneNumber") or "")[:40],
            "website": (place.get("websiteUri") or "")[:500],
            "google_rating": self._dec(place.get("rating"), 1),
            "google_rating_count": int(place.get("userRatingCount") or 0),
            "price_level": _PRICE_LEVEL_MAP.get(place.get("priceLevel")),
            "hours": {"weekday": hours} if hours else {},
            "last_synced_at": timezone.now(),
        }
        return Business.objects.update_or_create(google_place_id=pid, defaults=defaults)

    @staticmethod
    def _address_parts(components):
        out = {}
        for c in components:
            types = c.get("types", [])
            if "locality" in types:
                out["city"] = (c.get("longText") or c.get("shortText") or "")[:100]
            elif "administrative_area_level_1" in types:
                out["state"] = (c.get("shortText") or c.get("longText") or "")[:100]
        return out

    @staticmethod
    def _dec(value, places):
        if value is None:
            return None
        try:
            return round(Decimal(str(value)), places)
        except (ArithmeticError, ValueError):
            return None

    @staticmethod
    def _unique_slug(name, pid):
        base = slugify(name)[:200] or "business"
        existing = (
            Business.objects.filter(slug=base)
            .exclude(google_place_id=pid)
            .exists()
        )
        if not existing:
            return base
        suffix = slugify(pid)[-8:] or "x"
        return f"{base}-{suffix}"[:220]
