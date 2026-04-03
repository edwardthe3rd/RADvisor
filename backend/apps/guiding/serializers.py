from rest_framework import serializers
from .models import GuideProfile, GuideService, GuideServicePhoto, GuideAvailability, GuideBooking


class GuideProfileSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.profile.display_name", read_only=True, default="")
    user_city = serializers.CharField(source="user.profile.city", read_only=True, default="")
    user_state = serializers.CharField(source="user.profile.state", read_only=True, default="")
    profile_photo = serializers.ImageField(source="user.profile.profile_photo", read_only=True)

    class Meta:
        model = GuideProfile
        fields = (
            "id", "user", "user_name", "user_city", "user_state", "profile_photo",
            "headline", "specialties", "experience_years", "certifications",
            "languages", "is_verified", "is_active", "created_at",
        )
        read_only_fields = ("id", "user", "is_verified", "created_at")


class GuideServicePhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = GuideServicePhoto
        fields = ("id", "image", "sort_order")
        read_only_fields = ("id",)


class GuideAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = GuideAvailability
        fields = ("id", "service", "date", "start_time", "spots_remaining")
        read_only_fields = ("id",)


class GuideServiceListSerializer(serializers.ModelSerializer):
    photos = GuideServicePhotoSerializer(many=True, read_only=True)
    guide_name = serializers.CharField(source="guide.profile.display_name", read_only=True, default="")
    guide_photo = serializers.ImageField(source="guide.profile.profile_photo", read_only=True)
    activity_name = serializers.CharField(source="activity_type.name", read_only=True, default="")
    next_available = serializers.SerializerMethodField()

    class Meta:
        model = GuideService
        fields = (
            "id", "guide", "guide_name", "guide_photo", "title", "description",
            "activity_type", "activity_name", "duration_hours", "max_participants",
            "price_per_person", "difficulty_level", "location_name", "city", "state",
            "includes", "requirements", "photos", "next_available",
            "is_active", "created_at",
        )
        read_only_fields = ("id", "guide", "created_at")

    def get_next_available(self, obj):
        slot = obj.availability_slots.filter(spots_remaining__gt=0).order_by("date").first()
        if slot:
            return str(slot.date)
        return None


class GuideServiceDetailSerializer(GuideServiceListSerializer):
    availability_slots = GuideAvailabilitySerializer(many=True, read_only=True)
    guide_profile = serializers.SerializerMethodField()

    class Meta(GuideServiceListSerializer.Meta):
        fields = GuideServiceListSerializer.Meta.fields + (
            "latitude", "longitude", "availability_slots", "guide_profile", "updated_at",
        )

    def get_guide_profile(self, obj):
        try:
            gp = obj.guide.guide_profile
            return GuideProfileSerializer(gp).data
        except GuideProfile.DoesNotExist:
            return None


class GuideServiceCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = GuideService
        fields = (
            "id", "title", "description", "activity_type", "duration_hours",
            "max_participants", "price_per_person", "difficulty_level",
            "location_name", "city", "state", "latitude", "longitude",
            "includes", "requirements",
        )
        read_only_fields = ("id",)

    def create(self, validated_data):
        validated_data["guide"] = self.context["request"].user
        return super().create(validated_data)


class GuideBookingSerializer(serializers.ModelSerializer):
    service_title = serializers.CharField(source="service.title", read_only=True)
    guest_name = serializers.CharField(source="guest.profile.display_name", read_only=True, default="")
    guide_name = serializers.CharField(source="guide.profile.display_name", read_only=True, default="")

    class Meta:
        model = GuideBooking
        fields = (
            "id", "service", "service_title", "guest", "guest_name",
            "guide", "guide_name", "availability", "date", "participants",
            "price_per_person_at_booking", "total_price", "status",
            "created_at", "updated_at",
        )
        read_only_fields = (
            "id", "guest", "guide", "price_per_person_at_booking",
            "total_price", "created_at", "updated_at",
        )

    def create(self, validated_data):
        request = self.context["request"]
        service = validated_data["service"]
        validated_data["guest"] = request.user
        validated_data["guide"] = service.guide
        validated_data["price_per_person_at_booking"] = service.price_per_person
        booking = GuideBooking(**validated_data)
        booking.full_clean()
        booking.save()
        return booking
