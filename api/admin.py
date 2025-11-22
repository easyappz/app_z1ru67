from django.contrib import admin

from .models import Member, ChatMessage


@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    list_display = ("id", "username", "created_at")
    search_fields = ("username",)
    ordering = ("-created_at",)


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ("id", "member", "created_at")
    list_filter = ("created_at",)
    ordering = ("-created_at",)
