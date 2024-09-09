from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta, datetime
from django.db.models import Max
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator

User = get_user_model()


class Genre(models.Model):
    name = models.CharField(max_length=50)
    parents = models.ManyToManyField('self', symmetrical=False, related_name='child_subgenres', blank=True)

    def __str__(self):
        return self.name


class Series(models.Model):
    name = models.CharField(max_length=100)
    author = models.ForeignKey(User, on_delete=models.CASCADE, default=None, related_name='authored_series')
    description = models.TextField(default='')
    author_remark = models.TextField(default='')
    series_finished = models.BooleanField(default=False)

    def __str__(self):
        return self.name


class Book(models.Model):
    TYPE_CHOICES = (
        ('epic_novel', 'Epic Novel'),
        ('novel', 'Novel'),
        ('short_story_poem', 'Short Story / Poem'),
        ('collection', 'Short Story Collection / Poem Collection'),
    )

    STATUS_CHOICES = (
        ('created', 'Created'),
        ('published', 'Published'),
        ('uploaded', 'Uploaded'),
        ('changed', 'Changed'),
    )
    VISIBILITY_CHOICES = (
        ('public', 'Public'),
        ('private', 'Private'),
      #  ('followers', 'Followers'),
        ('unlisted', 'Unlisted'),
    )
    COMMENT_DOWNLOAD_CHOICES = (
        ('public', 'Everyone'),
        ('private', 'No one'),
        ('followers', 'Followers'),
    )

    def get_undefined_genre():
        return Genre.objects.get_or_create(name='Undefined')[0].id

    author = models.ForeignKey(User, on_delete=models.CASCADE, default=None,related_name='authored_books')
    co_author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                  related_name='coauthored_books')
    co_author2 = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                  related_name='coauthored_books2')
    genre = models.ForeignKey(Genre, on_delete=models.CASCADE, default=get_undefined_genre)
    subgenres = models.ManyToManyField(Genre, related_name='subgenres', blank=True)
    name = models.CharField(max_length=100, default='Book Name')
    price = models.DecimalField(max_digits=6, decimal_places=2, default=0.00)
    coverpage = models.ImageField(upload_to='static/images/coverpage', default='default_book_img.png')
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)
    description = models.CharField(max_length=2000, default="Book's Description")
    favourite = models.ManyToManyField(User, related_name='favourite', blank=True)
    display_comments = models.BooleanField(default=True)
    book_type = models.CharField(max_length=50, choices=TYPE_CHOICES, default='epic_novel')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='created')
    series = models.ForeignKey(Series, on_delete=models.SET_NULL, null=True, blank=True, related_name='books')
    authors_note = models.TextField(default="Author's Note")
    is_adult = models.BooleanField(default=False)
    rating = models.IntegerField(default=0)
    views_count = models.PositiveIntegerField(default=0)
    last_modified = models.DateTimeField(auto_now=True)
    volume_number = models.PositiveIntegerField(default=1, help_text='The number of the book in the series')
    visibility = models.CharField(max_length=10, choices=VISIBILITY_CHOICES, default='private')
    comment_access = models.CharField(max_length=10, choices=COMMENT_DOWNLOAD_CHOICES, default='public')
    download_access = models.CharField(max_length=10, choices=COMMENT_DOWNLOAD_CHOICES, default='public')
    demo_version = models.BooleanField(default=False)

    def calculate_total_pages(self):
        total_characters = sum(len(chapter.content) for chapter in self.chapters.all())
        return total_characters // 2500

    def get_display_price(self):
        return "Free" if self.price == 0 else self.price

    def save(self, *args, **kwargs):
        from users.models import Notification
        if self.series:  # If the book is part of a series
            if not self.volume_number:
                # Get the current highest sequence number in the series
                current_max = self.series.books.aggregate(Max('volume_number'))['volume_number__max']
                self.volume_number = (current_max + 1) if current_max is not None else 1
            else:
                # Update volume numbers for subsequent books in the series
                subsequent_books = self.series.books.filter(volume_number__gte=self.volume_number).exclude(pk=self.pk)
                for book in subsequent_books:
                    book.volume_number += 1
                    book.save(update_fields=['volume_number'])
        else:  # If the book is not part of a series
            self.volume_number = 1  # Set volume number to 1

        if self.pk:  # Check if the book already exists in the database
            old_book = Book.objects.get(pk=self.pk)
            if old_book.visibility != 'public' and self.visibility == 'public' and self.genre.name != 'Undefined':
                # The book's visibility has been changed to public and the genre is defined
                existing_user = User.objects.get(
                    username='Tika')  # Replace 'admin' with the username of an existing user
                users = User.objects.filter(notification_settings__newbooks=True)
                for user in users:
                    Notification.objects.create(
                        recipient=user.profile,
                        sender=existing_user.profile,
                        notification_type='new_ebook',
                        book=self,
                        message=f'{self.name} has just been released!'
                    )

        super().save(*args, **kwargs)  # Save the book with all updates

    def like_count(self):
        return self.likes.count()

    def toggle_comments_reviews(self):
        # Logic to toggle between comments and reviews
        self.display_comments = not self.display_comments
        self.save()

    def upvote_count(self):
        return self.upvotes.count()

    def downvote_count(self):
        return self.downvotes.count()

    def can_user_comment(self, user):
        if self.comment_access == 'public':
            return True
        elif self.comment_access == 'private':
            return False
        elif self.comment_access == 'followers' and user in self.author.profile.followers.all():
            return True
        return False

    def can_user_download(self, user):
        if self.download_access == 'public':
            return True
        elif self.download_access == 'private':
            return False
        elif self.download_access == 'followers' and user in self.author.profile.followers.all():
            return True
        return False

    def notify_users(self):
        from users.notification_utils import send_book_update_notifications
        latest_chapter = self.chapters.order_by('-created').first()
        if latest_chapter and latest_chapter.published:
            chapter_title = latest_chapter.title
            send_book_update_notifications(self, chapter_title)

    @property
    def latest_chapter_title(self):
        # Assuming you have a Chapter model with a foreign key to Book
        latest_chapter = self.chapters.order_by('-created').first()
        return latest_chapter.title if latest_chapter else None

    def chapter_count(self):
        # Implement this method to return the number of chapters in the book
        return self.chapters.count()


