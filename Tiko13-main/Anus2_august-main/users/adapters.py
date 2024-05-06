from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from .utils import generate_unique_username


class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    def save_user(self, request, sociallogin, form=None):
        user = super().save_user(request, sociallogin, form)
        # Assuming email is used as the base for social logins
        if not user.username.isdigit():  # Check if the username is only digits or already set
            base_username = user.email
            user.username = generate_unique_username(base_username, is_social=True)
            user.save()
        return user
