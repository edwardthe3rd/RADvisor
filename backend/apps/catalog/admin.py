from django.contrib import admin
from .models import Category, GearItem, GearPhoto, Wishlist, WishlistItem


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "group", "icon")
    search_fields = ("name", "group")
    prepopulated_fields = {"slug": ("name",)}


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
    list_display = ("wishlist", "gear_item", "guide_service", "created_at")
