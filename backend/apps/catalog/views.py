from rest_framework import viewsets, generics, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.conf import settings
from django.db.models import Q

from .models import Business, Category, Equipment, GearItem, GearPhoto, Wishlist, WishlistItem
from .serializers import (
    BusinessSerializer,
    CategorySerializer,
    EquipmentSerializer,
    GearItemListSerializer,
    GearItemDetailSerializer,
    GearItemCreateSerializer,
    GearPhotoSerializer,
    WishlistSerializer,
    WishlistItemSerializer,
    AIDescribeRequestSerializer,
    AIDescribeResponseSerializer,
)
from .filters import BusinessFilter, EquipmentFilter, GearItemFilter


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class BusinessViewSet(viewsets.ReadOnlyModelViewSet):
    """Public, read-only directory of outdoor-rental businesses (Phase 1)."""

    serializer_class = BusinessSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = BusinessFilter
    search_fields = ["name", "city", "address"]
    ordering_fields = ["google_rating", "google_rating_count", "name"]
    ordering = ["-google_rating", "name"]
    lookup_field = "slug"

    def get_queryset(self):
        return (
            Business.objects.filter(is_active=True)
            .prefetch_related("categories")
            .distinct()
        )


class EquipmentViewSet(viewsets.ReadOnlyModelViewSet):
    """Public, read-only catalog of curated equipment (Phase 2)."""

    serializer_class = EquipmentSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = EquipmentFilter
    search_fields = ["name", "brand", "business__name"]
    ordering_fields = ["price", "name"]
    ordering = ["category__group", "name"]

    def get_queryset(self):
        return (
            Equipment.objects.filter(is_available=True, business__is_active=True)
            .select_related("business", "category")
        )


