from django.conf import settings
from django.db import models
from django.core.exceptions import ValidationError


DIFFICULTY_CHOICES = [
    ("easy", "Easy"),
    ("moderate", "Moderate"),
    ("hard", "Hard"),
    ("expert", "Expert"),
]

GUIDE_BOOKING_STATUS = [
    ("pending", "Pending"),
    ("approved", "Approved"),
    ("declined", "Declined"),
    ("active", "Active"),
    ("completed", "Completed"),
    ("canceled", "Canceled"),
]


class GuideProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="guide_profile")
    headline = models.CharField(max_length=200, blank=True, default="")
    specialties = models.JSONField(default=list, blank=True)
    experience_years = models.PositiveIntegerField(default=0)
    certifications = models.JSONField(default=list, blank=True)
    languages = models.JSONField(default=list, blank=True)
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"Guide: {self.user.username}"


class GuideService(models.Model):
    guide = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="guide_services")
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    activity_type = models.ForeignKey("catalog.Category", on_delete=models.SET_NULL, null=True, blank=True)
    duration_hours = models.DecimalField(max_digits=5, decimal_places=1, default=4)
    max_participants = models.PositiveIntegerField(default=6)
    price_per_person = models.DecimalField(max_digits=8, decimal_places=2)
    difficulty_level = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default="moderate")
    location_name = models.CharField(max_length=200, blank=True, default="")
    city = models.CharField(max_length=100, blank=True, default="")
    state = models.CharField(max_length=100, blank=True, default="")
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    includes = models.JSONField(default=list, blank=True)
    requirements = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.title


class GuideServicePhoto(models.Model):
    service = models.ForeignKey(GuideService, on_delete=models.CASCADE, related_name="photos")
    image = models.ImageField(upload_to="guides/")
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order"]

    def __str__(self) -> str:
        return f"Photo {self.sort_order} for {self.service.title}"


class GuideAvailability(models.Model):
    service = models.ForeignKey(GuideService, on_delete=models.CASCADE, related_name="availability_slots")
    date = models.DateField()
    start_time = models.TimeField(null=True, blank=True)
    spots_remaining = models.PositiveIntegerField(default=6)

    class Meta:
        ordering = ["date", "start_time"]
        unique_together = [("service", "date", "start_time")]
        verbose_name_plural = "guide availabilities"

    def __str__(self) -> str:
        return f"{self.service.title} on {self.date}"


class GuideBooking(models.Model):
    service = models.ForeignKey(GuideService, on_delete=models.CASCADE, related_name="bookings")
    guest = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="guide_bookings_as_guest")
    guide = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="guide_bookings_as_guide")
    availability = models.ForeignKey(GuideAvailability, on_delete=models.SET_NULL, null=True, blank=True)
    date = models.DateField()
    participants = models.PositiveIntegerField(default=1)
    price_per_person_at_booking = models.DecimalField(max_digits=8, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=GUIDE_BOOKING_STATUS, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Guide Booking #{self.pk} - {self.service.title}"

    def clean(self):
        if self.guest == self.guide:
            raise ValidationError("You cannot book your own guide service.")

    def save(self, *args, **kwargs):
        if not self.price_per_person_at_booking:
            self.price_per_person_at_booking = self.service.price_per_person
        self.total_price = self.price_per_person_at_booking * self.participants
        super().save(*args, **kwargs)
