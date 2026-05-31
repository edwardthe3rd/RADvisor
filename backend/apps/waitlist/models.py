from django.db import models


class WaitlistEmail(models.Model):
    email = models.EmailField(unique=True, db_index=True)
    full_name = models.CharField(max_length=200, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.email
