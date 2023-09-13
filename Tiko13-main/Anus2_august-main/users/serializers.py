from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile, WebPageSettings, Library


class CustomUserCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password')

    def create(self, validated_data):
        # Create the user instance
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )

        # Create a profile for the user
        profile, created = Profile.objects.get_or_create(user=user)

        # Create a WebPage_Settings object for the user
        webpage_settings, created = WebPageSettings.objects.get_or_create(profile=profile)

        # Create an empty library for the user
        library, created = Library.objects.get_or_create(user=user)

        return user
