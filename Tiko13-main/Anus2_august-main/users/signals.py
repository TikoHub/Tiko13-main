from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Profile, Wallet


@receiver(post_save, sender=Profile)
def create_user_wallet(sender, instance, created, **kwargs):
    if created:
        Wallet.objects.create(profile=instance)
