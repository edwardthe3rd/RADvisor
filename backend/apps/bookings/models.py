from django.conf import settings
from django.db import models
from django.core.exceptions import ValidationError


STATUS_CHOICES = [
    ("pending", "Pending"),
    ("approved", "Approved"),
    ("declined", "Declined"),
    ("active", "Active"),
    ("completed", "Completed"),
    ("canceled", "Canceled"),
]


class Booking(models.Model):
    gear_item = models.ForeignKey("catalog.GearItem", on_delete=models.CASCADE, related_name="bookings")
    renter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="bookings_as_renter")
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="bookings_as_owner")
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    daily_rate_at_booking = models.DecimalField(max_digits=8, decimal_places=2)
    deposit_amount_at_booking = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Booking #{self.pk} - {self.gear_item.title}"

    def clean(self):
        if self.end_date <= self.start_date:
            raise ValidationError("End date must be after start date.")
        if self.renter == self.owner:
            raise ValidationError("You cannot book your own gear.")
        overlapping = Booking.objects.filter(
            gear_item=self.gear_item,
            status__in=["approved", "active"],
            start_date__lt=self.end_date,
            end_date__gt=self.start_date,
        ).exclude(pk=self.pk)
        if overlapping.exists():
            raise ValidationError("This gear is already booked for the selected dates.")

    def save(self, *args, **kwargs):
        days = (self.end_date - self.start_date).days
        if not self.daily_rate_at_booking:
            self.daily_rate_at_booking = self.gear_item.daily_rate
        if not self.deposit_amount_at_booking:
            self.deposit_amount_at_booking = self.gear_item.deposit_amount
        self.subtotal = self.daily_rate_at_booking * days
        self.total_price = self.subtotal + self.deposit_amount_at_booking
        super().save(*args, **kwargs)


RESERVATION_STATUS_CHOICES = [
    ("pending", "Pending"),
    ("contacted", "Contacted"),
    ("confirmed", "Confirmed"),
    ("closed", "Closed"),
    ("canceled", "Canceled"),
]


class ReservationRequest(models.Model):
    """A consumer's request to reserve gear from a directory Business.

    Unlike `Booking` (legacy P2P, tied to a user-owned GearItem), directory
    businesses are external Google-sourced records with no owner account and no
    online payment. A reservation is a lead the signed-in user submits; it is
    stored on their account and followed up out-of-band. No payment is taken.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reservation_requests"
    )
    business = models.ForeignKey(
        "catalog.Business", on_delete=models.CASCADE, related_name="reservation_requests"
    )
    equipment = models.ForeignKey(
        "catalog.Equipment", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="reservation_requests",
    )
    start_date = models.DateField()
    end_date = models.DateField()
    party_size = models.PositiveSmallIntegerField(default=1)
    message = models.TextField(blank=True, default="")
    contact_email = models.EmailField(blank=True, default="")
    contact_phone = models.CharField(max_length=40, blank=True, default="")
    status = models.CharField(max_length=20, choices=RESERVATION_STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Reservation #{self.pk} - {self.business.name}"

    def clean(self):
        if self.end_date < self.start_date:
            raise ValidationError("End date must be on or after start date.")
