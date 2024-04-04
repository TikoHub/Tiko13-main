# users/notification_utils.py
from django.apps import apps
from django.contrib.auth.models import User  # Make sure to import User

def send_book_update_notifications(book):
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

    # Track which users have received a notification
    notified_users = set()

    for user in all_users:
        if user in notified_users:
            continue  # Skip users who have already been notified

        user_settings = user.user_notification_settings

        # Determine the update types based on the user's library
        update_types = []
        for category in categories:
            if user.library in getattr(book, f'{category}_users').all():
                if getattr(user_settings, f'notify_{category}', False):
                    update_types.append(category)

        if update_types:
            # Check for chapter notification threshold for reading updates
            if 'reading' in update_types:
                obj, created = UserBookChapterNotificationModel.objects.get_or_create(user=user, book=book)
                if book.chapter_count() >= user_settings.chapter_notification_threshold and book.chapter_count() > obj.last_notified_chapter_count:
                    obj.last_notified_chapter_count = book.chapter_count()
                    obj.save()
                else:
                    continue

            # Create a notification for the user
            message = f"{book.name}: New update in your {' and '.join(update_types)} list!"
            NotificationModel.objects.create(
                recipient=user.profile,
                sender=book.author.profile,
                notification_type='book_update',
                book=book,
                message=message
            )

            # Mark the user as notified
            notified_users.add(user)






