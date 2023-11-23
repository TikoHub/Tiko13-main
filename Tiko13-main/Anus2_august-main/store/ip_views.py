from django.utils import timezone
from .models import BookView, ReviewView


def check_book_ip_last_viewed(ip_address, book_instance):
    try:
        book_view = BookView.objects.filter(book=book_instance, ip_address=ip_address).latest('last_viewed')
        return book_view.last_viewed
    except BookView.DoesNotExist:
        return None


def update_book_ip_last_viewed(ip_address, book_instance):
    BookView.objects.update_or_create(
        book=book_instance,
        ip_address=ip_address,
        defaults={'last_viewed': timezone.now()}
    )


def check_review_ip_last_viewed(ip_address, review_instance):
    try:
        review_view = ReviewView.objects.filter(review=review_instance, ip_address=ip_address).latest('timestamp')
        return review_view.timestamp
    except ReviewView.DoesNotExist:
        return None


def update_review_ip_last_viewed(ip_address, review_instance):
    ReviewView.objects.update_or_create(
        review=review_instance,
        ip_address=ip_address,
        defaults={'timestamp': timezone.now()}
    )
