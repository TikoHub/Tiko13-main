from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Profile, Wallet, UsersNotificationSettings, Notification
from django.contrib.auth.models import User


@receiver(post_save, sender=Profile)
def create_user_wallet(sender, instance, created, **kwargs):
    if created:
        Wallet.objects.create(profile=instance)


@receiver(post_save, sender=User)
def create_user_notification_settings(sender, instance, created, **kwargs):
    if created:
        UsersNotificationSettings.objects.create(user=instance)

        Notification.objects.create(
            recipient=instance.profile,
            sender=instance.profile,  # Sender can be the same as the recipient for a system-generated message
            notification_type='welcome',
            message='Welcome to our platform!'  # Customize this message as needed
        )
