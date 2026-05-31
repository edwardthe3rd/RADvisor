from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("waitlist", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="waitlistemail",
            name="full_name",
            field=models.CharField(blank=True, default="", max_length=200),
        ),
    ]
