from django import template

register = template.Library()


@register.filter
def subtract(value, arg):
    return value - arg


@register.filter
def add_values(value, arg):
    return value + arg


@register.filter
def calculate_comment_rating(comments):
    total_likes = 0
    total_dislikes = 0
    for comment in comments:
        total_likes += comment.count_likes()
        total_dislikes += comment.count_dislikes()

    rating = total_likes - total_dislikes
    return rating

@register.filter
def calculate_review_rating(reviews):
    total_likes = 0
    total_dislikes = 0
    for review in reviews:
        total_likes += review.review_likes.count()
        total_dislikes += review.review_dislikes.count()

    rating = total_likes - total_dislikes
    return rating

