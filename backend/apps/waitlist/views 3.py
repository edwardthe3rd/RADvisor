from rest_framework import generics, permissions, status
from rest_framework.response import Response

from .models import WaitlistEmail
from .serializers import WaitlistSignupSerializer


class WaitlistSignupView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = WaitlistSignupSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].strip().lower()
        WaitlistEmail.objects.get_or_create(email=email)
        return Response(
            {"detail": "Thanks — we will notify you when RADvisor is live."},
            status=status.HTTP_201_CREATED,
        )
