# users/notification_utils.py
from django.apps import apps
from django.contrib.auth.models import User  # Make sure to import User


def send_book_update_notifications(book, chapter_title):
    NotificationModel = apps.get_model('users', 'Notification')
    UserBookChapterNotificationModel = apps.get_model('users', 'UserBookChapterNotification')

    # Get all users who have the book in their library categories
    all_users = set()
    categories = ['reading', 'liked', 'wishlist', 'favorites']
    for category in categories:
        users_in_category = getattr(book, f'{category}_users').all().values_list('user', flat=True)
        all_users.update(users_in_category)

    # Convert user IDs to User objects
    all_users = User.objects.filter(id__in=all_users)

    for user in all_users:
        user_settings = user.user_notification_settings

        # Determine if the user should be notified based on their library and settings
        should_notify = False
        for category in categories:
            if user.library in getattr(book, f'{category}_users').all():
                if getattr(user_settings, f'notify_{category}', False):
                    should_notify = True
                    break

        if should_notify:
            # Check if the user has reached their chapter notification threshold
            obj, created = UserBookChapterNotificationModel.objects.get_or_create(user=user, book=book)
            chapters_since_last_notified = book.chapter_count() - obj.last_notified_chapter_count
            if chapters_since_last_notified >= user_settings.chapter_notification_threshold:
                # Update the last notified chapter count and send a notification
                obj.last_notified_chapter_count = book.chapter_count()
                obj.save()
                message = f"{book.name}: {chapter_title}"  # Use the passed chapter title
                NotificationModel.objects.create(
                    recipient=user.profile,
                    sender=book.author.profile,
                    notification_type='book_update',
                    book=book,
                    message=message
                )










