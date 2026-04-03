from django.db import models
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Booking
from .serializers import BookingSerializer


class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Booking.objects.filter(
            models.Q(renter=user) | models.Q(owner=user)
        ).select_related("gear_item", "renter__profile", "owner__profile").prefetch_related("gear_item__photos")

    @action(detail=False, methods=["get"])
    def my_rentals(self, request):
        qs = Booking.objects.filter(renter=request.user).select_related(
            "gear_item", "owner__profile"
        ).prefetch_related("gear_item__photos")
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def requests(self, request):
        qs = Booking.objects.filter(owner=request.user).select_related(
            "gear_item", "renter__profile"
        ).prefetch_related("gear_item__photos")
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        booking = self.get_object()
        if booking.owner != request.user:
            return Response({"error": "Only the owner can approve."}, status=status.HTTP_403_FORBIDDEN)
        if booking.status != "pending":
            return Response({"error": "Only pending bookings can be approved."}, status=status.HTTP_400_BAD_REQUEST)
        booking.status = "approved"
        booking.save()
        return Response(BookingSerializer(booking).data)

    @action(detail=True, methods=["post"])
    def decline(self, request, pk=None):
        booking = self.get_object()
        if booking.owner != request.user:
            return Response({"error": "Only the owner can decline."}, status=status.HTTP_403_FORBIDDEN)
        if booking.status != "pending":
            return Response({"error": "Only pending bookings can be declined."}, status=status.HTTP_400_BAD_REQUEST)
        booking.status = "declined"
        booking.save()
        return Response(BookingSerializer(booking).data)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        booking = self.get_object()
        if booking.renter != request.user and booking.owner != request.user:
            return Response({"error": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
        if booking.status in ("completed", "canceled", "declined"):
            return Response({"error": "Cannot cancel this booking."}, status=status.HTTP_400_BAD_REQUEST)
        booking.status = "canceled"
        booking.save()
        return Response(BookingSerializer(booking).data)
