from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register("community", views.CommunityPostViewSet, basename="community-post")

urlpatterns = [
    path("", include(router.urls)),
    path("community/<int:post_pk>/comments/", views.CommunityCommentListCreateView.as_view(), name="community-comments"),
]
