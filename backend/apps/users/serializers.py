from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Profile

User = get_user_model()


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ("id", "display_name", "bio", "city", "state", "profile_photo", "created_at")
        read_only_fields = ("id", "created_at")


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ("id", "username", "email", "profile")
        read_only_fields = ("id", "email")


class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    display_name = serializers.CharField(write_only=True, required=False, default="")
    city = serializers.CharField(write_only=True, required=False, default="")
    state = serializers.CharField(write_only=True, required=False, default="")

    class Meta:
        model = User
        fields = ("id", "username", "email", "password", "display_name", "city", "state")

    def create(self, validated_data):
        display_name = validated_data.pop("display_name", "")
        city = validated_data.pop("city", "")
        state = validated_data.pop("state", "")
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        Profile.objects.create(
            user=user,
            display_name=display_name or user.username,
            city=city,
            state=state,
        )
        return user
