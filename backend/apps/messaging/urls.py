from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register("threads", views.ThreadViewSet, basename="thread")

urlpatterns = [
    path("", include(router.urls)),
    path("threads/<int:thread_pk>/messages/", views.ThreadMessagesView.as_view(), name="thread-messages"),
    path("threads/start/", views.StartThreadView.as_view(), name="start-thread"),
]
