from rest_framework import serializers


class WaitlistSignupSerializer(serializers.Serializer):
    email = serializers.EmailField()
    full_name = serializers.CharField(
        max_length=200,
        trim_whitespace=True,
        required=False,
        allow_blank=True,
        default="",
    )
