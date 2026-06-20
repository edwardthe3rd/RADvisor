from django.contrib import admin
from .models import Business, Category, Equipment, GearItem, GearPhoto, Wishlist, WishlistItem


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "group", "icon")
    search_fields = ("name", "group")
    prepopulated_fields = {"slug": ("name",)}


class EquipmentInline(admin.TabularInline):
    model = Equipment
    extra = 1
    fields = ("name", "category", "brand", "price", "price_unit", "is_available")
    autocomplete_fields = ("category",)


@admin.register(Business)
class BusinessAdmin(admin.ModelAdmin):
    list_display = ("name", "city", "state", "google_rating", "google_rating_count", "is_active", "last_synced_at")
    list_filter = ("is_active", "state", "categories")
    search_fields = ("name", "city", "address", "google_place_id")
    filter_horizontal = ("categories",)
    readonly_fields = ("google_place_id", "last_synced_at", "created_at", "updated_at")
    list_editable = ("is_active",)
    inlines = [EquipmentInline]


@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
    list_display = ("name", "business", "category", "brand", "price", "price_unit", "is_available")
    list_filter = ("is_available", "price_unit", "category__group", "category")
    search_fields = ("name", "brand", "business__name")
    autocomplete_fields = ("business", "category")
    list_editable = ("is_available",)


class GearPhotoInline(admin.TabularInline):
    model = GearPhoto
    extra = 1


@admin.register(GearItem)
class GearItemAdmin(admin.ModelAdmin):
    list_display = ("title", "owner", "category", "daily_rate", "city", "is_active")
    list_filter = ("is_active", "category", "condition")
    search_fields = ("title", "description")
    inlines = [GearPhotoInline]


@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):
    list_display = ("name", "user", "created_at")


@admin.register(WishlistItem)
class WishlistItemAdmin(admin.ModelAdmin):
    list_display = ("wishlist", "gear_item", "created_at")
