from django.conf import settings
from django.db import models


POST_TYPE_CHOICES = [
    ("trip_report", "Trip Report"),
    ("tip", "Tip"),
    ("question", "Question"),
    ("event", "Event"),
    ("gear_review", "Gear Review"),
    ("general", "General"),
]


class CommunityPost(models.Model):
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="community_posts")
    title = models.CharField(max_length=200)
    body = models.TextField()
    post_type = models.CharField(max_length=20, choices=POST_TYPE_CHOICES, default="general")
    category = models.ForeignKey("catalog.Category", on_delete=models.SET_NULL, null=True, blank=True)
    location_name = models.CharField(max_length=200, blank=True, default="")
    image = models.ImageField(upload_to="community/", blank=True, null=True)
    like_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.title


class CommunityComment(models.Model):
    post = models.ForeignKey(CommunityPost, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="community_comments")
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self) -> str:
        return f"Comment by {self.author} on {self.post.title}"


class CommunityLike(models.Model):
    post = models.ForeignKey(CommunityPost, on_delete=models.CASCADE, related_name="likes")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="community_likes")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("post", "user")]

    def __str__(self) -> str:
        return f"{self.user} likes {self.post.title}"
