from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from store.models import CommentLike, CommentDislike


@receiver(post_save, sender=CommentLike)
@receiver(post_save, sender=CommentDislike)
@receiver(post_delete, sender=CommentLike)
@receiver(post_delete, sender=CommentDislike)
def update_comment_rating(sender, instance, **kwargs):
    instance.comment.update_rating()
