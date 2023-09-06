from django.db import models
from django.contrib.auth.models import User


class Discussion(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)


class Comment(models.Model):
    content = models.TextField()
    discussion = models.ForeignKey(Discussion, related_name='comments', on_delete=models.CASCADE)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='forum_comments')
    created_at = models.DateTimeField(auto_now_add=True)
