from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register("guides", views.GuideProfileViewSet, basename="guide-profile")
router.register("guide-services", views.GuideServiceViewSet, basename="guide-service")
router.register("guide-bookings", views.GuideBookingViewSet, basename="guide-booking")

urlpatterns = [
    path("", include(router.urls)),
    path("guide-services/<int:service_pk>/photos/", views.GuideServicePhotoUploadView.as_view(), name="guide-service-photo-upload"),
    path("guide-services/<int:service_pk>/availability/", views.GuideAvailabilityViewSet.as_view({"get": "list", "post": "create"}), name="guide-availability-list"),
]
