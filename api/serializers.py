from django.contrib.auth.hashers import make_password
from rest_framework import serializers

from .models import Member, ChatMessage


class MessageSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=200)
    timestamp = serializers.DateTimeField(read_only=True)


class MemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Member
        fields = ("id", "username", "created_at")


class MemberRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = Member
        fields = ("username", "password")

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        return value

    def create(self, validated_data):
        password = validated_data.get("password")
        validated_data["password"] = make_password(password)
        return super().create(validated_data)


class MemberLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class ChatMessageSerializer(serializers.ModelSerializer):
    member_id = serializers.IntegerField(source="member.id", read_only=True)
    member_username = serializers.CharField(source="member.username", read_only=True)

    class Meta:
        model = ChatMessage
        fields = ("id", "text", "created_at", "member_id", "member_username")
