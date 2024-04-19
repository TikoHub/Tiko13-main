from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile, WebPageSettings, TemporaryPasswordStorage, TemporaryRegistration, Notification, \
    NotificationSetting, WalletTransaction, UsersNotificationSettings
from store.models import Book, Genre, Series, Comment, BookUpvote, Review
from .helpers import FollowerHelper
from django.utils.formats import date_format
from django.utils import timezone
from datetime import timedelta
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken


class CustomUserRegistrationSerializer(serializers.Serializer):
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    dob_month = serializers.IntegerField(required=True)
    dob_year = serializers.IntegerField(required=True)

    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)
    password2 = serializers.CharField(write_only=True, required=True)

    def validate(self, data):
        errors = {}
        if User.objects.filter(email=data['email']).exists():
            errors['email'] = 'This email is already registered.'
        if data['password'] != data['password2']:
            errors['password'] = 'Passwords do not match.'
        if data['dob_month'] < 1 or data['dob_month'] > 12:
            errors['dob_month'] = 'Invalid month.'
        current_year = timezone.now().year
        if data['dob_year'] > current_year or data['dob_year'] < (current_year - 100):
            errors['dob_year'] = 'Invalid year.'

        if errors:
            raise serializers.ValidationError(errors)

        return data


class VerificationCodeSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    verification_code = serializers.CharField(required=True)

    def validate(self, data):
        # Add validation to check if the TemporaryRegistration with the provided
        # email and verification_code exists and is not expired.
        try:
            temp_reg = TemporaryRegistration.objects.get(
                email=data['email'],
                verification_code=data['verification_code']
            )
            if temp_reg.is_expired:
                raise serializers.ValidationError("The verification code has expired.")
        except TemporaryRegistration.DoesNotExist:
            raise serializers.ValidationError("Invalid verification code or email.")

        # You can add additional validation here if needed

        return data


class CustomUserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(style={'input_type': 'password'})


class UserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name']


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
   # like_count = serializers.IntegerField(read_only=True)
   upvote_count = serializers.SerializerMethodField()
   author = serializers.StringRelatedField()
   series = serializers.StringRelatedField()
   formatted_last_modified = serializers.SerializerMethodField()

   def get_formatted_last_modified(self, obj):
       return obj.last_modified.strftime('%m/%d/%Y')

   #   def get_formatted_last_modified(self, obj):
#       return obj.last_modified.strftime('%d/%m/%Y')        Как вариант можно так
   def get_upvote_count(self, obj):
       return obj.upvotes.count()


   class Meta:
        model = Book
        fields = ['id', 'name', 'genre', 'subgenres', 'coverpage', 'rating', 'views_count', 'formatted_last_modified', 'series',
                  'volume_number', 'status', 'description', 'author', 'upvote_count']


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
    replies = serializers.SerializerMethodField()
    book_name = serializers.SerializerMethodField()
    formatted_timestamp = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'book', 'book_name', 'text', 'formatted_timestamp', 'parent_comment', 'replies']
        # Во фронте добавить типа, if parent_comment is null : use book

    def get_book_name(self, obj):
        # Return the name of the book associated with this comment
        return obj.book.name if obj.book else None

    def get_formatted_timestamp(self, obj):
        return obj.timestamp.strftime('%m/%d/%Y %H:%M')  # Formats the timestamp

    def get_parent_comment(self, obj):
        # This will serialize the parent comment if it exists
        if obj.parent_comment:
            return CommentSerializer(obj.parent_comment).data
        return None

    def get_replies(self, obj):
        # Recursive serialization to fetch replies to a comment
        if obj.replies.all().exists():
            return CommentSerializer(obj.replies.all(), many=True).data
        return []


class ReviewSerializer(serializers.ModelSerializer):
    formatted_timestamp = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ['id', 'book', 'text', 'created', 'views_count', 'last_viewed', 'rating', 'formatted_timestamp']

    def get_formatted_timestamp(self, obj):
        time_difference = timezone.now() - obj.created
        if time_difference < timedelta(seconds=60):
            return "just now"
        elif time_difference < timedelta(minutes=60):
            return f"{time_difference.seconds // 60} minutes ago"
        elif time_difference < timedelta(days=1):
            return f"{time_difference.seconds // 3600} hours ago"
        elif time_difference < timedelta(weeks=1):
            return f"{time_difference.days} days ago"
        else:
            return obj.created.strftime('%d.%m.%Y')


class CustomUserSerializer(serializers.ModelSerializer):
    id = serializers.ReadOnlyField()

    def update(self, instance, validated_data):
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.save()
        return instance

    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'id')


class CustomProfileSerializer(serializers.ModelSerializer):
    id = serializers.ReadOnlyField()
    class Meta:
        model = Profile
        fields = ('about', 'profileimg', 'id', 'banner_image')  # Only include the fields you want from Profile


