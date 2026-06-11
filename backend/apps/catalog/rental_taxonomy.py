"""Single source of truth for the outdoor-rental category taxonomy.

Used by:
  - `seed_categories`        -> creates Category rows from CATEGORIES.
  - `sync_reno_businesses`   -> uses each category's `queries` to search Places
                                and `classify` to tag businesses by category.

Each category defines:
  slug      stable identifier (also the Category.slug)
  name      display name
  group     high-level bucket shown on the discovery page
  icon      short emoji/glyph for the UI
  queries   Google Places text-search phrases that surface this kind of rental
  keywords  substrings (matched against business name + the query that found it)
            used to tag an already-fetched business with this category
"""

from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass(frozen=True)
class CategoryDef:
    slug: str
    name: str
    group: str
    icon: str
    queries: tuple[str, ...] = ()
    keywords: tuple[str, ...] = ()


RENTAL_INTENT_KEYWORDS: tuple[str, ...] = (
    "rental",
    "rentals",
    " rent ",
    "rent ",
    "rent-a-",
    "rent a ",
    " hire ",
    "outfitter",
    "outfitters",
    "gear",
    "equipment",
    "sports",
    "adventures",
)

# Always reject — clear non-rental verticals.
HARD_EXCLUDE_KEYWORDS: tuple[str, ...] = (
    "hotel",
    "motel",
    "hostel",
    "airbnb",
    "vrbo",
    "homeaway",
    "vacation rental",
    "vacation home",
    "restaurant",
    " bar ",
    "grill",
    "pizza",
    "brewery",
    "storage",
    "real estate",
    "realtor",
    "insurance",
    "salon",
    "gym",
    "church",
    "hospital",
    "pharmacy",
    "gas station",
    "home medical",
    "medical equipment",
    "medical supply",
    "medical rental",
    "durable medical",
    "mobility scooter",
    "power wheelchair",
    "wheelchair rental",
    "home health",
    "oxygen rental",
    "skate park",
    "skatepark",
    "pump track",
)

# Mixed-use names — lodging, cafe, school, etc. alongside outdoor rental.
SOFT_EXCLUDE_KEYWORDS: tuple[str, ...] = (
    "resort",
    " lodge",
    " inn",
    "cafe",
    "coffee",
    "school",
)

EXCLUDE_KEYWORDS: tuple[str, ...] = HARD_EXCLUDE_KEYWORDS + SOFT_EXCLUDE_KEYWORDS

HARD_EXCLUDE_PLACE_TYPES: tuple[str, ...] = (
    "restaurant",
    "bar",
    "gas_station",
    "hospital",
    "pharmacy",
    "church",
    "gym",
    "beauty_salon",
    "real_estate_agency",
    "storage",
    "medical_supply",
    "doctor",
    "physiotherapist",
)

SOFT_EXCLUDE_PLACE_TYPES: tuple[str, ...] = (
    "lodging",
    "hotel",
    "motel",
    "cafe",
    "school",
)

EXCLUDE_PLACE_TYPES: tuple[str, ...] = HARD_EXCLUDE_PLACE_TYPES + SOFT_EXCLUDE_PLACE_TYPES

# Name markers that override soft excludes when outdoor rental/lessons are implied.
OUTDOOR_RENTAL_NAME_MARKERS: tuple[str, ...] = (
    "mountain sports",
    "sports center",
    "ski",
    "water ski",
    "wakeboard",
    "snowboard",
    "boat",
    "marina",
    "kayak",
    "mountain bike",
    "bike rental",
    "bicycle rental",
    "outfitter",
    "rental",
    "rentals",
    "gear",
    "equipment",
    "watercraft",
    "paddle",
    "campground",
)

ALLOWED_STATES: tuple[str, ...] = ("NV", "CA")

# Airbnb/VRBO-style property titles (often surfaced by gear-rental queries).
VACATION_RENTAL_NAME_PATTERNS: tuple[str, ...] = (
    "holiday rental",
    "short term rental",
    "short-term rental",
    " mi to ",
    " miles to ",
    "sleeps ",
    "family haven",
    "spacious family",
    "private retreat",
    "lakefront cabin",
    "mountain cabin",
    "cozy cabin",
    "chalet rental",
)


