from rest_framework import serializers
from .models import Chapter, Book, Comment, Review, Genre, Series, BookView, ReviewLike, ReviewDislike, AuthorNote
from users.models import Profile, FollowersCount, Illustration
from django.utils.formats import date_format
from django.shortcuts import get_object_or_404
from django.utils.timesince import timesince
from datetime import datetime, timedelta
from django.utils import timezone
from django.contrib.auth.models import User
from django.urls import reverse
from users.models import Notification


class ChapterSerializers(serializers.ModelSerializer):       # Основной Чаптер Сериалайзер

    class Meta:
        model = Chapter
        fields = ['id', 'title', 'content']


class ChapterSummarySerializer(serializers.ModelSerializer):      # Для Book_Detail / Content
    added_date = serializers.DateTimeField(source='created', format='%m-%d-%Y')

    class Meta:
        model = Chapter
        fields = ['title', 'added_date']


class BookCreateSerializer(serializers.ModelSerializer):
    book_type = serializers.ChoiceField(choices=Book.TYPE_CHOICES)
    abstract = serializers.CharField(max_length=500, required=False)
    author_remark = serializers.CharField(max_length=500, required=False)
    is_adult = serializers.BooleanField(required=False)
    genre2 = serializers.PrimaryKeyRelatedField(queryset=Genre.objects.all(), required=False)
    genre3 = serializers.PrimaryKeyRelatedField(queryset=Genre.objects.all(), required=False)
 #   co_author = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), required=False)
  #  co_author2 = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), required=False)
    series = serializers.PrimaryKeyRelatedField(queryset=Series.objects.all(), required=False)

    class Meta:
        model = Book
        fields = ['name', 'genre', 'description', 'price', 'coverpage', 'abstract',
                  'author_remark', 'is_adult', 'book_type', 'genre2', 'genre3',
                  'status', 'series']

    def create(self, validated_data):
        # Assuming 'user' is passed in the context of the request
        user = self.context['request'].user
        book = Book.objects.create(author=user, **validated_data)
        return book


class BookSerializer(serializers.ModelSerializer):     # Основной Сериализатор для Book_Detail
    author = serializers.StringRelatedField()
    genre = serializers.SlugRelatedField(
        slug_field='name',
        queryset=Genre.objects.all()
    )
    subgenres = serializers.StringRelatedField(many=True)
    #character_count = serializers.SerializerMethodField()
    series_name = serializers.SerializerMethodField(source='series.name', read_only=True)
    display_price = serializers.SerializerMethodField()
    upvotes = serializers.SerializerMethodField()
    downvotes = serializers.SerializerMethodField()
    author_profile_img = serializers.SerializerMethodField()
    author_followers_count = serializers.SerializerMethodField()
    first_chapter_info = serializers.SerializerMethodField()

    def get_first_chapter_info(self, obj):
        first_chapter = obj.chapters.order_by('created').first()
        if first_chapter:
            # You can adjust the returned data according to your needs
            # For example, returning the chapter ID and title
            return {
                'id': first_chapter.id,
                'title': first_chapter.title
            }
        return None

    def get_author_profile_img(self, obj):
        request = self.context.get('request')
        if obj.author.profile.profileimg and request:
            return request.build_absolute_uri(obj.author.profile.profileimg.url)
        return None

    def get_upvotes(self, obj):
        return obj.upvote_count()

    def get_downvotes(self, obj):
        return obj.downvote_count()

    def get_display_price(self, obj):
        return obj.get_display_price()

    def get_author_followers_count(self, obj):
        return FollowersCount.objects.filter(user=obj.author).count()

    #def get_character_count(self, obj):
        # Calculate the sum of characters of all chapter contents of the book
     #   total_characters = sum(len(chapter.content) for chapter in obj.chapters.all())
      #  return total_characters

    def get_series_name(self, obj):
        return obj.series.name if obj.series else None


    class Meta:
        model = Book
        fields = ['id', 'name', 'genre', 'subgenres', 'author', 'coverpage', 'views_count', 'volume_number', 'last_modified', 'first_chapter_info',
                  'is_adult', 'series_name', 'book_type', 'display_price', 'upvotes', 'downvotes', 'author_profile_img', 'author_followers_count',
                  ]


class BookInfoSerializer(serializers.ModelSerializer):         # Book_Detail/Info
    total_chapters = serializers.SerializerMethodField()
    total_pages = serializers.SerializerMethodField()
    formatted_last_modified = serializers.SerializerMethodField()

    def get_formatted_last_modified(self, obj):
        return obj.last_modified.strftime('%m/%d/%Y')

    def get_total_chapters(self, obj):
        # Assuming you have a related set of chapters
        return obj.chapters.count()

    def get_total_pages(self, obj):
        # Assuming you have a way to calculate total pages
        return obj.calculate_total_pages()  # Replace with your method

    class Meta:
        model = Book
        fields = ['total_chapters', 'total_pages', 'description', 'formatted_last_modified']


class BookContentSerializer(serializers.ModelSerializer):  # Book_Detail/Content
    chapters = serializers.SerializerMethodField()

    def get_chapters(self, obj):
        # Filter chapters to include only those that are published
        published_chapters = obj.chapters.filter(published=True)
        return ChapterSummarySerializer(published_chapters, many=True).data

    class Meta:
        model = Book
        fields = ['chapters']


