"""
Load Incline Village rental catalog into Django (catalog.GearItem).

Creates one system user per real business (shop owner) and one GearItem per
website-listed SKU. Re-runnable: uses update_or_create on (owner, title).

Purge removes all users with email @incline-shops.radvisor.local (and cascaded
gear) so you can re-seed cleanly.
"""

from __future__ import annotations

from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from apps.catalog.models import Category, GearItem
from apps.users.models import Profile
from incline_village_rentals.data import BUSINESSES

User = get_user_model()

SHOP_EMAIL_DOMAIN = "incline-shops.radvisor.local"

_CATEGORY_DEFAULTS: list[tuple[str, str, str]] = [
    ("skiing", "Skiing", "Snow"),
    ("snowboarding", "Snowboarding", "Snow"),
    ("mtb", "MTB", "Dirt"),
    ("kayaks", "Kayaks", "Water"),
    ("paddleboards", "Paddleboards", "Water"),
    ("boats", "Boats", "Water"),
]


def _ensure_categories() -> dict[str, Category]:
    out: dict[str, Category] = {}
    for slug, name, group in _CATEGORY_DEFAULTS:
        cat, _ = Category.objects.get_or_create(
            slug=slug,
            defaults={"name": name, "group": group, "icon": ""},
        )
        if cat.group != group:
            cat.group = group
            cat.save(update_fields=["group"])
        out[slug] = cat
    return out


def _shop_email(slug: str) -> str:
    return f"{slug}@{SHOP_EMAIL_DOMAIN}"


def _map_category_slug(item: dict) -> str | None:
    raw = (item.get("category") or "").lower()
    name = (item.get("name") or "").lower()

    if "locker" in raw or "locker" in name:
        return None
    if "wax" in name or "tune" in name or "binding test" in name:
        return None

    if raw.startswith("beach rental") and "paddle" in raw:
        return "paddleboards"
    if raw.startswith("beach rental") and "kayak" in raw:
        return "kayaks"

    if "snowboard" in raw:
        return "snowboarding"
    if raw in ("skis", "ski package"):
        return "skiing"
    if raw == "snowboards":
        return "snowboarding"

    if raw == "demo":
        if "snowboard" in name:
            return "snowboarding"
        if "board" in name and "ski" not in name:
            return "snowboarding"
        return "skiing"

    if raw in ("a la carte", "a la carte (winter)"):
        if "snowboard" in name:
            return "snowboarding"
        return "skiing"

    if "snowshoe" in raw:
        return "skiing"

    if raw == "bikes" or "mtb" in raw or raw == "e-bikes" or "e-mtb" in raw:
        return "mtb"
    if raw == "mountain bikes":
        return "mtb"

    if "kayak" in raw:
        return "kayaks"
    if "paddleboard" in raw:
        return "paddleboards"
    if raw == "specialty watercraft":
        return "boats"
    if raw == "guided tours":
        return "paddleboards"
    if raw in ("cross-country skis", "backcountry demo"):
        return "skiing"

    if raw == "accessories":
        if any(x in name for x in ("bike", "mountain", "flume", "trek", "wagon")):
            return "mtb"
        return "paddleboards"

    return "mtb"


def _resolve_daily_rate(item: dict) -> Decimal:
    if item.get("price_full_day") is not None:
        return Decimal(str(item["price_full_day"]))
    unit = (item.get("price_unit") or "").lower()
    if "day" in unit or "24hr" in unit or "person" in unit:
        return Decimal(str(item["price"]))
    return Decimal(str(item["price"]))


def _pricing_lines(item: dict) -> str:
    lines = [f"Advertised: ${item['price']:.2f} / {item.get('price_unit', '')}".strip()]
    if item.get("price_weekend") is not None:
        lines.append(f"Weekend: ${item['price_weekend']:.2f}")
    if item.get("price_peak") is not None:
        lines.append(f"Peak: ${item['price_peak']:.2f}")
    if item.get("price_full_day") is not None and "full day" not in lines[0].lower():
        lines.append(f"Full day option: ${item['price_full_day']:.2f}")
    return " | ".join(lines)


def _gear_description(biz: dict, item: dict) -> str:
    blocks = [
        f"[{biz['name']}] Incline Village, NV — shop rental (not a peer listing).",
        item.get("description") or "",
    ]
    if item.get("sizes"):
        blocks.append(f"Sizes / capacity: {item['sizes']}.")
    blocks.append(_pricing_lines(item))
    blocks.append(
        f"Address: {biz.get('address', '')}, {biz['city']}, {biz['state']} {biz.get('zip', '')}. "
        f"Phone: {biz.get('phone', '')}. Web: {biz.get('website', '')}"
    )
    if biz.get("hours"):
        blocks.append(f"Hours: {biz['hours']}")
    if biz.get("source"):
        blocks.append(f"Source: {biz['source']}")
    return "\n\n".join(b for b in blocks if b)


class Command(BaseCommand):
    help = "Seed catalog.GearItem from incline_village_rentals.data (one shop user per business)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--purge",
            action="store_true",
            help=f"Delete all users @{SHOP_EMAIL_DOMAIN} and their gear before seeding",
        )

    def handle(self, *args, **options):
        if options["purge"]:
            qs = User.objects.filter(email__endswith=f"@{SHOP_EMAIL_DOMAIN}")
            n = qs.count()
            qs.delete()
            self.stdout.write(self.style.WARNING(f"Purge: removed {n} shop owner account(s)."))

        cats = _ensure_categories()
        total_gear = 0

        for biz in BUSINESSES:
            email = _shop_email(biz["slug"])
            username = f"iv_shop_{biz['slug']}"[:150]
            user, created = User.objects.get_or_create(
                email=email,
                defaults={"username": username},
            )
            if user.username != username:
                user.username = username
                user.save(update_fields=["username"])
            user.set_unusable_password()
            user.save(update_fields=["password"])

            Profile.objects.update_or_create(
                user=user,
                defaults={
                    "display_name": biz["name"],
                    "city": biz["city"],
                    "state": biz["state"],
                    "bio": (biz.get("notes") or "")[:500],
                },
            )

            for item in biz["gear"]:
                slug = _map_category_slug(item)
                cat = cats[slug] if slug else None
                title = (item.get("name") or "Rental")[:200]
                desc = _gear_description(biz, item)
                rate = _resolve_daily_rate(item)
                brand = (item.get("brand") or "")[:100]

                GearItem.objects.update_or_create(
                    owner=user,
                    title=title,
                    defaults={
                        "description": desc,
                        "category": cat,
                        "brand": brand,
                        "condition": "good",
                        "daily_rate": rate,
                        "deposit_amount": Decimal("0"),
                        "city": biz["city"],
                        "state": biz["state"],
                        "image_url": (item.get("image_url") or "")[:500],
                        "is_active": True,
                    },
                )
                total_gear += 1

            self.stdout.write(
                f"  {'+' if created else '~'} {biz['name']}: {len(biz['gear'])} items → {email}"
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. {len(BUSINESSES)} shop owners, {total_gear} gear rows. "
                f"Listings API: /api/v1/listings/"
            )
        )
