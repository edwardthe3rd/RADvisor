from rest_framework import serializers
from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.CharField(source="reviewer.profile.display_name", read_only=True, default="")
    reviewee_name = serializers.CharField(source="reviewee.profile.display_name", read_only=True, default="")

    class Meta:
        model = Review
        fields = ("id", "booking", "guide_booking", "reviewer", "reviewer_name", "reviewee", "reviewee_name", "rating", "comment", "created_at")
        read_only_fields = ("id", "reviewer", "created_at")

    def create(self, validated_data):
        validated_data["reviewer"] = self.context["request"].user
        return super().create(validated_data)
