from django.urls import path

from .views import (
    HelloView,
    RegisterView,
    LoginView,
    MeView,
    LogoutView,
    ChatMessagesView,
)

urlpatterns = [
    path("hello/", HelloView.as_view(), name="hello"),
    path("auth/register/", RegisterView.as_view(), name="auth-register"),
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/me/", MeView.as_view(), name="auth-me"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("chat/messages/", ChatMessagesView.as_view(), name="chat-messages"),
]
