from django.db import models
from rest_framework import viewsets, generics, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import GuideProfile, GuideService, GuideServicePhoto, GuideAvailability, GuideBooking
from .serializers import (
    GuideProfileSerializer,
    GuideServiceListSerializer,
    GuideServiceDetailSerializer,
    GuideServiceCreateSerializer,
    GuideServicePhotoSerializer,
    GuideAvailabilitySerializer,
    GuideBookingSerializer,
)


class GuideProfileViewSet(viewsets.ModelViewSet):
    serializer_class = GuideProfileSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return GuideProfile.objects.filter(is_active=True).select_related("user__profile")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        try:
            profile = GuideProfile.objects.get(user=request.user)
            return Response(GuideProfileSerializer(profile).data)
        except GuideProfile.DoesNotExist:
            return Response({"detail": "No guide profile found."}, status=status.HTTP_404_NOT_FOUND)


class GuideServiceViewSet(viewsets.ModelViewSet):
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "description", "location_name"]
    ordering_fields = ["price_per_person", "created_at"]
    filterset_fields = ["city", "state", "difficulty_level"]

    def get_queryset(self):
        qs = GuideService.objects.select_related(
            "guide__profile", "activity_type"
        ).prefetch_related("photos", "availability_slots")
        if self.action == "list":
            return qs.filter(is_active=True)
        return qs

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return GuideServiceCreateSerializer
        if self.action == "retrieve":
            return GuideServiceDetailSerializer
        return GuideServiceListSerializer

    def get_permissions(self):
        if self.action in ("create",):
            return [permissions.IsAuthenticated()]
        if self.action in ("update", "partial_update", "destroy"):
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def perform_update(self, serializer):
        if serializer.instance.guide != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only edit your own services.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.guide != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only delete your own services.")
        instance.is_active = False
        instance.save()

    @action(detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def mine(self, request):
        qs = GuideService.objects.filter(guide=request.user).prefetch_related("photos", "availability_slots")
        serializer = GuideServiceListSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data)


class GuideServicePhotoUploadView(generics.CreateAPIView):
    serializer_class = GuideServicePhotoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        service = GuideService.objects.get(pk=self.kwargs["service_pk"])
        if service.guide != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only upload photos to your own services.")
        serializer.save(service=service)


class GuideAvailabilityViewSet(viewsets.ModelViewSet):
    serializer_class = GuideAvailabilitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return GuideAvailability.objects.filter(
            service_id=self.kwargs.get("service_pk")
        )


class GuideBookingViewSet(viewsets.ModelViewSet):
    serializer_class = GuideBookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return GuideBooking.objects.filter(
            models.Q(guest=user) | models.Q(guide=user)
        ).select_related("service", "guest__profile", "guide__profile")

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        booking = self.get_object()
        if booking.guide != request.user:
            return Response({"error": "Only the guide can approve."}, status=status.HTTP_403_FORBIDDEN)
        if booking.status != "pending":
            return Response({"error": "Only pending bookings can be approved."}, status=status.HTTP_400_BAD_REQUEST)
        booking.status = "approved"
        booking.save()
        return Response(GuideBookingSerializer(booking).data)

    @action(detail=True, methods=["post"])
    def decline(self, request, pk=None):
        booking = self.get_object()
        if booking.guide != request.user:
            return Response({"error": "Only the guide can decline."}, status=status.HTTP_403_FORBIDDEN)
        if booking.status != "pending":
            return Response({"error": "Only pending bookings can be declined."}, status=status.HTTP_400_BAD_REQUEST)
        booking.status = "declined"
        booking.save()
        return Response(GuideBookingSerializer(booking).data)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        booking = self.get_object()
        if booking.guest != request.user and booking.guide != request.user:
            return Response({"error": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
        if booking.status in ("completed", "canceled", "declined"):
            return Response({"error": "Cannot cancel this booking."}, status=status.HTTP_400_BAD_REQUEST)
        booking.status = "canceled"
        booking.save()
        return Response(GuideBookingSerializer(booking).data)
