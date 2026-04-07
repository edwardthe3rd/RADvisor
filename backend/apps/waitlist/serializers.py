from rest_framework import serializers


class WaitlistSignupSerializer(serializers.Serializer):
    email = serializers.EmailField()
    full_name = serializers.CharField(max_length=200, trim_whitespace=True)

    def validate_full_name(self, value):
        if not (value or "").strip():
            raise serializers.ValidationError("This field may not be blank.")
        return value.strip()
