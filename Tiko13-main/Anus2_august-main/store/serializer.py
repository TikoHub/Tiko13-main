from rest_framework import serializers
from .models import Chapter, Book, Comment, Review


class ChapterSerializers(serializers.ModelSerializer):
    class Meta:
        model = Chapter
        fields = ['title', 'additional_title', 'content']


class BookSerializer(serializers.ModelSerializer):
    genre = serializers.StringRelatedField()  # This will display the genre's __str__ method result.
    author = serializers.StringRelatedField()  # This will display the author's __str__ method result.

    class Meta:
            model = Book
            fields = ['id','name', 'genre', 'author', 'coverpage', 'rating', 'views_count']


class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = '__all__'


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = '__all__'




