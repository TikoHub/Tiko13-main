from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from store.models import CommentLike, CommentDislike, Review, Comment, Book
from users.models import Notification, NotificationSetting
from django.contrib.auth.models import User


@receiver(post_save, sender=CommentLike)
@receiver(post_save, sender=CommentDislike)
@receiver(post_delete, sender=CommentLike)
@receiver(post_delete, sender=CommentDislike)
def update_comment_rating(sender, instance, **kwargs):
    instance.comment.update_rating()


@receiver(post_save, sender=Review)
def send_review_notification(sender, instance, created, **kwargs):
    if created:
        book_author = instance.book.author
        author_settings = NotificationSetting.objects.get(user=book_author)

        # Send notification based on the author's settings
        # and make sure the sender is not the recipient
        if author_settings.show_review_updates and instance.author.profile != book_author.profile:
            Notification.objects.create(
                recipient=book_author.profile,
                sender=instance.author.profile,
                notification_type='review_update',
                book=instance.book
            )


@receiver(post_save, sender=Comment)
def send_comment_notification(sender, instance, created, **kwargs):
    if created:
        book_author = instance.book.author
        author_settings = NotificationSetting.objects.get(user=book_author)

        # Check if the comment is a reply
        if instance.parent_comment:
            notification_type = 'comment reply'
            recipient = instance.parent_comment.user.profile
        else:
            notification_type = 'new comment'
            recipient = book_author.profile

        # Send notification based on the author's settings
        if author_settings.show_comment_updates and instance.user.profile != recipient:
            Notification.objects.create(
                recipient=recipient,
                sender=instance.user.profile,
                notification_type=notification_type,
                book=instance.book
            )


@receiver(post_save, sender=Book)
def book_update_notification(sender, instance, **kwargs):
    instance.notify_users()


