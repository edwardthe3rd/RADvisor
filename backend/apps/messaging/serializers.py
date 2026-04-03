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
    other_user = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = MessageThread
        fields = ("id", "participants", "booking", "gear_item", "guide_booking", "last_message", "other_user", "unread_count", "created_at")
        read_only_fields = ("id", "created_at")

    def get_last_message(self, obj):
        msg = obj.messages.order_by("-created_at").first()
        if msg:
            return {"body": msg.body, "sender": msg.sender_id, "created_at": msg.created_at}
        return None

    def get_other_user(self, obj):
        request = self.context.get("request")
        if not request:
            return None
        other = obj.participants.exclude(pk=request.user.pk).first()
        if other:
            profile = getattr(other, "profile", None)
            return {
                "id": other.id,
                "display_name": profile.display_name if profile else other.username,
                "profile_photo": profile.profile_photo.url if profile and profile.profile_photo else None,
            }
        return None

    def get_unread_count(self, obj):
        request = self.context.get("request")
        if not request:
            return 0
        return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