class RecommendView(APIView):
    """Walkthrough recommender (Phase 3 seed).

    POST body (all optional):
      activity     -> category slug or group keyword
      max_price    -> upper bound on equipment price
      max_price_level -> coarse business budget cap (0-4)

    Returns matching equipment ranked by business rating, plus the businesses
    that offer them. Skill level / duration are accepted but only used as soft
    hints until per-item data is richer.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        activity = (request.data.get("activity") or "").strip().lower()
        max_price = request.data.get("max_price")
        max_price_level = request.data.get("max_price_level")

        equipment = (
            Equipment.objects.filter(is_available=True, business__is_active=True)
            .select_related("business", "category")
        )

        if activity:
            equipment = equipment.filter(
                Q(category__slug=activity)
                | Q(category__group__iexact=activity)
                | Q(category__name__icontains=activity)
            )
        if max_price not in (None, ""):
            try:
                equipment = equipment.filter(price__lte=float(max_price))
            except (TypeError, ValueError):
                pass
        if max_price_level not in (None, ""):
            try:
                equipment = equipment.filter(business__price_level__lte=int(max_price_level))
            except (TypeError, ValueError):
                pass

        equipment = equipment.order_by("-business__google_rating", "price")[:50]
        eq_data = EquipmentSerializer(equipment, many=True).data

        business_ids = list({e["business"]["id"] for e in eq_data if e.get("business")})
        businesses = (
            Business.objects.filter(id__in=business_ids)
            .prefetch_related("categories")
            .order_by("-google_rating")
        )

        return Response(
            {
                "count": len(eq_data),
                "equipment": eq_data,
                "businesses": BusinessSerializer(businesses, many=True).data,
            }
        )


class GearItemViewSet(viewsets.ModelViewSet):
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = GearItemFilter
    search_fields = ["title", "description", "brand"]
    ordering_fields = ["daily_rate", "created_at"]

    def get_queryset(self):
        qs = GearItem.objects.select_related("owner__profile", "category").prefetch_related("photos")
        if self.action == "list":
            return qs.filter(is_active=True)
        return qs

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return GearItemCreateSerializer
        if self.action == "retrieve":
            return GearItemDetailSerializer
        return GearItemListSerializer

    def get_permissions(self):
        if self.action in ("create",):
            return [permissions.IsAuthenticated()]
        if self.action in ("update", "partial_update", "destroy"):
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def perform_update(self, serializer):
        if serializer.instance.owner != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only edit your own listings.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.owner != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only delete your own listings.")
        instance.is_active = False
        instance.save()

    @action(detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def mine(self, request):
        qs = GearItem.objects.filter(owner=request.user).prefetch_related("photos")
        serializer = GearItemListSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data)


class GearPhotoUploadView(generics.CreateAPIView):
    serializer_class = GearPhotoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        gear_item = GearItem.objects.get(pk=self.kwargs["gear_item_pk"])
        if gear_item.owner != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only upload photos to your own listings.")
        serializer.save(gear_item=gear_item)


class WishlistViewSet(viewsets.ModelViewSet):
    serializer_class = WishlistSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Wishlist.objects.filter(user=self.request.user).prefetch_related(
            "items__gear_item__photos", "items__guide_service"
        )


class WishlistToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        gear_item_id = request.data.get("gear_item_id")
        guide_service_id = request.data.get("guide_service_id")

        wishlist, _ = Wishlist.objects.get_or_create(
            user=request.user, defaults={"name": "Saved"}
        )

        if gear_item_id:
            existing = WishlistItem.objects.filter(wishlist=wishlist, gear_item_id=gear_item_id)
            if existing.exists():
                existing.delete()
                return Response({"status": "removed"})
            WishlistItem.objects.create(wishlist=wishlist, gear_item_id=gear_item_id)
            return Response({"status": "added"}, status=status.HTTP_201_CREATED)

        if guide_service_id:
            existing = WishlistItem.objects.filter(wishlist=wishlist, guide_service_id=guide_service_id)
            if existing.exists():
                existing.delete()
                return Response({"status": "removed"})
            WishlistItem.objects.create(wishlist=wishlist, guide_service_id=guide_service_id)
            return Response({"status": "added"}, status=status.HTTP_201_CREATED)

        return Response({"error": "Provide gear_item_id or guide_service_id"}, status=status.HTTP_400_BAD_REQUEST)


class AIDescribeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = AIDescribeRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        description, rate = self._generate(data)
        return Response(AIDescribeResponseSerializer({
            "description": description,
            "suggested_daily_rate": rate,
        }).data)

    def _generate(self, data):
        if settings.OPENAI_API_KEY:
            return self._ai_generate(data)
        return self._template_generate(data)

    def _ai_generate(self, data):
        try:
            import openai
            client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
            prompt = (
                f"Write a compelling 2-3 sentence rental listing description for outdoor gear.\n"
                f"Title: {data['title']}\n"
                f"Category: {data.get('category', 'outdoor gear')}\n"
                f"Condition: {data.get('condition', 'good')}\n"
                f"Brand: {data.get('brand', 'N/A')}\n\n"
                f"Also suggest a reasonable daily rental rate in USD. "
                f"Respond in JSON: {{\"description\": \"...\", \"suggested_daily_rate\": number}}"
            )
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You help write outdoor gear rental listings. Respond only in valid JSON."},
                    {"role": "user", "content": prompt},
                ],
                max_tokens=300,
                temperature=0.7,
            )
            import json
            result = json.loads(response.choices[0].message.content)
            return result["description"], result["suggested_daily_rate"]
        except Exception:
            return self._template_generate(data)

    def _template_generate(self, data):
        title = data["title"]
        condition = data.get("condition", "good")
        brand = data.get("brand", "")
        category = data.get("category", "outdoor gear")

        brand_str = f" by {brand}" if brand else ""
        desc = (
            f"Rent this {condition.replace('_', ' ')} {title}{brand_str} for your next adventure! "
            f"Perfect for {category} enthusiasts. Well-maintained and ready to go. "
            f"Pick up locally and hit the trails."
        )

        rate_map = {
            "tents": 25, "sleeping-bags": 15, "backpacks": 20, "skis": 40,
            "snowboards": 40, "paddleboards": 35, "kayaks": 45, "bikes": 30,
            "surfboards": 30, "wetsuits": 20,
        }
        rate = rate_map.get(category, 25)
        return desc, rate
