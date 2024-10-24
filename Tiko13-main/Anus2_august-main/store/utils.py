from django.utils import timezone
from .models import AnonymousBookAccess


def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        # X-Forwarded-For может содержать несколько IP-адресов
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def is_book_purchased_by_user(book, user):
    if user.is_authenticated:
        return user.library.purchased_books.filter(id=book.id).exists()
    return False


def log_book_access(user, book, request):
    AnonymousBookAccess.objects.create(
        user_id=user.id if user.is_authenticated else None,
        book=book,
        ip_address=request.META.get('REMOTE_ADDR')
    )

