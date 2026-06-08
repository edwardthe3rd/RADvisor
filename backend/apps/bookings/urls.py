from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register("bookings", views.BookingViewSet, basename="booking")
router.register("reservations", views.ReservationRequestViewSet, basename="reservation")

urlpatterns = [
    path("", include(router.urls)),
]
