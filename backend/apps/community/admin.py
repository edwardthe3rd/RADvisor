from django.contrib import admin
from .models import CommunityPost, CommunityComment, CommunityLike


@admin.register(CommunityPost)
class CommunityPostAdmin(admin.ModelAdmin):
    list_display = ("title", "author", "post_type", "like_count", "created_at")
    list_filter = ("post_type",)
    search_fields = ("title", "body")


@admin.register(CommunityComment)
class CommunityCommentAdmin(admin.ModelAdmin):
    list_display = ("id", "post", "author", "created_at")
    search_fields = ("body",)


@admin.register(CommunityLike)
class CommunityLikeAdmin(admin.ModelAdmin):
    list_display = ("post", "user", "created_at")
