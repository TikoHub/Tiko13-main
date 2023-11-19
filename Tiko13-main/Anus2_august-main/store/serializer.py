from rest_framework import serializers
from .models import Chapter, Book, Comment, Review, Genre, Series, BookView, ReviewLike, ReviewDislike
from users.models import Profile, FollowersCount
from django.utils.formats import date_format


class ChapterSerializers(serializers.ModelSerializer):

    class Meta:
        model = Chapter
        fields = ['title', 'content']


class ChapterSerializer(serializers.ModelSerializer):
    added_date = serializers.DateTimeField(source='created', format='%m-%d-%Y')

    class Meta:
        model = Chapter
        fields = ['title', 'added_date']


class BookSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField()  # This will display the author's __str__ method result.
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

    def get_upvotes(self, obj):
        return obj.upvote_count()

    def get_downvotes(self, obj):
        return obj.downvote_count()
    def get_display_price(self, obj):
        return obj.get_display_price()

    def get_author_profile_img(self, obj):
        profile = Profile.objects.filter(user=obj.author).first()
        if profile and profile.profileimg:
            return profile.profileimg.url  # Make sure MEDIA_URL is configured properly in settings
        return None

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
        fields = ['id', 'name', 'genre', 'subgenres', 'author', 'coverpage', 'views_count', 'volume_number', 'last_modified', 'price',
                  'is_adult', 'series_name', 'book_type', 'display_price', 'upvotes', 'downvotes', 'author_profile_img', 'author_followers_count']


class BookInfoSerializer(serializers.ModelSerializer):
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


class BookContentSerializer(serializers.ModelSerializer):
    chapters = ChapterSerializer(many=True, read_only=True)

    class Meta:
        model = Book
        fields = ['chapters']


class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = '__all__'


class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = '__all__'


class SeriesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Series
        fields = '__all__'


class BookViewSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookView
        fields = '__all__'


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ['text', 'book', 'author']

    def create(self, validated_data):
        # Remove 'author' and 'book' from validated_data since they will be added separately
        author = validated_data.pop('author', None)
        book = validated_data.pop('book', None)
        review = Review.objects.create(author=author, book=book, **validated_data)
        return review


class ReviewLikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewLike
        fields = '__all__'


class ReviewDislikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewDislike
        fields = '__all__'
