from django.utils import timezone
from django.contrib.auth.hashers import check_password
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from .models import Member, ChatMessage
from .serializers import (
    MessageSerializer,
    MemberSerializer,
    MemberRegisterSerializer,
    MemberLoginSerializer,
    ChatMessageSerializer,
)


def get_session_member(request):
    member_id = request.session.get("member_id")
    if not member_id:
        return None
    try:
        return Member.objects.get(id=member_id)
    except Member.DoesNotExist:
        return None


class HelloView(APIView):
    """
    A simple API endpoint that returns a greeting message.
    """

    @extend_schema(
        responses={200: MessageSerializer}, description="Get a hello world message"
    )
    def get(self, request):
        data = {"message": "Hello!", "timestamp": timezone.now()}
        serializer = MessageSerializer(data)
        return Response(serializer.data)


class RegisterView(APIView):
    def post(self, request):
        serializer = MemberRegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        member = serializer.save()
        request.session["member_id"] = member.id
        member_serializer = MemberSerializer(member)
        return Response(member_serializer.data, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    def post(self, request):
        serializer = MemberLoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        username = serializer.validated_data.get("username")
        password = serializer.validated_data.get("password")
        try:
            member = Member.objects.get(username=username)
        except Member.DoesNotExist:
            return Response(
                {"detail": "Invalid username or password."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not check_password(password, member.password):
            return Response(
                {"detail": "Invalid username or password."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        request.session["member_id"] = member.id
        member_serializer = MemberSerializer(member)
        return Response(member_serializer.data, status=status.HTTP_200_OK)


class MeView(APIView):
    def get(self, request):
        member = get_session_member(request)
        if not member:
            return Response(
                {"detail": "Authentication credentials were not provided."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        serializer = MemberSerializer(member)
        return Response(serializer.data, status=status.HTTP_200_OK)


class LogoutView(APIView):
    def post(self, request):
        member = get_session_member(request)
        if not member:
            return Response(
                {"detail": "Authentication credentials were not provided."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        if "member_id" in request.session:
            del request.session["member_id"]
        return Response(status=status.HTTP_204_NO_CONTENT)


class ChatMessagesView(APIView):
    def get(self, request):
        member = get_session_member(request)
        if not member:
            return Response(
                {"detail": "Authentication credentials were not provided."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        messages = ChatMessage.objects.select_related("member").order_by("created_at")
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        member = get_session_member(request)
        if not member:
            return Response(
                {"detail": "Authentication credentials were not provided."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        text = request.data.get("text", "")
        if not isinstance(text, str):
            return Response(
                {"text": ["This field must be a string."]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        stripped_text = text.strip()
        if not stripped_text:
            return Response(
                {"text": ["This field may not be blank."]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(stripped_text) > 1000:
            return Response(
                {"text": ["Ensure this field has no more than 1000 characters."]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        message = ChatMessage.objects.create(member=member, text=stripped_text)
        serializer = ChatMessageSerializer(message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
