from .models import FollowersCount, Notification
from django.contrib.auth.models import User

class FollowerHelper:
    @staticmethod
    def is_following(follower, user):
        if not follower.is_authenticated or not user.is_authenticated:
            return False
        return FollowersCount.objects.filter(follower=follower, user=user).exists()

    @staticmethod
    def follow(follower, user):
        if not FollowerHelper.is_following(follower, user):
            new_follower = FollowersCount.objects.create(follower=follower, user=user)

            # Check if the user wants to receive new follower notifications
            if user.notification_settings.new_follower_notifications:
                # Create a new notification for gaining a new follower
                Notification.objects.create(
                    recipient=user,
                    sender=follower,
                    notification_type='new_follower',
                    # Additional fields as needed, such as a message or related content
                )

            return new_follower
        return None

    @staticmethod
    def unfollow(follower, user):
        if FollowerHelper.is_following(follower, user):
            delete_follower = FollowersCount.objects.get(follower=follower, user=user)
            delete_follower.delete()

    @staticmethod
    def get_followers_count(user):
        return FollowersCount.objects.filter(user=user).count()

    @staticmethod
    def get_following_count(follower):
        return FollowersCount.objects.filter(follower=follower).count()

    @staticmethod
    def get_followers(user):
        return User.objects.filter(following_users__user=user)

    @staticmethod
    def get_following(follower):
        return User.objects.filter(follower_users__follower=follower)

    @staticmethod
    def get_friends(user):
        # Get users followed by 'user'
        following = set(FollowersCount.objects.filter(follower=user).values_list('user__username', flat=True))

        # Get users who follow 'user'
        followers = set(FollowersCount.objects.filter(user=user).values_list('follower__username', flat=True))

        # Find mutual following - this is the 'friends' set
        friends = following.intersection(followers)

        return User.objects.filter(username__in=friends)