from rest_framework import viewsets, generics, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from .models import CommunityPost, CommunityComment, CommunityLike
from .serializers import (
    CommunityPostListSerializer,
    CommunityPostDetailSerializer,
    CommunityPostCreateSerializer,
    CommunityCommentSerializer,
)


class CommunityPostViewSet(viewsets.ModelViewSet):
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "body"]
    ordering_fields = ["created_at", "like_count"]
    filterset_fields = ["post_type", "category"]

    def get_queryset(self):
        return CommunityPost.objects.select_related(
            "author__profile", "category"
        ).prefetch_related("comments")

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return CommunityPostCreateSerializer
        if self.action == "retrieve":
            return CommunityPostDetailSerializer
        return CommunityPostListSerializer

    def get_permissions(self):
        if self.action in ("create",):
            return [permissions.IsAuthenticated()]
        if self.action in ("update", "partial_update", "destroy"):
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def perform_update(self, serializer):
        if serializer.instance.author != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only edit your own posts.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.author != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only delete your own posts.")
        instance.delete()

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def like(self, request, pk=None):
        post = self.get_object()
        like, created = CommunityLike.objects.get_or_create(post=post, user=request.user)
        if created:
            post.like_count += 1
            post.save(update_fields=["like_count"])
            return Response({"status": "liked", "like_count": post.like_count}, status=status.HTTP_201_CREATED)
        like.delete()
        post.like_count = max(0, post.like_count - 1)
        post.save(update_fields=["like_count"])
        return Response({"status": "unliked", "like_count": post.like_count})


class CommunityCommentListCreateView(generics.ListCreateAPIView):
    serializer_class = CommunityCommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return CommunityComment.objects.filter(
            post_id=self.kwargs["post_pk"]
        ).select_related("author__profile")

    def perform_create(self, serializer):
        serializer.save(
            author=self.request.user,
            post_id=self.kwargs["post_pk"],
        )
