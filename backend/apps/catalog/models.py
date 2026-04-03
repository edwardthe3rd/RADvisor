from django.conf import settings
from django.db import models


CONDITION_CHOICES = [
    ("new", "New"),
    ("like_new", "Like New"),
    ("good", "Good"),
    ("fair", "Fair"),
    ("worn", "Well Worn"),
]


class Category(models.Model):
    name = models.CharField(max_length=80)
    slug = models.SlugField(max_length=120, unique=True)
    group = models.CharField(max_length=80, blank=True, default="")
    icon = models.CharField(max_length=10, blank=True, default="")

    class Meta:
        ordering = ["group", "name"]
        verbose_name_plural = "categories"

    def __str__(self) -> str:
        return self.name


class GearItem(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="gear_items")
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name="gear_items")
    brand = models.CharField(max_length=100, blank=True, default="")
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, default="good")
    daily_rate = models.DecimalField(max_digits=8, decimal_places=2)
    deposit_amount = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    replacement_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    minimum_rental_days = models.PositiveIntegerField(default=1)
    city = models.CharField(max_length=100, blank=True, default="")
    state = models.CharField(max_length=100, blank=True, default="")
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    image_url = models.URLField(max_length=500, blank=True, default="")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.title


class GearPhoto(models.Model):
    gear_item = models.ForeignKey(GearItem, on_delete=models.CASCADE, related_name="photos")
    image = models.ImageField(upload_to="gear/")
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order"]

    def __str__(self) -> str:
        return f"Photo {self.sort_order} for {self.gear_item.title}"


class Wishlist(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="wishlists")
    name = models.CharField(max_length=120, default="Saved")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.name} ({self.user.username})"


class WishlistItem(models.Model):
    wishlist = models.ForeignKey(Wishlist, on_delete=models.CASCADE, related_name="items")
    gear_item = models.ForeignKey(GearItem, on_delete=models.CASCADE, null=True, blank=True, related_name="wishlist_items")
    guide_service = models.ForeignKey(
        "guiding.GuideService", on_delete=models.CASCADE, null=True, blank=True, related_name="wishlist_items"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.CheckConstraint(
                check=(
                    models.Q(gear_item__isnull=False, guide_service__isnull=True)
                    | models.Q(gear_item__isnull=True, guide_service__isnull=False)
                ),
                name="wishlist_item_exactly_one_fk",
            ),
        ]

    def __str__(self) -> str:
        target = self.gear_item or self.guide_service
        return f"Wishlist item: {target}"
