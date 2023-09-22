from rest_framework import serializers
from django.contrib.auth.models import User
from djoser.serializers import UserCreateSerializer
from .models import Profile, WebPageSettings, Library


class CustomUserRegistrationSerializer(UserCreateSerializer):
    password2 = serializers.CharField(write_only=True, required=True)
    date_of_birth_month = serializers.IntegerField(required=False)
    date_of_birth_year = serializers.IntegerField(required=False)

    class Meta:
        model = User
        fields = ('id', 'first_name', 'last_name', 'email', 'password', 'password2', 'date_of_birth_month', 'date_of_birth_year')

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError("Passwords do not match.")
        return data

    def create(self, validated_data):
        # Extract additional fields for user registration
        first_name = validated_data.pop('first_name', None)
        last_name = validated_data.pop('last_name', None)
        date_of_birth_month = validated_data.pop('date_of_birth_month', None)
        date_of_birth_year = validated_data.pop('date_of_birth_year', None)

        # Create the user instance
        email = validated_data['email']
        user = User.objects.create_user(
            username=email.split('@')[0],  # Set username based on email
            email=email,
            password=validated_data['password'],
        )

        # Set optional fields if provided
        if first_name:
            user.first_name = first_name
        if last_name:
            user.last_name = last_name
        user.save()

        # Create a profile for the user
        profile, created = Profile.objects.get_or_create(user=user)

        # Create a WebPage_Settings object for the user
        webpage_settings, created = WebPageSettings.objects.get_or_create(profile=profile)

        # Create an empty library for the user
        library, created = Library.objects.get_or_create(user=user)

        # Set date of birth if provided
        if date_of_birth_month and date_of_birth_year:
            profile.date_of_birth = f"{date_of_birth_month}/{date_of_birth_year}"
            profile.save()

        return user


class CustomUserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(style={'input_type': 'password'})

