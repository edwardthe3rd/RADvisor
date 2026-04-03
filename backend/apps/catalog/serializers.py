from rest_framework import serializers
from .models import Category, GearItem, GearPhoto, Wishlist, WishlistItem


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "slug", "group", "icon")


class GearPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = GearPhoto
        fields = ("id", "image", "sort_order")
        read_only_fields = ("id",)


class GearItemListSerializer(serializers.ModelSerializer):
    photos = GearPhotoSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True, default="")
    category_group = serializers.CharField(source="category.group", read_only=True, default="")
    owner_name = serializers.CharField(source="owner.profile.display_name", read_only=True, default="")
    is_wishlisted = serializers.SerializerMethodField()

    class Meta:
        model = GearItem
        fields = (
            "id", "title", "description", "category", "category_name", "category_group",
            "brand", "condition", "daily_rate", "deposit_amount",
            "city", "state", "image_url", "is_active", "owner", "owner_name",
            "photos", "is_wishlisted", "created_at",
        )
        read_only_fields = ("id", "owner", "created_at")

    def get_is_wishlisted(self, obj) -> bool:
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return WishlistItem.objects.filter(
            wishlist__user=request.user, gear_item=obj
        ).exists()


class GearItemDetailSerializer(GearItemListSerializer):
    class Meta(GearItemListSerializer.Meta):
        fields = GearItemListSerializer.Meta.fields + (
            "replacement_value", "minimum_rental_days",
            "latitude", "longitude", "updated_at",
        )


class GearItemCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = GearItem
        fields = (
            "id", "title", "description", "category", "brand", "condition",
            "daily_rate", "deposit_amount", "replacement_value",
            "minimum_rental_days", "city", "state", "latitude", "longitude",
        )
        read_only_fields = ("id",)

    def create(self, validated_data):
        validated_data["owner"] = self.context["request"].user
        return super().create(validated_data)


class WishlistItemSerializer(serializers.ModelSerializer):
    gear_item_detail = GearItemListSerializer(source="gear_item", read_only=True)

    class Meta:
        model = WishlistItem
        fields = ("id", "gear_item", "guide_service", "gear_item_detail", "created_at")
        read_only_fields = ("id", "created_at")


class WishlistSerializer(serializers.ModelSerializer):
    items = WishlistItemSerializer(many=True, read_only=True)
    item_count = serializers.IntegerField(source="items.count", read_only=True)
    cover_image = serializers.SerializerMethodField()

    class Meta:
        model = Wishlist
        fields = ("id", "name", "items", "item_count", "cover_image", "created_at")
        read_only_fields = ("id", "created_at")

    def get_cover_image(self, obj) -> str:
        first_item = obj.items.filter(gear_item__isnull=False).first()
        if first_item and first_item.gear_item:
            photo = first_item.gear_item.photos.first()
            if photo:
                return photo.image.url
        return ""

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class AIDescribeRequestSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=200)
    category = serializers.CharField(max_length=80, required=False, default="")
    condition = serializers.CharField(max_length=20, required=False, default="")
    brand = serializers.CharField(max_length=100, required=False, default="")


class AIDescribeResponseSerializer(serializers.Serializer):
    description = serializers.CharField()
    suggested_daily_rate = serializers.DecimalField(max_digits=8, decimal_places=2)
