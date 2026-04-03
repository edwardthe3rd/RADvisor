from rest_framework import viewsets, generics, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.conf import settings

from .models import Category, GearItem, GearPhoto, Wishlist, WishlistItem
from .serializers import (
    CategorySerializer,
    GearItemListSerializer,
    GearItemDetailSerializer,
    GearItemCreateSerializer,
    GearPhotoSerializer,
    WishlistSerializer,
    WishlistItemSerializer,
    AIDescribeRequestSerializer,
    AIDescribeResponseSerializer,
)
from .filters import GearItemFilter


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


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
