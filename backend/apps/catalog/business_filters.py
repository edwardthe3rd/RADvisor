"""Shared relevance and region gates for Google-sourced rental businesses."""

from __future__ import annotations

from apps.catalog.geo import (
    SEARCH_CENTER_LAT,
    SEARCH_CENTER_LNG,
    address_in_service_area,
    locality_in_service_area,
    within_service_area,
)
from apps.catalog.rental_taxonomy import (
    ALLOWED_STATES,
    CATEGORIES,
    HARD_EXCLUDE_KEYWORDS,
    HARD_EXCLUDE_PLACE_TYPES,
    OUTDOOR_RENTAL_NAME_MARKERS,
    RENTAL_INTENT_KEYWORDS,
    SOFT_EXCLUDE_KEYWORDS,
    SOFT_EXCLUDE_PLACE_TYPES,
    classify,
    is_curated_rental_query,
    query_matches_category,
)

CLOSED_PERMANENTLY = "CLOSED_PERMANENTLY"

# Google primary types that commonly indicate outdoor gear / rental businesses.
INCLUDE_PLACE_TYPES: tuple[str, ...] = (
    "sporting_goods_store",
    "bicycle_store",
    "marina",
    "boat_rental",
    "campground",
    "tourist_attraction",
)


def _blob(*parts: str) -> str:
    return " ".join(p for p in parts if p).lower()


def _outdoor_rental_name(blob: str) -> bool:
    """True when the name clearly indicates gear/sports rental, not lodging only."""
    if _has_rental_intent(blob) or _matches_any_category_keyword(blob):
        return True
    return any(marker in blob for marker in OUTDOOR_RENTAL_NAME_MARKERS)


def _has_exclude_keyword(blob: str) -> str | None:
    for kw in HARD_EXCLUDE_KEYWORDS:
        if kw in blob:
            return f"excluded:{kw.strip()}"
    if not _outdoor_rental_name(blob):
        for kw in SOFT_EXCLUDE_KEYWORDS:
            if kw in blob:
                return f"excluded:{kw.strip()}"
    return None


def _has_exclude_place_type(types: list[str] | None, *, name_blob: str = "") -> str | None:
    if not types:
        return None
    skip_soft = _outdoor_rental_name(name_blob) or _has_include_place_type(types)
    for t in types:
        normalized = (t or "").lower().replace(" ", "_")
        for ex in HARD_EXCLUDE_PLACE_TYPES:
            if normalized == ex or normalized.endswith(f"_{ex}") or ex in normalized:
                return f"excluded_type:{ex}"
        if not skip_soft:
            for ex in SOFT_EXCLUDE_PLACE_TYPES:
                if normalized == ex or normalized.endswith(f"_{ex}") or ex in normalized:
                    return f"excluded_type:{ex}"
    return None


def _has_include_place_type(types: list[str] | None) -> bool:
    if not types:
        return False
    for t in types:
        normalized = (t or "").lower().replace(" ", "_")
        for inc in INCLUDE_PLACE_TYPES:
            if normalized == inc or normalized.endswith(f"_{inc}") or inc in normalized:
                return True
    return False


def _has_rental_intent(blob: str) -> bool:
    return any(kw in blob for kw in RENTAL_INTENT_KEYWORDS)


def _matches_any_category_keyword(blob: str) -> bool:
    return any(kw in blob for cat in CATEGORIES for kw in cat.keywords)


def _name_positive_signal(name: str, website: str = "") -> bool:
    blob = _blob(name, website)
    return _has_rental_intent(blob) or _matches_any_category_keyword(blob)


def _discovery_positive_signal(
    query: str,
    source_slug: str | None,
    types: list[str] | None,
) -> bool:
    """Accept places Google returned for our rental search phrases."""
    if is_curated_rental_query(query):
        return True
    if source_slug and query_matches_category(query, source_slug):
        return True
    return _has_include_place_type(types)


def has_positive_signal(
    name: str,
    *,
    website: str = "",
    query: str = "",
    source_slug: str | None = None,
    types: list[str] | None = None,
    existing_category_slugs: set[str] | None = None,
) -> bool:
    if existing_category_slugs:
        return True
    if _name_positive_signal(name, website):
        return True
    if _discovery_positive_signal(query, source_slug, types):
        return True
    return False