def is_vacation_rental_listing(name: str, *, website: str = "") -> bool:
    """True for short-term home/cabin listings, not outdoor gear rental shops."""
    blob = f"{name} {website}".lower()
    if any(p in blob for p in VACATION_RENTAL_NAME_PATTERNS):
        return True
    return any(kw in blob for kw in ("vacation rental", "vacation home", "vrbo", "homeaway", "airbnb"))


# Big-box outdoor retailers (sell gear; do not rent). REI and Scheels omitted — rent at many stores.
RETAIL_OUTDOOR_CHAIN_NAMES: tuple[str, ...] = (
    "bass pro",
    "cabela's",
    "cabelas",
    "academy sports",
    "dick's sporting",
    "dicks sporting",
    "sportsman's warehouse",
    "sportsmans warehouse",
    "big 5 sporting",
)


def is_retail_outdoor_chain(name: str, *, website: str = "") -> bool:
    blob = f"{name} {website}".lower()
    return any(chain in blob for chain in RETAIL_OUTDOOR_CHAIN_NAMES)


# Known operators that no longer rent outdoor gear (may still run tours, storage, etc.).
STOPPED_GEAR_RENTAL_NAME_PATTERNS: tuple[str, ...] = (
    "action water sports of incline village",
    "action watersports of incline village",
)

def is_stopped_gear_rental_operator(name: str, *, website: str = "") -> bool:
    blob = f"{name} {website}".lower()
    return any(pattern in blob for pattern in STOPPED_GEAR_RENTAL_NAME_PATTERNS)


