from django.utils import timezone


def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def is_book_purchased_by_user(book, user):
    if user.is_authenticated:
        return user.library.purchased_books.filter(id=book.id).exists()
    return False



