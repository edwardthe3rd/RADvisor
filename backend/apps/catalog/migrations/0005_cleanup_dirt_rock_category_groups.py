from django.db import migrations


def forwards(apps, schema_editor):
    Category = apps.get_model("catalog", "Category")
    for cat in Category.objects.filter(group="Dirt/Rock"):
        if cat.slug == "climbing":
            cat.group = "Rock"
        else:
            cat.group = "Dirt"
        cat.save(update_fields=["group"])


def backwards(apps, schema_editor):
    Category = apps.get_model("catalog", "Category")
    for cat in Category.objects.filter(group__in=("Dirt", "Rock")).filter(
        slug__in=("climbing", "motorsports", "mtb")
    ):
        cat.group = "Dirt/Rock"
        cat.save(update_fields=["group"])


class Migration(migrations.Migration):
    dependencies = [
        ("catalog", "0004_gearitem_image_url"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
