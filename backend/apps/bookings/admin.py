from django.contrib import admin
from .models import Booking


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ("id", "gear_item", "renter", "owner", "status", "start_date", "end_date", "total_price")
    list_filter = ("status",)
    search_fields = ("gear_item__title", "renter__email")
