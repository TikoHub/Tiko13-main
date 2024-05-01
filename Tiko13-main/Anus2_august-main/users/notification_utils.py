# users/notification_utils.py
from django.apps import apps
from django.contrib.auth.models import User  # Make sure to import User


def send_book_update_notifications(book, chapter_title):
    NotificationModel = apps.get_model('users', 'Notification')
    UserBookChapterNotificationModel = apps.get_model('users', 'UserBookChapterNotification')

    all_users = set()
    categories = ['reading', 'liked', 'wishlist', 'favorites']
    for category in categories:
        users_in_category = getattr(book, f'{category}_users').all().values_list('user', flat=True)
        all_users.update(users_in_category)

    all_users = User.objects.filter(id__in=all_users)

    for user in all_users:
        user_settings = user.user_notification_settings
        should_notify = False
        for category in categories:
            if user.library in getattr(book, f'{category}_users').all():
                if getattr(user_settings, f'notify_{category}', False):
                    should_notify = True
                    break

        if should_notify:
            obj, created = UserBookChapterNotificationModel.objects.get_or_create(user=user, book=book)
            current_chapter_count = book.chapter_count()
            chapters_since_last_notified = current_chapter_count - obj.chapter_count_at_last_notification

            print(f"User: {user.username}, Chapters since last notified: {chapters_since_last_notified}, Threshold: {user_settings.chapter_notification_threshold}")

            if chapters_since_last_notified >= user_settings.chapter_notification_threshold:
                obj.last_notified_chapter_count = current_chapter_count
                obj.chapter_count_at_last_notification = current_chapter_count
                obj.save()
                print(f"Updating notification counts for user {user.username}. New count: {current_chapter_count}")

                NotificationModel.objects.create(
                    recipient=user.profile,
                    sender=book.author.profile,
                    notification_type='book_update',
                    book=book,
                    book_name=book.name,
                    chapter_title=chapter_title
                )
                print(f"Notification sent for user {user.username} for chapter {chapter_title}")
