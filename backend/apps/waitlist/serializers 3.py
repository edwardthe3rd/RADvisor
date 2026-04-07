from rest_framework import serializers


class WaitlistSignupSerializer(serializers.Serializer):
    email = serializers.EmailField()
