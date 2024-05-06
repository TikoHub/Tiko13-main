from django.urls import re_path
from .consumers import CommentConsumer, FollowConsumer

websocket_urlpatterns = [
    re_path(r'ws/comments/(?P<book_id>\d+)/$', CommentConsumer.as_asgi()),
    re_path(r'ws/follow/(?P<user_id>\d+)/$', FollowConsumer.as_asgi()),
]
