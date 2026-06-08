"""Geographic bounds for the Reno-Tahoe + western Sierra foothills service area."""

from __future__ import annotations

import math
from typing import Any

# Reno-Tahoe + western Sierra foothills (Nevada & El Dorado counties).
# South ~38.65°N includes Placerville (38.73°N) but excludes Sacramento (38.58°N).
SERVICE_REGION: dict[str, float] = {
    "north": 39.65,
    "south": 38.65,
    "west": -121.20,
    "east": -119.55,
}

# Downtown Reno — Google Text Search center only (not the inclusion boundary).
SEARCH_CENTER_LAT = 39.5296
SEARCH_CENTER_LNG = -119.8138

# Google locationBias circles are capped at 50_000 m; we use a rectangle instead.
GOOGLE_CIRCLE_RADIUS_MAX_M = 50_000

# Cities in the service area (lowercase). Used when Google geocodes to a distant HQ.
SERVICE_LOCALITIES: frozenset[str] = frozenset(
    {
        # Tahoe / Truckee
        "south lake tahoe",
        "tahoe city",
        "truckee",
        "incline village",
        "stateline",
        "zephyr cove",
        "kings beach",
        "olympic valley",
        "carnelian bay",
        "tahoma",
        "homewood",
        "alpine meadows",
        # Reno / Carson
        "reno",
        "sparks",
        "carson city",
        "minden",
        "gardnerville",
        "genoa",
        "virginia city",
        "dayton",
        "fernley",
        # Nevada & Placer foothills
        "grass valley",
        "nevada city",
        "auburn",
        "foresthill",
        "colfax",
        # El Dorado County / American River corridor
        "placerville",
        "diamond springs",
        "camino",
        "pollock pines",
        "garden valley",
        "georgetown",
        "cool",
        "pilot hill",
        "shingle springs",
        "el dorado hills",
        "coloma",
        "lotus",
        "rescue",
        "somerset",
        # Tuolumne County (Stanislaus River / Hwy 120 corridor)
        "groveland",
        "sonora",
        "twain harte",
    }
)

# Counties wholly or partly in the service area (lowercase, without "County").
SERVICE_COUNTIES: frozenset[str] = frozenset(
    {
        "el dorado",
        "placer",
        "nevada",
        "washoe",
        "douglas",
        "alpine",
        "carson city",
        "tuolumne",
    }
)


def _normalize_locality(value: str) -> str:
    return (value or "").strip().lower()


def _normalize_county(value: str) -> str:
    return (value or "").strip().lower().removesuffix(" county")


def within_service_region(lat: float | None, lng: float | None) -> bool:
    """True when coordinates fall inside SERVICE_REGION."""
    if lat is None or lng is None:
        return False
    try:
        lat_f = float(lat)
        lng_f = float(lng)
    except (TypeError, ValueError):
        return False
    r = SERVICE_REGION
    return r["south"] <= lat_f <= r["north"] and r["west"] <= lng_f <= r["east"]


def locality_in_service_area(city: str = "", county: str = "") -> bool:
    """True when parsed city or county is in the known service-area list."""
    city_n = _normalize_locality(city)
    county_n = _normalize_county(county)
    if city_n and city_n in SERVICE_LOCALITIES:
        return True
    if county_n and county_n in SERVICE_COUNTIES:
        return True
    return False


def address_in_service_area(address: str) -> bool:
    """Match service localities embedded in a formatted street address."""
    lower = (address or "").lower()
    if not lower:
        return False
    for loc in SERVICE_LOCALITIES:
        if f", {loc}," in lower or f", {loc} " in lower or lower.rstrip().endswith(f", {loc}"):
            return True
    return False


def within_service_area(
    lat: float | None,
    lng: float | None,
    *,
    city: str = "",
    county: str = "",
    state: str = "",
    address: str = "",
) -> bool:
    """BBox check, with city/county/address fallback for mis-geocoded listings."""
    if state and state.upper() not in ("NV", "CA"):
        return False
    if within_service_region(lat, lng):
        return True
    if state.upper() in ("NV", "CA") and (
        locality_in_service_area(city, county) or address_in_service_area(address)
    ):
        return True
    return False


def search_viewport(region: dict[str, float] | None = None) -> dict[str, float]:
    """Bounding box for Google Text Search `locationBias.rectangle`."""
    r = region or SERVICE_REGION
    return dict(r)


def search_viewport_payload(region: dict[str, float] | None = None) -> dict[str, Any]:
    """Google Places API rectangle for locationBias (low = SW, high = NE)."""
    r = search_viewport(region)
    return {
        "rectangle": {
            "low": {"latitude": r["south"], "longitude": r["west"]},
            "high": {"latitude": r["north"], "longitude": r["east"]},
        }
    }


def distance_miles(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance in miles (diagnostics only)."""
    r_miles = 3958.8
    p = math.pi / 180
    a = (
        math.sin((lat2 - lat1) * p / 2) ** 2
        + math.cos(lat1 * p) * math.cos(lat2 * p) * math.sin((lng2 - lng1) * p / 2) ** 2
    )
    return 2 * r_miles * math.asin(math.sqrt(a))
