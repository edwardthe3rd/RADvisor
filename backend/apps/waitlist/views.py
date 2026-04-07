import json
import logging

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from django.conf import settings
from django.core.mail import send_mail
from rest_framework import generics, permissions, status
from rest_framework.response import Response

from .models import WaitlistEmail
from .serializers import WaitlistSignupSerializer

logger = logging.getLogger(__name__)


def _notify_owner_new_waitlist_signup(full_name: str, signup_email: str) -> None:
    to = getattr(settings, "WAITLIST_NOTIFY_EMAIL", "") or ""
    to = to.strip()
    if not to:
        return
    subject = f"RADvisor waitlist: {signup_email}"
    body = (
        "Someone signed up for the RADvisor launch waitlist.\n\n"
        f"Full name: {full_name}\n"
        f"Email: {signup_email}\n"
    )
    try:
        send_mail(
            subject=subject,
            message=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[to],
            fail_silently=False,
        )
    except Exception:
        logger.exception("Waitlist notification email failed for %s", signup_email)


def _notify_owner_via_lambda(full_name: str, signup_email: str) -> None:
    arn = getattr(settings, "WAITLIST_NOTIFY_LAMBDA_ARN", "") or ""
    if not arn:
        return
    payload = json.dumps(
        {"fullName": full_name, "email": signup_email},
        ensure_ascii=False,
    )
    try:
        client = boto3.client("lambda")
        client.invoke(
            FunctionName=arn,
            InvocationType="Event",
            Payload=payload.encode("utf-8"),
        )
    except (BotoCoreError, ClientError):
        logger.exception("Waitlist Lambda invoke failed for %s", signup_email)


def _notify_owner(full_name: str, signup_email: str) -> None:
    if getattr(settings, "WAITLIST_NOTIFY_LAMBDA_ARN", ""):
        _notify_owner_via_lambda(full_name, signup_email)
    else:
        _notify_owner_new_waitlist_signup(full_name, signup_email)


class WaitlistSignupView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = WaitlistSignupSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].strip().lower()
        full_name = serializer.validated_data["full_name"]
        _created = WaitlistEmail.objects.get_or_create(
            email=email,
            defaults={"full_name": full_name},
        )[1]
        if _created:
            _notify_owner(full_name, email)
        return Response(
            {"detail": "Thanks — we will notify you when RADvisor is live."},
            status=status.HTTP_201_CREATED,
        )
