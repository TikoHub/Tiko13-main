from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

User = get_user_model()


class Genre(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class Series(models.Model):
    name = models.CharField(max_length=200)
    author = models.ForeignKey(User, on_delete=models.CASCADE, default=None)
    description = models.TextField(default='')
    author_remark = models.TextField(default='')
    series_finished = models.BooleanField(default=False)

    def __str__(self):
        return self.name


class Book(models.Model):
    TYPE_CHOICES = (
        ('epic_novel', 'Epic Novel'),
        ('novel', 'Novel'),
        ('short_story', 'Short Story'),
        ('short_story_collection', 'Short Story Collection'),
        ('poem_collection', 'Poem Collection'),
    )

    STATUS_CHOICES = (
        ('in_progress', 'In Progress'),
        ('finished', 'Finished'),
        ('draft', 'Draft'),
    )

    author = models.ForeignKey(User, on_delete=models.CASCADE, default=None)
    co_author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                  related_name='coauthored_books')
    co_author2 = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                  related_name='coauthored_books2')
    genre = models.ForeignKey(Genre, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    price = models.IntegerField()
    coverpage = models.ImageField(upload_to='static/images/coverpage', default='default_book_img.png')
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)
    description = models.TextField()
    favourite = models.ManyToManyField(User, related_name='favourite', blank=True)
    display_comments = models.BooleanField(default=True)
    book_type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress')
    series = models.ForeignKey(Series, on_delete=models.SET_NULL, null=True, blank=True)
    abstract = models.CharField(max_length=500, blank=True)
    author_remark = models.TextField(blank=True)
    is_adult = models.BooleanField(default=False)
    rating = models.IntegerField(default=0)
    views_count = models.PositiveIntegerField(default=0)

    def increase_views_count(self, user=None):
        if user is None:
            self.views_count += 1
            self.save()
        else:
            last_view = BookView.objects.filter(book=self, user=user).order_by('-timestamp').first()
            if not last_view or (timezone.now() - last_view.timestamp) > timedelta(days=1):
                self.views_count += 1
                self.save()
                BookView.objects.create(book=self, user=user)

    def save(self, *args, **kwargs):
        if self.series_id == '':  # If "No Series" was selected in the form...
            self.series = None
        super().save(*args, **kwargs)

    def toggle_comments_reviews(self):
        # Logic to toggle between comments and reviews
        self.display_comments = not self.display_comments
        self.save()


class Chapter(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='chapters')
    title = models.CharField(max_length=200, blank=True)  # This will hold the "Chapter X" title
    additional_title = models.CharField(max_length=200, blank=True)  # This is for the additional title
    content = models.TextField()

    def save(self, *args, **kwargs):
        if not self.title:
            # If the title is not provided, generate it automatically
            # Get the number of existing chapters for the book
            num_chapters = Chapter.objects.filter(book=self.book).count()
            self.title = f"Chapter {num_chapters + 1}"

        super().save(*args, **kwargs)


class BookView(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)


class Review(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    text = models.TextField()
    created = models.DateTimeField(auto_now_add=True)
    views_count = models.PositiveIntegerField(default=0)
    last_viewed = models.DateTimeField(null=True, blank=True)
    rating = models.IntegerField(default=0)

    def count_likes(self):
        return self.likes.count()

    def count_dislikes(self):
        return self.dislikes.count()

    def increase_views_count(self, user):
        if not self.last_viewed or (timezone.now() - self.last_viewed) > timedelta(days=1):
            self.views_count += 1
            self.last_viewed = timezone.now()
            self.save()
            return True
        return False

    def save(self, *args, **kwargs):
        genre = self.book.genre
        name = f"Review for a {genre} {self.book.name} - {self.book.author}"
        self.name = name
        super().save(*args, **kwargs)


class Comment(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='store_comments')
    text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    parent_comment = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')

    def count_likes(self):
        return self.likes.count()

    def count_dislikes(self):
        return self.dislikes.count()


class CommentLike(models.Model):
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    class Meta:
        unique_together = ['comment', 'user']  # To prevent a user from liking a comment multiple times


class CommentDislike(models.Model):
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name='dislikes')
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    class Meta:
        unique_together = ['comment', 'user']  # To prevent a user from disliking a comment multiple times


class ReviewLike(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name='review_likes')

    class Meta:
        unique_together = ['review', 'user']


class ReviewDislike(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name='review_dislikes')

    class Meta:
        unique_together = ['review', 'user']


class BookUpvote(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='upvotes')
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    class Meta:
        unique_together = ['book', 'user']  # To prevent a user from upvoting a book multiple times


class BookDownvote(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='downvotes')
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    class Meta:
        unique_together = ['book', 'user']  #