def passes_hard_filters(
    name: str,
    *,
    website: str = "",
    state: str = "",
    types: list[str] | None = None,
) -> str | None:
    """Return rejection reason for geo-agnostic hard excludes, or None."""
    blob = _blob(name, website)
    if hit := _has_exclude_keyword(blob):
        return hit
    if hit := _has_exclude_place_type(types, name_blob=blob):
        return hit
    if state and state.upper() not in ALLOWED_STATES:
        return f"state:{state.upper()}"
    return None


def is_relevant(
    name: str,
    *,
    website: str = "",
    types: list[str] | None = None,
    state: str = "",
    query: str = "",
    source_slug: str | None = None,
    existing_category_slugs: set[str] | None = None,
) -> bool:
    if passes_hard_filters(name, website=website, state=state, types=types):
        return False
    return has_positive_signal(
        name,
        website=website,
        query=query,
        source_slug=source_slug,
        types=types,
        existing_category_slugs=existing_category_slugs,
    )


def rejection_reason(
    *,
    name: str,
    website: str = "",
    state: str = "",
    city: str = "",
    county: str = "",
    address: str = "",
    lat: float | None = None,
    lng: float | None = None,
    types: list[str] | None = None,
    business_status: str | None = None,
    query: str = "",
    source_slug: str | None = None,
    existing_category_slugs: set[str] | None = None,
) -> str | None:
    """Return a short rejection code, or None if the business should be kept."""
    if business_status == CLOSED_PERMANENTLY:
        return "closed_permanently"
    in_area = (
        within_service_area(
            lat, lng, city=city, county=county, state=state, address=address
        )
        if lat is not None and lng is not None
        else state.upper() in ("NV", "CA")
        and (
            locality_in_service_area(city, county)
            or address_in_service_area(address)
        )
    )
    if not in_area:
        if lat is None or lng is None:
            return "missing_coordinates"
        return "out_of_region"
    if hit := passes_hard_filters(name, website=website, state=state, types=types):
        return hit
    if not has_positive_signal(
        name,
        website=website,
        query=query,
        source_slug=source_slug,
        types=types,
        existing_category_slugs=existing_category_slugs,
    ):
        return "no_rental_signal"
    slugs = classify(name, query=query, source_slug=source_slug)
    if not slugs and not existing_category_slugs:
        return "uncategorized"
    return None


def evaluate_business(
    *,
    name: str,
    website: str = "",
    state: str = "",
    city: str = "",
    county: str = "",
    address: str = "",
    lat: float | None = None,
    lng: float | None = None,
    types: list[str] | None = None,
    business_status: str | None = None,
    query: str = "",
    source_slug: str | None = None,
    existing_category_slugs: set[str] | None = None,
) -> tuple[str | None, set[str]]:
    """Return (rejection_reason, category_slugs). reason is None when accepted."""
    reason = rejection_reason(
        name=name,
        website=website,
        state=state,
        city=city,
        county=county,
        address=address,
        lat=lat,
        lng=lng,
        types=types,
        business_status=business_status,
        query=query,
        source_slug=source_slug,
        existing_category_slugs=existing_category_slugs,
    )
    if reason:
        return reason, set()
    slugs = classify(name, query=query, source_slug=source_slug)
    if existing_category_slugs:
        slugs |= existing_category_slugs
    if not slugs:
        return "uncategorized", set()
    return None, slugs


def region_diagnostic(
    lat: float | None,
    lng: float | None,
    *,
    city: str = "",
    county: str = "",
    state: str = "",
    address: str = "",
) -> str:
    """Human-readable geo note for dry-run output."""
    from apps.catalog.geo import distance_miles

    if lat is None or lng is None:
        if locality_in_service_area(city, county) or address_in_service_area(address):
            return f"no coordinates; locality {city or county or address[:40]} in service area"
        return "no coordinates"
    mi = distance_miles(float(lat), float(lng), SEARCH_CENTER_LAT, SEARCH_CENTER_LNG)
    inside = within_service_area(
        lat, lng, city=city, county=county, state=state, address=address
    )
    note = "in region" if inside else "out of region"
    if not inside and (
        locality_in_service_area(city, county) or address_in_service_area(address)
    ):
        note = "coords out of box but address/locality in service area"
    return f"{note}, {mi:.0f} mi from Reno center"