# Reno / Lake Tahoe is the target region; queries are scoped geographically by
# the ingestion command's location restriction, so phrases stay generic.
CATEGORIES: tuple[CategoryDef, ...] = (
    # --- Snow -------------------------------------------------------------
    CategoryDef(
        "ski", "Ski", "Snow", "\u26f7",
        queries=("ski rental", "ski rental shop", "downhill ski rental"),
        keywords=("ski", "skis", "alpine"),
    ),
    CategoryDef(
        "snowboard", "Snowboard", "Snow", "\U0001f3c2",
        queries=("snowboard rental", "snowboard rental shop"),
        keywords=("snowboard",),
    ),
    CategoryDef(
        "nordic", "Cross-Country & Snowshoe", "Snow", "\U0001f3d4",
        queries=("cross country ski rental", "nordic ski rental", "snowshoe rental"),
        keywords=("cross country", "nordic", "snowshoe", "xc ski"),
    ),
    CategoryDef(
        "snowmobile", "Snowmobile", "Snow", "\U0001f6f7",
        queries=("snowmobile rental", "snowmobile tours rental"),
        keywords=("snowmobile", "sled"),
    ),
    # --- Water ------------------------------------------------------------
    CategoryDef(
        "kayak", "Kayak & Canoe", "Water", "\U0001f6f6",
        queries=("kayak rental", "canoe rental"),
        keywords=("kayak", "canoe"),
    ),
    CategoryDef(
        "paddleboard", "Paddleboard (SUP)", "Water", "\U0001f3c4",
        queries=("paddleboard rental", "stand up paddleboard rental", "SUP rental"),
        keywords=("paddleboard", "paddle board", "sup "),
    ),
    CategoryDef(
        "raft", "Rafting & Tubing", "Water", "\U0001f6e0",
        queries=("raft rental", "river tube rental", "whitewater raft rental"),
        keywords=("raft", "tubing", "tube rental", "whitewater"),
    ),
    CategoryDef(
        "boat", "Boats & Jet Ski", "Water", "\U0001f6a4",
        queries=("boat rental", "jet ski rental", "pontoon rental", "watercraft rental"),
        keywords=(
            "boat",
            "jet ski",
            "jetski",
            "pontoon",
            "watercraft",
            "marina",
            "pwc",
            "water ski",
            "waterski",
            "wakeboard",
        ),
    ),
    CategoryDef(
        "watersports-gear", "Wetsuits & Snorkel", "Water", "\U0001f93f",
        queries=("wetsuit rental", "snorkel rental", "scuba rental"),
        keywords=("wetsuit", "snorkel", "scuba", "dive"),
    ),
    # --- Bike -------------------------------------------------------------
    CategoryDef(
        "mountain-bike", "Mountain Bike", "Bike", "\U0001f6b5",
        queries=("mountain bike rental", "MTB rental"),
        keywords=("mountain bike", "mtb"),
    ),
    CategoryDef(
        "road-bike", "Road & Gravel Bike", "Bike", "\U0001f6b2",
        queries=("road bike rental", "gravel bike rental"),
        keywords=("road bike", "gravel", "cycling"),
    ),
    CategoryDef(
        "e-bike", "E-Bike", "Bike", "\u26a1",
        queries=("electric bike rental", "e-bike rental"),
        keywords=("e-bike", "ebike", "electric bike"),
    ),
    # --- Climb ------------------------------------------------------------
    CategoryDef(
        "climbing", "Rock & Ice Climbing", "Climb", "\U0001f9d7",
        queries=("rock climbing gear rental", "climbing equipment rental", "ice climbing rental"),
        keywords=("climbing", "mountaineering", "crampon", "ice axe"),
    ),
    # --- Camp -------------------------------------------------------------
    CategoryDef(
        "camping", "Camping Gear", "Camp", "\u26fa",
        queries=("camping gear rental", "tent rental", "backpacking gear rental"),
        keywords=("camping", "tent", "backpacking", "outfitter"),
    ),
    # --- Vehicles ---------------------------------------------------------
    CategoryDef(
        "offroad", "ATV, UTV & Off-Road", "Vehicles", "\U0001f3cd",
        queries=("ATV rental", "UTV rental", "side by side rental", "dirt bike rental"),
        keywords=("atv", "utv", "side by side", "off-road", "dirt bike", "polaris", "razor"),
    ),
    # --- E-Transport ------------------------------------------------------
    CategoryDef(
        "e-scooter", "E-Scooter & Personal EV", "E-Transport", "\U0001f6f4",
        queries=("electric scooter rental", "e-scooter rental"),
        keywords=("e-scooter", "e scooter", "electric scooter", "personal electric"),
    ),
    # --- Air / Other ------------------------------------------------------
    CategoryDef(
        "air", "Air & Other Adventures", "Air/Other", "\U0001fa82",
        queries=("paragliding rental", "hang gliding rental", "outdoor gear rental"),
        keywords=("paraglid", "hang glid", "parasail", "balloon"),
    ),
)

# Camper vans, RVs, and utility trailers — out of Sprint 1 scope; not synced via
# Places. Re-append to CATEGORIES (and web/lib/config/categories.ts) when ready.
DEFERRED_CATEGORIES: tuple[CategoryDef, ...] = (
    CategoryDef(
        "rv-camper", "RV & Camper Van", "Vehicles", "\U0001f69a",
        queries=("RV rental", "camper van rental", "motorhome rental"),
        keywords=("rv ", "motorhome", "camper van", "campervan", "recreational vehicle"),
    ),
    CategoryDef(
        "trailer", "Trailers", "Vehicles", "\U0001f6fb",
        queries=("utility trailer rental", "cargo trailer rental"),
        keywords=("trailer rental", "utility trailer", "cargo trailer", "equipment trailer"),
    ),
)

RV_RENTAL_EXCLUDE_KEYWORDS: tuple[str, ...] = (
    "rv rental",
    "rv rentals",
    "motorhome",
    "camper van",
    "campervan",
    "recreational vehicle",
    " rv ",
    "rvs ",
    "travel trailer rental",
)


def is_rv_rental_business(name: str, *, website: str = "") -> bool:
    blob = f"{name} {website}".lower()
    return any(kw in blob for kw in RV_RENTAL_EXCLUDE_KEYWORDS)


# Standard airport / chain auto rentals — not outdoor personal EV (e-scooter, e-bike).
STANDARD_CAR_RENTAL_NAME_PATTERNS: tuple[str, ...] = (
    "rent a car",
    "rent-a-car",
    "rentacar",
    "car rental",
    "car rentals",
)

