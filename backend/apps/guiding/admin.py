from django.contrib import admin
from .models import GuideProfile, GuideService, GuideServicePhoto, GuideAvailability, GuideBooking


@admin.register(GuideProfile)
class GuideProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "headline", "experience_years", "is_verified", "is_active")
    list_filter = ("is_verified", "is_active")
    search_fields = ("user__email", "headline")


class GuideServicePhotoInline(admin.TabularInline):
    model = GuideServicePhoto
    extra = 1


@admin.register(GuideService)
class GuideServiceAdmin(admin.ModelAdmin):
    list_display = ("title", "guide", "price_per_person", "difficulty_level", "city", "is_active")
    list_filter = ("is_active", "difficulty_level")
    search_fields = ("title", "description")
    inlines = [GuideServicePhotoInline]


@admin.register(GuideAvailability)
class GuideAvailabilityAdmin(admin.ModelAdmin):
    list_display = ("service", "date", "start_time", "spots_remaining")
    list_filter = ("date",)


@admin.register(GuideBooking)
class GuideBookingAdmin(admin.ModelAdmin):
    list_display = ("id", "service", "guest", "guide", "date", "status", "total_price")
    list_filter = ("status",)
    search_fields = ("service__title", "guest__email")
