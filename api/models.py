from django.db import models


class Member(models.Model):
    username = models.CharField(max_length=150, unique=True, db_index=True)
    password = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.username


class ChatMessage(models.Model):
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name="messages")
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    def __str__(self):
        if len(self.text) > 30:
            short_text = self.text[:27] + "..."
        else:
            short_text = self.text
        return f"{self.member.username}: {short_text}"
