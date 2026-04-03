from rest_framework import viewsets, generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import MessageThread, Message
from .serializers import ThreadSerializer, MessageSerializer


class ThreadViewSet(viewsets.ModelViewSet):
    serializer_class = ThreadSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return MessageThread.objects.filter(
            participants=self.request.user
        ).prefetch_related("messages", "participants__profile")


class ThreadMessagesView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        thread = MessageThread.objects.get(pk=self.kwargs["thread_pk"])
        if not thread.participants.filter(pk=self.request.user.pk).exists():
            return Message.objects.none()
        thread.messages.filter(is_read=False).exclude(sender=self.request.user).update(is_read=True)
        return thread.messages.all()

    def perform_create(self, serializer):
        thread = MessageThread.objects.get(pk=self.kwargs["thread_pk"])
        serializer.save(thread=thread, sender=self.request.user)


class StartThreadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        other_user_id = request.data.get("other_user_id")
        gear_item_id = request.data.get("gear_item_id")
        guide_booking_id = request.data.get("guide_booking_id")

        if not other_user_id:
            return Response({"error": "other_user_id required"}, status=status.HTTP_400_BAD_REQUEST)

        threads = MessageThread.objects.filter(participants=request.user).filter(participants=other_user_id)
        if gear_item_id:
            threads = threads.filter(gear_item_id=gear_item_id)
        thread = threads.first()

        if not thread:
            thread = MessageThread.objects.create(
                gear_item_id=gear_item_id,
                guide_booking_id=guide_booking_id,
            )
            thread.participants.add(request.user, other_user_id)

        return Response(ThreadSerializer(thread, context={"request": request}).data, status=status.HTTP_201_CREATED)
