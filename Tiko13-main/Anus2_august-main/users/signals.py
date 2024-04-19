from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Profile, Wallet, UsersNotificationSettings, Notification, Library, WebPageSettings, \
    TemporaryRegistration
from django.contrib.auth.models import User
from datetime import date
from allauth.socialaccount.models import SocialAccount
from django.utils import timezone


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
        if not SocialAccount.objects.filter(user=instance).exists():
            try:
                temp_reg = TemporaryRegistration.objects.get(email=instance.email)
                dob = date(year=temp_reg.dob_year, month=temp_reg.dob_month, day=1)
                temp_reg.delete()  # Clean up temporary data
            except TemporaryRegistration.DoesNotExist:
                dob = None  # Fallback if no temp registration found
        else:
            dob = None  # For social accounts, may need additional handling to set DOB

        # Ensure WebPageSettings object is created with the correct DOB
        WebPageSettings.objects.update_or_create(
            profile=profile,
            defaults={'date_of_birth': dob}
        )


