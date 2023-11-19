import datetime

from django.utils import timezone

from django.db import models
from store.models import Book, Review, Comment
from django.contrib.auth.models import User
from django.core.validators import FileExtensionValidator
from django.core.files.images import get_image_dimensions
from PIL import Image
from io import BytesIO
from django.core.files.uploadedfile import InMemoryUploadedFile


class Achievement(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    image = models.ImageField(upload_to='achievement_images')

    def __str__(self):
        return self.name


class TemporaryRegistration(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, blank=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=32)
    dob_month = models.IntegerField(null=True, blank=True)
    dob_year = models.IntegerField(null=True, blank=True)
    verification_code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def is_expired(self):
        return timezone.now() > self.created_at + datetime.timedelta(minutes=10)


class Notification(models.Model):
    # Define types of notifications
    TYPE_CHOICES = (
        ('like', 'Like'),
        ('comment', 'Comment'),
        ('follow', 'Follow'),
    )

    recipient = models.ForeignKey('Profile', on_delete=models.CASCADE, related_name='notifications')
    sender = models.ForeignKey('Profile', on_delete=models.CASCADE, related_name='sent_notifications')
    notification_type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    read = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    def get_message(self):
        if self.notification_type == 'follow':
            return f"{self.sender.user.username} followed you"
        elif self.notification_type == 'comment':
            return f"{self.sender.user.username} replied to your comment"
        else:
            return ""


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    about = models.TextField(blank=True)
    profileimg = models.ImageField(upload_to='profile_images', default='blank-profile-picture.png')
    bookmarks = models.ManyToManyField(Review, related_name='bookmark_profiles', blank=True)
    achievements = models.ManyToManyField(Achievement, blank=True)
    blacklist = models.ManyToManyField(User, related_name="blacklisted_by", blank=True)
    auto_add_reading = models.BooleanField(default=True)
    description = models.TextField(blank=True, null=True) # Не уверен что мне этот метод нравится
    banner_image = models.ImageField(
        upload_to='banner_images',
        default='default_banner.png',
        validators=[FileExtensionValidator(['jpg', 'jpeg', 'png'])]
    )

    LIBRARY_VISIBILITY_CHOICES = (
        ('no_one', 'No One'),
        ('friends', 'Friends Only'),
        ('everyone', 'Everyone'),
    )
    library_visibility = models.CharField(
        max_length=10,
        choices=LIBRARY_VISIBILITY_CHOICES,
        default='friends'
    )

    def unread_notification_count(self):
        return self.notifications.filter(read=False).count()

    def __str__(self):
        return self.user.username


class FollowersCount(models.Model):
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name='following_users')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='follower_users')

    def __str__(self):
        return self.user


class Library(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='library')
    reading_books = models.ManyToManyField(Book, related_name='reading_users', blank=True)
    liked_books = models.ManyToManyField(Book, related_name='liked_users', blank=True)
    wish_list_books = models.ManyToManyField(Book, related_name='wishlist_users', blank=True)
    favorites_books = models.ManyToManyField(Book, related_name='favorites_users', blank=True)
    finished_books = models.ManyToManyField(Book, related_name='finished_users', blank=True)

    def __str__(self):
        return f"Library - {self.user.username}"

    def get_all_books(self):
        # Adjust this method if you want to include all categories
        return (self.reading_books.all() | self.liked_books.all() |
                self.wish_list_books.all() | self.favorites_books.all() |
                self.finished_books.all()).distinct()


class Illustration(models.Model):
    image = models.ImageField(upload_to='static/images/illustrations')


class Trailer(models.Model):
    link = models.URLField(max_length=200)


class WebPageSettings(models.Model):
    DOB_CHOICES = (
        (0, 'No One'),
        (1, 'Friends Only'),
        (2, 'Everyone'),
    )
    GENDER_CHOICES = (
        ('not_specified', 'Not Specified'),
        ('female', 'Female'),
        ('male', 'Male'),
        ('other', 'Other'),
    )

    profile = models.OneToOneField(Profile, on_delete=models.CASCADE)
    date_of_birth = models.DateField(blank=True, null=True)
    display_dob_option = models.IntegerField(choices=DOB_CHOICES, default=1)
    gender = models.CharField(
        max_length=15,
        choices=GENDER_CHOICES,
        default='not_specified',
        blank=True
    )

    def __str__(self):
        return self.profile.user.username


class Conversation(models.Model):
    participants = models.ManyToManyField(User)

    def __str__(self):
        return ", ".join([str(p) for p in self.participants.all()])

    def get_other_user(self, user):
        return self.participants.exclude(id=user.id).first()


class Message(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    conversation = models.ForeignKey(Conversation, related_name='messages', on_delete=models.CASCADE, null=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return self.text


class EmailVerification(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    verification_code = models.CharField(max_length=6)
    verified = models.BooleanField(default=False)


class TemporaryPasswordStorage(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    hashed_new_password = models.CharField(max_length=128)
    verification_code = models.CharField(max_length=6)
    expires_at = models.DateTimeField()

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    @staticmethod
    def create_for_user(user, hashed_password, code):
        expiration_duration = datetime.timedelta(hours=1)  # Adjust as needed
        instance, _ = TemporaryPasswordStorage.objects.update_or_create(
            user=user,
            defaults={
                'hashed_new_password': hashed_password,
                'verification_code': code,
                'expires_at': timezone.now() + expiration_duration
            }
        )
        return instance


class NotificationSetting(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_settings')
    group_by_author = models.BooleanField(default=True)
    show_book_updates = models.BooleanField(default=True)
    show_author_updates = models.BooleanField(default=True)

    newbooks = models.BooleanField(default=False)
    library_readling_updates = models.BooleanField(default=True)
    library_wishlist_updates = models.BooleanField(default=True)
    library_liked_updates = models.BooleanField(default=True)

    show_review_updates = models.BooleanField(default=True)
    show_comment_updates = models.BooleanField(default=True)
    show_follower_updates = models.BooleanField(default=True)
    show_response_updates = models.BooleanField(default=True)