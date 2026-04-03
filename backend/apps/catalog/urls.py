from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register("categories", views.CategoryViewSet, basename="category")
router.register("listings", views.GearItemViewSet, basename="listing")
router.register("wishlists", views.WishlistViewSet, basename="wishlist")

urlpatterns = [
    path("", include(router.urls)),
    path("listings/<int:gear_item_pk>/photos/", views.GearPhotoUploadView.as_view(), name="listing-photo-upload"),
    path("wishlist/toggle/", views.WishlistToggleView.as_view(), name="wishlist-toggle"),
    path("listings/ai-describe/", views.AIDescribeView.as_view(), name="ai-describe"),
]
