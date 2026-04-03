from django.contrib import admin
from .models import MessageThread, Message


@admin.register(MessageThread)
class ThreadAdmin(admin.ModelAdmin):
    list_display = ("id", "created_at")


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("id", "thread", "sender", "is_read", "created_at")
    list_filter = ("is_read",)
