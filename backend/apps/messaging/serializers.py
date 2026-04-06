from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import MessageThread, Message

User = get_user_model()


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.profile.display_name", read_only=True, default="")

    class Meta:
        model = Message
        fields = ("id", "thread", "sender", "sender_name", "body", "is_read", "created_at")
        read_only_fields = ("id", "sender", "created_at")


class ThreadSerializer(serializers.ModelSerializer):
    last_message = serializers.SerializerMethodField()
    last_message_at = serializers.SerializerMethodField()
    other_user = serializers.SerializerMethodField()
    other_user_name = serializers.SerializerMethodField()
    other_user_photo = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = MessageThread
        fields = (
            "id", "participants", "booking", "gear_item", "guide_booking",
            "last_message", "last_message_at",
            "other_user", "other_user_name", "other_user_photo",
            "unread_count", "created_at",
        )
        read_only_fields = ("id", "created_at")

    def _get_last_msg(self, obj):
        if not hasattr(obj, "_cached_last_msg"):
            obj._cached_last_msg = obj.messages.order_by("-created_at").first()
        return obj._cached_last_msg

    def get_last_message(self, obj):
        msg = self._get_last_msg(obj)
        return msg.body if msg else None

    def get_last_message_at(self, obj):
        msg = self._get_last_msg(obj)
        return msg.created_at if msg else None

    def _get_other(self, obj):
        if not hasattr(obj, "_cached_other"):
            request = self.context.get("request")
            if not request:
                obj._cached_other = None
            else:
                obj._cached_other = obj.participants.exclude(pk=request.user.pk).select_related("profile").first()
        return obj._cached_other

    def get_other_user(self, obj):
        other = self._get_other(obj)
        if other:
            profile = getattr(other, "profile", None)
            return {
                "id": other.id,
                "display_name": profile.display_name if profile else other.username,
                "profile_photo": profile.profile_photo.url if profile and profile.profile_photo else None,
            }
        return None

    def get_other_user_name(self, obj):
        other = self._get_other(obj)
        if other:
            profile = getattr(other, "profile", None)
            return profile.display_name if profile and profile.display_name else other.username
        return None

    def get_other_user_photo(self, obj):
        other = self._get_other(obj)
        if other:
            profile = getattr(other, "profile", None)
            if profile and profile.profile_photo:
                request = self.context.get("request")
                if request:
                    return request.build_absolute_uri(profile.profile_photo.url)
                return profile.profile_photo.url
        return None

    def get_unread_count(self, obj):
        request = self.context.get("request")
        if not request:
            return 0
        return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
