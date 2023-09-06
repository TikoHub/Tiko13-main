from django.db import models
from django.contrib.auth import get_user_model
from store.models import Book, Review, Comment

User = get_user_model()


class Achievement(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    image = models.ImageField(upload_to='achievement_images')

    def __str__(self):
        return self.name


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
    id_user = models.IntegerField()
    nickname = models.CharField(max_length=100, blank=True)
    bio = models.TextField(blank=True)
    profileimg = models.ImageField(upload_to='profile_images', default='blank-profile-picture.png')
    bookmarks = models.ManyToManyField(Review, related_name='bookmark_profiles', blank=True)
    achievements = models.ManyToManyField(Achievement, blank=True)
    blacklist = models.ManyToManyField(User, related_name="blacklisted_by", blank=True)
    auto_add_reading = models.BooleanField(default=False)

    PRIVACY_CHOICES = (
        ('nobody', 'Nobody'),
        ('followers', 'Only Followers'),
        ('friends', 'Only Friends'),
        ('anyone', 'Anyone'),
    )
    library_privacy = models.CharField(
        max_length=10,
        choices=PRIVACY_CHOICES,
        default='anyone',
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
    watchlist_books = models.ManyToManyField(Book, related_name='watchlist_users', blank=True)
    finished_books = models.ManyToManyField(Book, related_name='finished_users', blank=True)

    def __str__(self):
        return f"Library - {self.user.username}"

    def get_all_books(self):
        return self.reading_books.all() | self.watchlist_books.all() | self.finished_books.all()


class Illustration(models.Model):
    image = models.ImageField(upload_to='static/images/illustrations')


class Trailer(models.Model):
    link = models.URLField(max_length=200)


class WebPageSettings(models.Model):
    DOB_CHOICES = (
        (0, 'Do not show my date of birth'),
        (1, 'Show only my day and month'),
        (2, 'Show my date of birth'),
    )

    profile = models.OneToOneField(Profile, on_delete=models.CASCADE)
    about = models.TextField(blank=True)
    status = models.CharField(max_length=200, blank=True)
    date_of_birth = models.DateField(blank=True, null=True)
    profile_url = models.CharField(max_length=100, unique=True, blank=True)
    website = models.URLField(max_length=200, blank=True)
    email = models.EmailField(max_length=100, blank=True)
    facebook = models.URLField(max_length=200, blank=True)
    instagram = models.URLField(max_length=200, blank=True)
    twitter = models.URLField(max_length=200, blank=True)
    display_dob_option = models.IntegerField(choices=DOB_CHOICES, default=0)

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


