"""Deactivate Google-sourced businesses that fail region or relevance filters.

Uses the same rules as `sync_reno_businesses` (see `business_filters`).

Usage:
    python manage.py prune_reno_businesses --dry-run
    python manage.py prune_reno_businesses
    python manage.py prune_reno_businesses --reactivate
"""

from __future__ import annotations

from collections import Counter

from django.core.management.base import BaseCommand

from apps.catalog.business_filters import evaluate_business, region_diagnostic
from apps.catalog.models import Business


class Command(BaseCommand):
    help = "Deactivate out-of-region or irrelevant businesses already in the database."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Report what would change without writing to the DB.",
        )
        parser.add_argument(
            "--reactivate",
            action="store_true",
            help="Set is_active=True on rows that now pass filters (default: deactivate failures).",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        reactivate = options["reactivate"]

        deactivate_counts: Counter[str] = Counter()
        reactivate_count = 0
        unchanged = 0

        for business in Business.objects.all().order_by("name"):
            lat = float(business.latitude) if business.latitude is not None else None
            lng = float(business.longitude) if business.longitude is not None else None

            existing_slugs = set(business.categories.values_list("slug", flat=True))
            reason, _slugs = evaluate_business(
                name=business.name,
                website=business.website or "",
                state=business.state or "",
                city=business.city or "",
                county="",
                address=business.address or "",
                lat=lat,
                lng=lng,
                types=None,
                business_status=None,
                query="",
                source_slug=None,
                existing_category_slugs=existing_slugs,
            )
            passes = reason is None
            geo = region_diagnostic(
                lat,
                lng,
                city=business.city or "",
                state=business.state or "",
                address=business.address or "",
            )

            if reactivate:
                if passes and not business.is_active:
                    reactivate_count += 1
                    self.stdout.write(self.style.SUCCESS(f"  + reactivate: {business.name} ({geo})"))
                    if not dry_run:
                        business.is_active = True
                        business.save(update_fields=["is_active", "updated_at"])
                elif not passes and business.is_active:
                    unchanged += 1
                else:
                    unchanged += 1
                continue

            if not passes and business.is_active:
                deactivate_counts[reason or "unknown"] += 1
                self.stdout.write(
                    self.style.WARNING(f"  - deactivate: {business.name} ({reason}; {geo})")
                )
                if not dry_run:
                    business.is_active = False
                    business.save(update_fields=["is_active", "updated_at"])
            else:
                unchanged += 1

        if reactivate:
            self.stdout.write(
                self.style.SUCCESS(
                    f"\n{'Would reactivate' if dry_run else 'Reactivated'} {reactivate_count}; "
                    f"{unchanged} unchanged."
                )
            )
        else:
            total = sum(deactivate_counts.values())
            self.stdout.write(
                self.style.SUCCESS(
                    f"\n{'Would deactivate' if dry_run else 'Deactivated'} {total}; "
                    f"{unchanged} unchanged."
                )
            )
            if deactivate_counts:
                self.stdout.write(
                    "Reasons: " + ", ".join(f"{k}={v}" for k, v in deactivate_counts.most_common())
                )

        if dry_run:
            self.stdout.write(self.style.WARNING("Dry run: no changes written."))
