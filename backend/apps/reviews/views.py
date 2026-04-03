from rest_framework import viewsets, permissions
from .models import Review
from .serializers import ReviewSerializer


class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = Review.objects.select_related("reviewer__profile", "reviewee__profile")
        user_id = self.request.query_params.get("user")
        if user_id:
            qs = qs.filter(reviewee_id=user_id)
        listing_id = self.request.query_params.get("listing")
        if listing_id:
            qs = qs.filter(booking__gear_item_id=listing_id)
        return qs
