from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile, WebPageSettings
from store.models import Book, Genre, Series, Comment
from .helpers import FollowerHelper


class CustomUserRegistrationSerializer(serializers.Serializer):
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=False)
    dob_month = serializers.IntegerField(required=False) # Поменять на тру
    dob_year = serializers.IntegerField(required=False) #Поменять на тру

    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)
    password2 = serializers.CharField(write_only=True, required=True)

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError("Passwords do not match.")
        return data


class CustomUserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(style={'input_type': 'password'})


class UserSerializer(serializers.ModelSerializer):
    at_username = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'at_username', 'first_name', 'last_name']

    def get_at_username(self, obj):
        return f"@{obj.username}"


class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    unread_notification_count = serializers.IntegerField(read_only=True)
    books_count = serializers.SerializerMethodField()
    series_count = serializers.SerializerMethodField()
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = [
            'user',
            'about',
            'profileimg',
            'unread_notification_count',
            'banner_image',
            'books_count',
            'series_count',
            'followers_count',
            'following_count',
        ]
        read_only_fields = ('user',)

    def create(self, validated_data):
        # Custom creation logic if needed
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Custom update logic if needed
        return super().update(instance, validated_data)

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # If the last name is not provided, you can choose to omit it or return an empty string
        representation['user']['last_name'] = representation['user'].get('last_name', '')
        return representation

    def get_books_count(self, obj):
        # Assuming the related_name for books in User model is 'authored_books'
        return obj.user.authored_books.count()

    def get_series_count(self, obj):
        # Assuming the related_name for series in User model is 'authored_series'
        return obj.user.authored_series.count()

    def get_followers_count(self, obj):
        return FollowerHelper.get_followers_count(obj.user)

    def get_following_count(self, obj):
        return FollowerHelper.get_following_count(obj.user)



class LibraryBookSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField()
    genre = serializers.SlugRelatedField(
        slug_field='name',
        queryset=Genre.objects.all()
    )
    subgenres = serializers.StringRelatedField(many=True)

    class Meta:
        model = Book
        fields = [
            'id',
            'name',
            'coverpage',
            'author',
            'genre',
            'subgenres',
            'volume_number',
        ]


class AuthoredBookSerializer(serializers.ModelSerializer):
    like_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Book
        fields = ['id', 'name', 'genre', 'subgenres', 'coverpage', 'rating', 'views_count', 'last_modified', 'series',
                  'volume_number', 'status', 'description', 'author', 'like_count']


class SeriesSerializer(serializers.ModelSerializer):
    books = AuthoredBookSerializer(many=True, read_only=True)

    class Meta:
        model = Series
        fields = ['id', 'name', 'books']


class ParentCommentSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()  # This will return the string representation of the user.

    class Meta:
        model = Comment
        fields = ['id', 'user']


class CommentSerializer(serializers.ModelSerializer):
    parent_comment = ParentCommentSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'book', 'text', 'timestamp', 'parent_comment']
        # Во фронте добавить типа, if parent_comment is null : use book


class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('username', 'first_name', 'last_name')

    def update(self, instance, validated_data):
        instance.username = validated_data.get('username', instance.username)
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.save()
        return instance


class CustomProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ('about', 'profileimg')  # Only include the fields you want from Profile


class WebPageSettingsSerializer(serializers.ModelSerializer):
    user = CustomUserSerializer(source='profile.user')  # Nested serializer for user
    profile = CustomProfileSerializer()  # Nested serializer for profile

    class Meta:
        model = WebPageSettings
        fields = ('user', 'profile', 'display_dob_option', 'gender', 'date_of_birth')

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})  # Access nested user data
        profile_data = validated_data.pop('profile', {})  # Access nested profile data

        # Update the User instance
        user_serializer = CustomUserSerializer(instance.profile.user, data=user_data, partial=True)
        if user_serializer.is_valid(raise_exception=True):
            print(user_serializer.validated_data)
            user_serializer.save()

        # Update the Profile instance
        profile_serializer = CustomProfileSerializer(instance.profile, data=profile_data, partial=True)
        if profile_serializer.is_valid(raise_exception=True):
            print(profile_serializer.validated_data)
            profile_serializer.save()

        # Update the WebPageSettings instance
        instance.display_dob_option = validated_data.get('display_dob_option', instance.display_dob_option)
        instance.gender = validated_data.get('gender', instance.gender)
        instance.date_of_birth = validated_data.get('date_of_birth', instance.date_of_birth)
        instance.save()

        return instance


class PrivacySettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ('auto_add_reading', 'library_visibility')