STANDARD_CAR_RENTAL_BRANDS: tuple[str, ...] = (
    "alamo rent",
    "avis ",
    "avis car",
    "budget car rental",
    "budget rent a car",
    "dollar car rental",
    "dollar rent a car",
    "enterprise car",
    "enterprise rent",
    "europcar",
    "fox rent a car",
    "hertz",
    "national car rental",
    "payless car",
    "sixt rent",
    "thrifty car",
    "advantage rent a car",
)


def is_standard_car_rental_business(name: str, *, website: str = "") -> bool:
    blob = f"{name} {website}".lower()
    if any(p in blob for p in STANDARD_CAR_RENTAL_NAME_PATTERNS):
        return True
    return any(brand in blob for brand in STANDARD_CAR_RENTAL_BRANDS)


# Bike parks that rent gear despite the "park" name (curated exceptions).
RENTING_BIKE_PARK_NAMES: tuple[str, ...] = (
    "truckee bike park",
)

BIKE_PARK_RENTAL_NAME_MARKERS: tuple[str, ...] = (
    "rental",
    "rentals",
    " rent ",
    "bike shop",
    "cycle shop",
    "outfitter",
)


def is_non_rental_bike_park(name: str, *, website: str = "") -> bool:
    """True for municipal/skate-style bike parks that do not rent gear."""
    blob = f"{name} {website}".lower()
    if "bike park" not in blob and "bmx park" not in blob:
        return False
    if any(allowed in blob for allowed in RENTING_BIKE_PARK_NAMES):
        return False
    if any(marker in blob for marker in BIKE_PARK_RENTAL_NAME_MARKERS):
        return False
    return True


CATEGORIES_BY_SLUG: dict[str, CategoryDef] = {c.slug: c for c in CATEGORIES}

# Ordered, de-duplicated list of high-level groups for the discovery page.
GROUPS: tuple[str, ...] = tuple(dict.fromkeys(c.group for c in CATEGORIES))


def all_search_queries() -> list[tuple[str, str]]:
    """Return (query, category_slug) pairs for the ingestion command to run."""
    pairs: list[tuple[str, str]] = []
    for cat in CATEGORIES:
        for q in cat.queries:
            pairs.append((q, cat.slug))
    return pairs


# Normalized curated queries -> category slug (every taxonomy query is rental-focused).
_CURATED_QUERY_TO_SLUG: dict[str, str] = {
    q.strip().lower(): slug for q, slug in all_search_queries()
}


def query_matches_category(query: str, slug: str | None) -> bool:
    """True when `query` is one of the taxonomy search phrases for `slug`."""
    if not query or not slug or slug not in CATEGORIES_BY_SLUG:
        return False
    normalized = query.strip().lower()
    return normalized in {q.lower() for q in CATEGORIES_BY_SLUG[slug].queries}


def is_curated_rental_query(query: str) -> bool:
    """True when the place was surfaced by one of our ingestion search phrases."""
    return query.strip().lower() in _CURATED_QUERY_TO_SLUG if query else False


def slug_for_curated_query(query: str) -> str | None:
    return _CURATED_QUERY_TO_SLUG.get(query.strip().lower()) if query else None


def _has_rental_intent_in_name(name: str) -> bool:
    blob = f" {(name or '').lower()} "
    lowered = (name or "").lower()
    return any(kw in blob or kw.strip() in lowered for kw in RENTAL_INTENT_KEYWORDS)


SNOW_DISCIPLINE_SLUGS: frozenset[str] = frozenset({"ski", "snowboard", "nordic"})


def _category_name_hit(name_blob: str, cat: CategoryDef) -> bool:
    """True when the business name signals this category (not incidental query text)."""
    if cat.slug == "ski":
        if "alpine" in name_blob:
            return True
        if "water ski" in name_blob or "waterski" in name_blob:
            return False
        if "jet ski" in name_blob or "jetski" in name_blob or "jet-ski" in name_blob:
            return False
        # "Ski Run" is a common Tahoe street/place name, not alpine skiing.
        if re.search(r"\bski run\b", name_blob):
            return False
        return bool(re.search(r"\bskis?\b", name_blob))
    return any(kw in name_blob for kw in cat.keywords)


