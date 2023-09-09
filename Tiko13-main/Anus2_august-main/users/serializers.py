from djoser.serializers import UserCreateSerializer, User
from rest_framework import serializers
from .models import Profile  # Import your Profile model

class CustomUserCreateSerializer(UserCreateSerializer):
    class Meta(UserCreateSerializer.Meta):
        model = User  # Replace 'User' with your user model
        fields = ('id', 'username', 'email', 'password', 'first_name', 'last_name')

    def create(self, validated_data):
        user = super().create(validated_data)

        # Customize user creation logic here, e.g., create a profile
        profile = Profile(user=user)
        profile.save()

        return user
