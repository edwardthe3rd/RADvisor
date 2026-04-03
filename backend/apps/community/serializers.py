from rest_framework import serializers
from .models import CommunityPost, CommunityComment, CommunityLike


class CommunityCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.profile.display_name", read_only=True, default="")
    author_photo = serializers.ImageField(source="author.profile.profile_photo", read_only=True)

    class Meta:
        model = CommunityComment
        fields = ("id", "post", "author", "author_name", "author_photo", "body", "created_at")
        read_only_fields = ("id", "author", "created_at")

    def create(self, validated_data):
        validated_data["author"] = self.context["request"].user
        return super().create(validated_data)


class CommunityPostListSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.profile.display_name", read_only=True, default="")
    author_display_name = serializers.CharField(source="author.profile.display_name", read_only=True, default="")
    author_username = serializers.CharField(source="author.username", read_only=True, default="")
    author_photo = serializers.ImageField(source="author.profile.profile_photo", read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True, default="")
    comment_count = serializers.IntegerField(source="comments.count", read_only=True)
    is_liked = serializers.SerializerMethodField()
    liked = serializers.SerializerMethodField()

    class Meta:
        model = CommunityPost
        fields = (
            "id", "author", "author_name", "author_display_name", "author_username",
            "author_photo", "title", "body",
            "post_type", "category", "category_name", "location_name",
            "image", "like_count", "comment_count", "is_liked", "liked", "created_at",
        )
        read_only_fields = ("id", "author", "like_count", "created_at")

    def get_is_liked(self, obj) -> bool:
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return CommunityLike.objects.filter(post=obj, user=request.user).exists()

    def get_liked(self, obj) -> bool:
        return self.get_is_liked(obj)


class CommunityPostDetailSerializer(CommunityPostListSerializer):
    comments = CommunityCommentSerializer(many=True, read_only=True)

    class Meta(CommunityPostListSerializer.Meta):
        fields = CommunityPostListSerializer.Meta.fields + ("comments", "updated_at")


class CommunityPostCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommunityPost
        fields = ("id", "title", "body", "post_type", "category", "location_name", "image")
        read_only_fields = ("id",)

    def create(self, validated_data):
        validated_data["author"] = self.context["request"].user
        return super().create(validated_data)
