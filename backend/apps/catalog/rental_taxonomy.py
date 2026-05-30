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

from dataclasses import dataclass, field


@dataclass(frozen=True)
class CategoryDef:
    slug: str
    name: str
    group: str
    icon: str
    queries: tuple[str, ...] = ()
    keywords: tuple[str, ...] = ()


# Reno / Lake Tahoe is the target region; queries are scoped geographically by
# the ingestion command's location restriction, so phrases stay generic.
CATEGORIES: tuple[CategoryDef, ...] = (
    # --- Snow -------------------------------------------------------------
    CategoryDef(
        "ski", "Ski", "Snow", "\u26f7",
        queries=("ski rental", "ski rental shop", "downhill ski rental"),
        keywords=("ski", "alpine"),
    ),
    CategoryDef(
        "snowboard", "Snowboard", "Snow", "\U0001f3c2",
        queries=("snowboard rental", "snowboard rental shop"),
        keywords=("snowboard", "board shop"),
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
        keywords=("boat", "jet ski", "jetski", "pontoon", "watercraft", "marina", "pwc"),
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
        keywords=("mountain bike", "mtb", "bike shop", "bicycle"),
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
        "rv-camper", "RV & Camper Van", "Vehicles", "\U0001f69a",
        queries=("RV rental", "camper van rental", "motorhome rental"),
        keywords=("rv ", "motorhome", "camper van", "campervan", "recreational vehicle"),
    ),
    CategoryDef(
        "trailer", "Trailers", "Vehicles", "\U0001f6fb",
        queries=("utility trailer rental", "cargo trailer rental"),
        keywords=("trailer rental", "trailer"),
    ),
    CategoryDef(
        "offroad", "ATV, UTV & Off-Road", "Vehicles", "\U0001f3cd",
        queries=("ATV rental", "UTV rental", "side by side rental", "dirt bike rental"),
        keywords=("atv", "utv", "side by side", "off-road", "dirt bike", "polaris", "razor"),
    ),
    # --- E-Transport ------------------------------------------------------
    CategoryDef(
        "e-scooter", "E-Scooter & Personal EV", "E-Transport", "\U0001f6f4",
        queries=("electric scooter rental", "e-scooter rental"),
        keywords=("scooter", "e-scooter", "personal electric"),
    ),
    # --- Air / Other ------------------------------------------------------
    CategoryDef(
        "air", "Air & Other Adventures", "Air/Other", "\U0001fa82",
        queries=("paragliding rental", "hang gliding rental", "outdoor gear rental"),
        keywords=("paraglid", "hang glid", "parasail", "balloon"),
    ),
)


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


def classify(text: str, source_slug: str | None = None) -> set[str]:
    """Tag a business with category slugs.

    `text` should be a lowercased blob of the business name plus the search query
    that surfaced it. `source_slug` is the category whose query found the place and
    is always included (it is the strongest signal).
    """
    blob = (text or "").lower()
    slugs: set[str] = set()
    if source_slug and source_slug in CATEGORIES_BY_SLUG:
        slugs.add(source_slug)
    for cat in CATEGORIES:
        if any(kw in blob for kw in cat.keywords):
            slugs.add(cat.slug)
    return slugs
