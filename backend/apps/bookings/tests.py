from datetime import date, timedelta
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from apps.catalog.models import Category, GearItem
from apps.bookings.models import Booking
from apps.users.models import Profile

User = get_user_model()


class BookingOverlapTests(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(username="owner", email="owner@test.com", password="pass1234")
        Profile.objects.create(user=self.owner, display_name="Owner")
        self.renter = User.objects.create_user(username="renter", email="renter@test.com", password="pass1234")
        Profile.objects.create(user=self.renter, display_name="Renter")
        self.renter2 = User.objects.create_user(username="renter2", email="renter2@test.com", password="pass1234")
        Profile.objects.create(user=self.renter2, display_name="Renter 2")

        cat = Category.objects.create(name="Tents", slug="tents")
        self.gear = GearItem.objects.create(
            owner=self.owner, title="Test Tent", category=cat,
            daily_rate=Decimal("30.00"), deposit_amount=Decimal("50.00"),
            city="Test", state="CO",
        )

    def _create_booking(self, renter, start, end, status="approved"):
        b = Booking(
            gear_item=self.gear, renter=renter, owner=self.owner,
            start_date=start, end_date=end, status=status,
            daily_rate_at_booking=self.gear.daily_rate,
            deposit_amount_at_booking=self.gear.deposit_amount,
            subtotal=Decimal("0"), total_price=Decimal("0"),
        )
        b.full_clean()
        b.save()
        return b

    def test_non_overlapping_bookings_allowed(self):
        today = date.today()
        self._create_booking(self.renter, today, today + timedelta(days=3))
        b2 = self._create_booking(self.renter2, today + timedelta(days=5), today + timedelta(days=8))
        self.assertEqual(b2.status, "approved")

    def test_overlapping_approved_bookings_rejected(self):
        today = date.today()
        self._create_booking(self.renter, today, today + timedelta(days=5))
        with self.assertRaises(ValidationError):
            self._create_booking(self.renter2, today + timedelta(days=2), today + timedelta(days=7))

    def test_owner_cannot_book_own_gear(self):
        today = date.today()
        with self.assertRaises(ValidationError):
            self._create_booking(self.owner, today, today + timedelta(days=3))

    def test_end_date_must_be_after_start(self):
        today = date.today()
        with self.assertRaises(ValidationError):
            self._create_booking(self.renter, today + timedelta(days=3), today)
