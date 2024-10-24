import random
from django.contrib.auth import get_user_model
from django.core.files.storage import FileSystemStorage
from django.conf import settings
import os

User = get_user_model()


def generate_unique_username(base, is_social=False):
    base_username = base.split('@')[0] if is_social else base
    base_username = ''.join(e for e in base_username if e.isalnum())

    # Ensure the username is not empty and append numbers
    base_username = base_username or "user"
    while True:
        username = f"{base_username}{random.randint(1000, 9999)}"
        if not User.objects.filter(username=username).exists():
            break

    return username


class TemporaryStorage(FileSystemStorage):
    def __init__(self, location=None, base_url=None):
        location = location or os.path.join(settings.MEDIA_ROOT, 'tmp')
        base_url = base_url or os.path.join(settings.MEDIA_URL, 'tmp/')
        super().__init__(location, base_url)