class CommentSerializer(serializers.ModelSerializer):
    time_since = serializers.SerializerMethodField()
    last_modified = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S")
    replies = serializers.SerializerMethodField()
    profileimg = serializers.SerializerMethodField()
    username = serializers.SerializerMethodField()
    rating = serializers.SerializerMethodField()
    image = serializers.ImageField(required=False, allow_null=True)

    def get_rating(self, obj):
        # Ensure the rating is calculated dynamically here
        return obj.calculate_rating()

    def get_profileimg(self, obj):
        request = self.context.get('request', None)
        if obj.user.profile.profileimg and request:
            profileimg_url = obj.user.profile.profileimg.url
            return request.build_absolute_uri(profileimg_url)
        return None


    def get_username(self, obj):
        return obj.user.username


    class Meta:
        model = Comment
        fields = ['id', 'book', 'profileimg', 'username', 'text', 'last_modified', 'parent_comment', 'time_since', 'rating', 'is_author', 'replies', 'image']

    def get_time_since(self, obj):
        if obj.timestamp:
            time_difference = timezone.now() - obj.timestamp
            if time_difference < timedelta(days=1):
                return timesince(obj.timestamp) + " ago"
            else:
                return obj.timestamp.strftime("%m-%d-%Y")
        return ""

    def get_replies(self, obj):
        if obj.replies.exists():
            # Pass the context to the nested serializer
            context = self.context
            return CommentSerializer(obj.replies.all(), many=True, context=context).data
        return []


class CreateCommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ['text', 'image']


class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = '__all__'


class SeriesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Series
        fields = '__all__'


class BookViewSerializer(serializers.ModelSerializer):
    book_name = serializers.CharField(source='book.name')
    series_name = serializers.CharField(source='book.series.name', default='No Series')
    volume_number = serializers.IntegerField(source='book.volume_number')
    last_modified = serializers.DateTimeField(source='book.last_modified')
    views_count = serializers.IntegerField(source='book.views_count')
    coverpage = serializers.ImageField(source='book.coverpage')
    upvotes = serializers.SerializerMethodField()
    description = serializers.CharField(source='book.description')

    def get_upvotes(self, obj):
        return obj.book.upvote_count()

    class Meta:
        model = BookView
        fields = ['book_name', 'series_name', 'volume_number', 'last_modified', 'views_count', 'coverpage', 'upvotes', 'description']


class ReviewSerializer(serializers.ModelSerializer):
    views_count = serializers.IntegerField(read_only=True)
    like_count = serializers.SerializerMethodField()
    dislike_count = serializers.SerializerMethodField()

    def get_like_count(self, obj):
        return ReviewLike.objects.filter(review=obj).count()

    def get_dislike_count(self, obj):
        return ReviewDislike.objects.filter(review=obj).count()

    class Meta:
        model = Review
        fields = ['id', 'text', 'book', 'author', 'views_count', 'like_count', 'dislike_count']

    def create(self, validated_data):
        # Assuming that 'author' comes from the request user and 'book' from the request data
        user = self.context['request'].user
        book_id = self.context['request'].data.get('book_id')

        # Fetch the book instance based on the provided book_id
        book = get_object_or_404(Book, id=book_id)

        review = Review.objects.create(author=user, book=book, **validated_data)
        return review


class ReviewLikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewLike
        fields = '__all__'


class ReviewDislikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewDislike
        fields = '__all__'


class ChapterContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chapter
        fields = ['content', 'published']  # Add any other relevant fields

    def create(self, validated_data):
        # Assuming 'book_id' is passed in the context of the request
        book_id = self.context['request'].session.get('book_id')
        chapter = Chapter.objects.create(book_id=book_id, **validated_data)
        return chapter


class BookSettingsSerializer(serializers.ModelSerializer):
    co_author = serializers.SlugRelatedField(
        slug_field='username',
        queryset=User.objects.none(),  # Initially set to none
        required=False
    )

    class Meta:
        model = Book
        fields = ['name', 'book_type', 'co_author']
        extra_kwargs = {
            'name': {'required': True},
            'book_type': {'required': True}
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if 'co_author_queryset' in self.context:
            self.fields['co_author'].queryset = self.context['co_author_queryset']


class IllustrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Illustration  # Assuming you have an Illustration model
        fields = ['image']  # Add any other relevant fields


class BookSaleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = ['price', 'is_available_for_sale']
        extra_kwargs = {
            'price': {'required': True},
            'is_available_for_sale': {'required': True}
        }


class AuthorNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuthorNote
        fields = ['id', 'chapter', 'author', 'start_position', 'end_position', 'note_text']


class NotificationSerializer(serializers.ModelSerializer):
    book = BookSerializer(read_only=True)
    message = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ['id', 'book', 'message', 'timestamp']

    def get_message(self, obj):
        # Customize the message based on the notification type
        if obj.notification_type == 'book_update':
            new_chapters_count = obj.book.chapters.filter(created__gt=obj.timestamp).count()
            return f"New update in {obj.book.name}: {new_chapters_count} new chapters"
        else:
            return obj.get_message()