class BookFile(models.Model):
    FILE_TYPE_CHOICES = (
        ('fb2', 'FB2'),
        ('epub', 'EPUB'),
        ('docx', 'DOCX'),
        ('txt', 'TXT'),
        ('pdf', 'PDF'),
        ('xml', 'XML')  # Если вы решите добавить XML как отдельный тип
    )

    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='files')
    file = models.FileField(upload_to='books/')
    file_type = models.CharField(max_length=10, choices=FILE_TYPE_CHOICES)

    def __str__(self):
        return f"{self.book.name} - {self.file_type}"


class BookLike(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='liked_books')
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'book')  # Ensure a user can only like a book once

    def __str__(self):
        return f"{self.user} likes {self.book}"

    def like_count(self):
        # Assuming you have a likes related_name in the BookLike model pointing to this Book model
        return self.likes.count()       # Надо узнать нужно ли эта штука и нужен ли вьюс


class Chapter(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='chapters')
    title = models.CharField(max_length=200, blank=True)  # This will hold the "Chapter X" title
    chapter_number = models.IntegerField()
    is_free = models.BooleanField(default=False)
    updated = models.DateTimeField(auto_now=True)
    created = models.DateTimeField(auto_now_add=True)
    content = models.TextField()
    published = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if not self.title:
            # Automatic title generation using chapter number
            self.title = f"Chapter {self.chapter_number}"

        book = self.book
        book.updated = timezone.now()
        book.save()

        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        book = self.book
        book.last_modified = timezone.now()  # Update the last_modified field of the book
        book.save()
        super().delete(*args, **kwargs)


class BookView(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    last_viewed = models.DateTimeField(auto_now=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    def is_authenticated_view(self):
        return self.user is not None


class Review(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    text = models.TextField()
    created = models.DateTimeField(auto_now_add=True)
    views_count = models.PositiveIntegerField(default=0)
    last_viewed = models.DateTimeField(null=True, blank=True)
    likes = models.ManyToManyField(User, related_name='review_likes', blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    plot_rating = models.IntegerField(default=0, validators=[MinValueValidator(1), MaxValueValidator(10)])
    characters_rating = models.IntegerField(default=0, validators=[MinValueValidator(1), MaxValueValidator(10)])
    main_character_rating = models.IntegerField(default=0, validators=[MinValueValidator(1), MaxValueValidator(10)])
    genre_fit_rating = models.IntegerField(default=0, validators=[MinValueValidator(1), MaxValueValidator(10)])

    @property
    def like_count(self):
        return self.likes.count()

    def save(self, *args, **kwargs):
        genre = self.book.genre
        name = f"Review for a {genre} {self.book.name} - {self.book.author}"
        self.name = name
        super().save(*args, **kwargs)


class ReviewView(models.Model):
    review = models.ForeignKey(Review, on_delete=models.CASCADE)
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)  # Null for anonymous users
    ip_address = models.GenericIPAddressField(null=True, blank=True)  # For anonymous users
    timestamp = models.DateTimeField(auto_now_add=True)


class Comment(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='store_comments')
    text = models.CharField(max_length=500)
    last_modified = models.DateTimeField(auto_now=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    parent_comment = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    is_author = models.BooleanField(default=False)
    rating = models.IntegerField(default=0)
    image = models.ImageField(upload_to='comment_images/', blank=True, null=True)

    def count_likes(self):
        # Count the number of CommentLike objects related to this comment
        return CommentLike.objects.filter(comment=self).count()

    def count_dislikes(self):
        # Count the number of CommentDislike objects related to this comment
        return CommentDislike.objects.filter(comment=self).count()

    def calculate_rating(self):
        likes = CommentLike.objects.filter(comment=self).count()
        dislikes = CommentDislike.objects.filter(comment=self).count()
        return likes - dislikes

    # Call this method to update the rating field
    def update_rating(self):
        self.rating = self.calculate_rating()
        self.save()


class CommentLike(models.Model):
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name='comment_likes')
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    class Meta:
        unique_together = ['comment', 'user']


class CommentDislike(models.Model):
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name='comment_dislikes')
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    class Meta:
        unique_together = ['comment', 'user']


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
        unique_together = ['book', 'user']


class UserBookHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    last_accessed = models.DateTimeField(auto_now=True)


class AuthorNote(models.Model):
    chapter = models.ForeignKey(Chapter, on_delete=models.CASCADE, related_name='notes')
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notes')
    start_position = models.IntegerField()
    end_position = models.IntegerField()
    note_text = models.TextField()

    def __str__(self):
        return f"Note by {self.author.username} in Chapter {self.chapter.id}"


class Illustration(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='illustrations')
    description = models.CharField(max_length=255, default='Illustration Descrpition')
    image = models.ImageField(upload_to='illustrations/')
    use_for_library_cover = models.BooleanField(default=False,
                                                help_text="Use the left side of the picture for the library book cover")

    def __str__(self):
        return f"{self.description} (Illustration for {self.book.name})"


class AnonymousBookAccess(models.Model): # Запись истории посещения книги
    user_id = models.IntegerField(null=True, blank=True)  # Можем хранить ID пользователя, если нужно
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    accessed_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

