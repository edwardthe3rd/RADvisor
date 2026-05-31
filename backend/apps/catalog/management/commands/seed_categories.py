"""Seed the canonical outdoor-rental Category rows from the taxonomy.

Idempotent: re-running updates name/group/icon without creating duplicates.

    python manage.py seed_categories
"""

from __future__ import annotations

from django.core.management.base import BaseCommand

from apps.catalog.models import Category
from apps.catalog.rental_taxonomy import CATEGORIES


class Command(BaseCommand):
    help = "Create/update Category rows from the rental taxonomy."

    def handle(self, *args, **options):
        created = 0
        updated = 0
        for cat in CATEGORIES:
            obj, was_created = Category.objects.update_or_create(
                slug=cat.slug,
                defaults={"name": cat.name, "group": cat.group, "icon": cat.icon},
            )
            if was_created:
                created += 1
            else:
                updated += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Categories seeded: {created} created, {updated} updated "
                f"({Category.objects.count()} total)."
            )
        )