class WebPageSettingsSerializer(serializers.ModelSerializer):
    profile = CustomProfileSerializer()  # Nested serializer for profile

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', None)

        if profile_data is not None:
            profile_serializer = CustomProfileSerializer(instance.profile, data=profile_data, partial=True)
            if profile_serializer.is_valid():
                profile_serializer.save()
            else:
                raise serializers.ValidationError(profile_serializer.errors)

        # Update WebPageSettings instance fields
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()

        return instance

    class Meta:
        model = WebPageSettings
        fields = ('profile', 'display_dob_option', 'gender', 'date_of_birth')


class PrivacySettingsSerializer(serializers.ModelSerializer):
    current_email = serializers.ReadOnlyField(source='user.email')

    class Meta:
        model = Profile
        fields = ('auto_add_reading', 'library_visibility', 'current_email')


'''class EmailChangeSerializer(serializers.Serializer):           # Закомментил возможность менять эмейл
    verification_code = serializers.CharField(required=True)
    new_email = serializers.EmailField(required=True)

    def validate(self, data):
        user = self.context['request'].user
        verification_instance = EmailVerification.objects.get(user=user, verification_type='email_change')

        if verification_instance.verification_code != data['verification_code']:
            raise serializers.ValidationError("Invalid verification code.")

        if user.email == data['new_email']:
            raise serializers.ValidationError("New email is the same as the current email.")

        if verification_instance.verified:
            raise serializers.ValidationError("Verification code already used.")

        return data
'''


class PasswordChangeRequestSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    confirm_new_password = serializers.CharField(required=True)

    def validate(self, data):
        user = self.context['request'].user
        if not user.check_password(data['current_password']):
            raise serializers.ValidationError("Current password is incorrect.")
        if data['new_password'] != data['confirm_new_password']:
            raise serializers.ValidationError("New passwords do not match.")
        return data


class PasswordChangeVerificationSerializer(serializers.Serializer):
    verification_code = serializers.CharField(required=True)

    def validate_verification_code(self, value):
        user = self.context['request'].user
        try:
            temp_storage = TemporaryPasswordStorage.objects.get(user=user, verification_code=value)
            if temp_storage.is_expired:
                raise serializers.ValidationError("Verification code expired.")
            return value
        except TemporaryPasswordStorage.DoesNotExist:
            raise serializers.ValidationError("Invalid verification code.")


class NotificationSerializer(serializers.ModelSerializer):
    formatted_timestamp = serializers.SerializerMethodField()
    message = serializers.SerializerMethodField()

    from django.utils import timezone
    from datetime import timedelta

    def get_formatted_timestamp(self, obj):
        time_difference = timezone.now() - obj.timestamp
        if time_difference < timedelta(minutes=1):
            return "just now"
        elif time_difference < timedelta(hours=1):
            return f"{time_difference.seconds // 60} minutes ago"
        elif time_difference < timedelta(days=1):
            return f"{time_difference.seconds // 3600} hours ago"
        elif time_difference < timedelta(days=30):
            return f"{time_difference.days} days ago"
        elif time_difference < timedelta(days=60):
            return f"1 month ago"
        elif time_difference < timedelta(days=90):
            return f"2 months ago"
        elif time_difference < timedelta(days=120):
            return f"3 months ago"
        elif time_difference < timedelta(days=150):
            return f"4 months ago"
        elif time_difference < timedelta(days=180):
            return f"5 months ago"
        elif time_difference < timedelta(days=360):
            return f"half a year ago"
        elif time_difference < timedelta(days=720):
            return f"a year ago"
        else:
            return obj.timestamp.strftime('%d.%m.%Y')

    def get_message(self, obj):
        return obj.message

    class Meta:
        model = Notification
        fields = ['id', 'recipient', 'sender', 'notification_type', 'read', 'formatted_timestamp', 'message']


class NotificationSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationSetting
        fields = [
            'group_by_author',
          #  'show_book_updates',
            'show_author_updates',
            'newbooks',
            'library_reading_updates',  # Updated field name
            'library_wishlist_updates',  # Updated field name
            'library_liked_updates',  # Updated field name
            'show_review_updates',
            'show_comment_updates',
            'show_follower_updates',
            'show_response_updates',
        ]


class ProfileDescriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['description']


class WalletTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WalletTransaction
        fields = ['amount', 'transaction_type', 'timestamp', 'related_purchase']


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['username'] = user.username
        return token


class UserNotificationSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UsersNotificationSettings
        fields = [
            'notify_reading',
            'notify_liked',
            'notify_wishlist',
            'notify_favorites',
            'chapter_notification_threshold',  # Add this field
        ]


class FollowSerializer(serializers.Serializer):
    def validate(self, data):
        follower = self.context['request'].user
        user_username = self.context['view'].kwargs.get('username')
        try:
            user = User.objects.get(username=user_username)
        except User.DoesNotExist:
            raise serializers.ValidationError("User does not exist")

        if follower == user:
            raise serializers.ValidationError("You cannot follow yourself")

        return {'follower': follower, 'user': user}

    def create(self, validated_data):
        follower = validated_data['follower']
        user = validated_data['user']

        if FollowerHelper.is_following(follower, user):
            FollowerHelper.unfollow(follower, user)
        else:
            FollowerHelper.follow(follower, user)
        return {'follower': follower, 'user': user}
