from django.db import models
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Booking, ReservationRequest
from .serializers import BookingSerializer, ReservationRequestSerializer


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


class ReservationRequestViewSet(viewsets.ModelViewSet):
    """Consumer reservation requests against directory businesses.

    Reservation-first: creating a request stores a lead on the user's account.
    No owner-approval workflow and no payment (Stripe deferred).
    """

    serializer_class = ReservationRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_queryset(self):
        return ReservationRequest.objects.filter(
            user=self.request.user
        ).select_related("business", "equipment")

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        reservation = self.get_object()
        if reservation.status in ("closed", "canceled"):
            return Response(
                {"error": "Cannot cancel this reservation."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        reservation.status = "canceled"
        reservation.save()
        return Response(ReservationRequestSerializer(reservation).data)
