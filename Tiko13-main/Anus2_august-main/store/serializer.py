from rest_framework import serializers
from .models import Chapter, Book, Comment, Review, Genre, Series, BookView, CommentLike, CommentDislike, ReviewLike, ReviewDislike, BookUpvote, BookDownvote
from django.db.models import Max


class ChapterSerializers(serializers.ModelSerializer):
    class Meta:
        model = Chapter
        fields = ['title', 'content']


class BookSerializer(serializers.ModelSerializer):
    genre = serializers.StringRelatedField()  # This will display the genre's __str__ method result.
    author = serializers.StringRelatedField()  # This will display the author's __str__ method result.
    character_count = serializers.SerializerMethodField()

    def get_last_chapter_update(self, obj):
        # Get the latest 'updated' timestamp from all chapters of the book
        last_update = obj.chapters.aggregate(Max('updated'))['updated__max']
        if last_update:
            return last_update.isoformat()
        return None

    def get_character_count(self, obj):
        # Calculate the sum of characters of all chapter contents of the book
        total_characters = sum(len(chapter.content) for chapter in obj.chapters.all())
        return total_characters

    class Meta:
        model = Book
        fields = ['id', 'name', 'genre', 'author', 'coverpage', 'rating', 'views_count', 'last_modified',
                  'character_count']


class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = '__all__'


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
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


