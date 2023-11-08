from rest_framework import serializers
from .models import Chapter, Book, Comment, Review, Genre, Series, BookView


class ChapterSerializers(serializers.ModelSerializer):
    class Meta:
        model = Chapter
        fields = ['title', 'content']


class BookSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField()  # This will display the author's __str__ method result.
    genre = serializers.SlugRelatedField(
        slug_field='name',
        queryset=Genre.objects.all()
    )
    subgenres = serializers.StringRelatedField(many=True)
    character_count = serializers.SerializerMethodField()

    def get_character_count(self, obj):
        # Calculate the sum of characters of all chapter contents of the book
        total_characters = sum(len(chapter.content) for chapter in obj.chapters.all())
        return total_characters

    class Meta:
        model = Book
        fields = ['id', 'name', 'genre', 'subgenres', 'author', 'coverpage', 'rating', 'views_count', 'volume_number', 'last_modified',
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