def _name_matches_category(name: str, cat: CategoryDef) -> bool:
    """True only when the business name signals this category (not rental intent alone)."""
    return _category_name_hit((name or "").lower(), cat)


def _name_signals_ski_and_bike(name_blob: str) -> bool:
    return bool(
        re.search(
            r"\bskis?\b.{0,24}\b(bike|bikes|cycle|cycles)\b|"
            r"\b(bike|bikes|cycle|cycles)\b.{0,24}\bskis?\b",
            name_blob,
        )
    )


def _name_signals_cycle_shop(name_blob: str) -> bool:
    if "motorcycle" in name_blob or " motor " in name_blob:
        return False
    return bool(
        re.search(r"\b(cycle works|cycle shop|ski & cycle|skis? & cycle)\b", name_blob)
    )


def _name_keyword_slugs(name: str) -> set[str]:
    name_blob = (name or "").lower()
    slugs = {cat.slug for cat in CATEGORIES if _category_name_hit(name_blob, cat)}
    if _name_signals_ski_and_bike(name_blob):
        slugs.add("mountain-bike")
    elif _name_signals_cycle_shop(name_blob):
        slugs.add("road-bike")
    return slugs


# Django / taxonomy slug -> canonical top-level category (instructions/01_data_model.md §3).
TAXONOMY_SLUG_TO_TOP_LEVEL: dict[str, str] = {
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


def reconcile_top_level_categories(name: str, categories: list[str]) -> list[str]:
    """Drop query-only categories that conflict with clear name-keyword signals."""
    name_slugs = _name_keyword_slugs(name)
    if not name_slugs:
        return sorted(set(categories))

    implied = {
        TAXONOMY_SLUG_TO_TOP_LEVEL[s]
        for s in name_slugs
        if s in TAXONOMY_SLUG_TO_TOP_LEVEL
    }
    kept: set[str] = set()
    for top in categories:
        slugs_for_top = [
            s for s, mapped in TAXONOMY_SLUG_TO_TOP_LEVEL.items() if mapped == top
        ]
        if any(_allow_query_slug(name_slugs, s) for s in slugs_for_top):
            kept.add(top)
    return sorted(kept | implied)


def _allow_query_slug(name_slugs: set[str], source_slug: str) -> bool:
    """Whether a curated search phrase may tag when the name already signals gear type."""
    if not name_slugs:
        return True
    if source_slug in name_slugs:
        return True
    # Alpine vs snowboard vs nordic are mutually exclusive when the name picks one.
    if (name_slugs & SNOW_DISCIPLINE_SLUGS) and source_slug in SNOW_DISCIPLINE_SLUGS:
        return False
    source_cat = CATEGORIES_BY_SLUG.get(source_slug)
    if not source_cat:
        return False
    name_groups = {CATEGORIES_BY_SLUG[s].group for s in name_slugs if s in CATEGORIES_BY_SLUG}
    return source_cat.group in name_groups


def classify(name: str, query: str = "", source_slug: str | None = None) -> set[str]:
    """Tag a business with category slugs.

    Name keywords win for snow disciplines and cross-domain hits. Query-only
    tagging still applies for generic names (e.g. "Tahoe Dave's") and for
    compatible gear in the same group (marina name + kayak search).
    """
    if (
        is_vacation_rental_listing(name)
        or is_rv_rental_business(name)
        or is_standard_car_rental_business(name)
    ):
        return set()

    name_slugs = _name_keyword_slugs(name)
    slugs = set(name_slugs)

    if source_slug and source_slug in CATEGORIES_BY_SLUG:
        cat = CATEGORIES_BY_SLUG[source_slug]
        if _name_matches_category(name, cat):
            slugs.add(source_slug)
        elif query_matches_category(query, source_slug) and _allow_query_slug(
            name_slugs, source_slug
        ):
            slugs.add(source_slug)

    return slugs
