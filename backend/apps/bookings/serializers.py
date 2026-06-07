from rest_framework import serializers
from .models import Booking, ReservationRequest


class BookingSerializer(serializers.ModelSerializer):
    gear_item_title = serializers.CharField(source="gear_item.title", read_only=True)
    listing_title = serializers.CharField(source="gear_item.title", read_only=True)
    renter_name = serializers.CharField(source="renter.profile.display_name", read_only=True, default="")
    owner_name = serializers.CharField(source="owner.profile.display_name", read_only=True, default="")
    gear_item_photo = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = (
            "id", "gear_item", "gear_item_title", "listing_title", "gear_item_photo",
            "renter", "renter_name", "owner", "owner_name",
            "start_date", "end_date", "status",
            "daily_rate_at_booking", "deposit_amount_at_booking",
            "subtotal", "total_price", "created_at", "updated_at",
        )
        read_only_fields = (
            "id", "renter", "owner", "daily_rate_at_booking",
            "deposit_amount_at_booking", "subtotal", "total_price",
            "created_at", "updated_at",
        )

    def get_gear_item_photo(self, obj) -> str:
        photo = obj.gear_item.photos.first()
        return photo.image.url if photo else ""

    def create(self, validated_data):
        request = self.context["request"]
        gear_item = validated_data["gear_item"]
        validated_data["renter"] = request.user
        validated_data["owner"] = gear_item.owner
        validated_data["daily_rate_at_booking"] = gear_item.daily_rate
        validated_data["deposit_amount_at_booking"] = gear_item.deposit_amount
        booking = Booking(**validated_data)
        booking.full_clean()
        booking.save()
        return booking


class ReservationRequestSerializer(serializers.ModelSerializer):
    business_name = serializers.CharField(source="business.name", read_only=True)
    business_slug = serializers.CharField(source="business.slug", read_only=True)
    equipment_name = serializers.CharField(source="equipment.name", read_only=True, default="")

    class Meta:
        model = ReservationRequest
        fields = (
            "id", "business", "business_name", "business_slug",
            "equipment", "equipment_name",
            "start_date", "end_date", "party_size", "message",
            "contact_email", "contact_phone", "status",
            "created_at", "updated_at",
        )
        read_only_fields = ("id", "status", "created_at", "updated_at")

    def create(self, validated_data):
        request = self.context["request"]
        user = request.user
        validated_data["user"] = user
        if not validated_data.get("contact_email"):
            validated_data["contact_email"] = user.email
        reservation = ReservationRequest(**validated_data)
        reservation.full_clean()
        reservation.save()
        return reservation
