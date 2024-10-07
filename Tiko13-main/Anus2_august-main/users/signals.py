from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Profile, Wallet, UsersNotificationSettings, Notification, Library, WebPageSettings
from django.contrib.auth.models import User
from datetime import date
from allauth.socialaccount.models import SocialAccount
from django.utils import timezone
from allauth.socialaccount.signals import social_account_added
from .utils import generate_unique_username


@receiver(post_save, sender=User)
def create_user_profile_and_other_settings(sender, instance, created, **kwargs):
    if created:
        # Create the Profile object
        profile, _ = Profile.objects.get_or_create(user=instance)

        # Create other related objects
        Wallet.objects.create(profile=profile)
        UsersNotificationSettings.objects.create(user=instance)
        Library.objects.get_or_create(user=instance)
        Notification.objects.create(
            recipient=profile,
            sender=profile,
            notification_type='welcome',
            message='Welcome to our platform!'
        )

        # Now handle the date of birth


        # Ensure WebPageSettings object is created with the correct DOB
        WebPageSettings.objects.update_or_create(
            profile=profile,
        )


@receiver(social_account_added)
def create_social_username(request, sociallogin, **kwargs):
    # Assuming 'first_name' is fetched from the social account
    first_name = sociallogin.account.extra_data.get('first_name', 'user')
    last_name = sociallogin.account.extra_data.get('last_name', '')

    base_username = f"{first_name}{last_name}".strip().lower()
    if not base_username:
        base_username = sociallogin.account.extra_data.get('email').split('@')[0]

    unique_username = generate_unique_username(base_username, is_social=True)

    # Create or update the user model
    user = sociallogin.user
    user.username = unique_username
    user.save()

    # You might want to handle other profile settings or signals here
