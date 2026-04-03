from rest_framework import serializers
from .models import Booking


class BookingSerializer(serializers.ModelSerializer):
    gear_item_title = serializers.CharField(source="gear_item.title", read_only=True)
    renter_name = serializers.CharField(source="renter.profile.display_name", read_only=True, default="")
    owner_name = serializers.CharField(source="owner.profile.display_name", read_only=True, default="")
    gear_item_photo = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = (
            "id", "gear_item", "gear_item_title", "gear_item_photo",
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
