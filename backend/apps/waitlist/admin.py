from django.contrib import admin

from .models import WaitlistEmail


@admin.register(WaitlistEmail)
class WaitlistEmailAdmin(admin.ModelAdmin):
    list_display = ("email", "full_name", "created_at")
    search_fields = ("email", "full_name")
    ordering = ("-created_at",)
