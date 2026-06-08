from django.urls import path

from . import views

urlpatterns = [
    path("waitlist/", views.WaitlistSignupView.as_view(), name="waitlist_signup"),
]
