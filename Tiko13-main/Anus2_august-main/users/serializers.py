from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile
from store.models import Book, Genre, Series, Comment


class CustomUserRegistrationSerializer(serializers.Serializer):
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=False)
    dob_month = serializers.IntegerField(required=False) # Поменять на тру
    dob_year = serializers.IntegerField(required=False) #Поменять на тру

    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)
    password2 = serializers.CharField(write_only=True, required=True)

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError("Passwords do not match.")
        return data


class CustomUserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(style={'input_type': 'password'})


class UserSerializer(serializers.ModelSerializer):
    at_username = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'at_username', 'first_name', 'last_name']

    def get_at_username(self, obj):
        return f"@{obj.username}"


class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    unread_notification_count = serializers.IntegerField(read_only=True)
    books_count = serializers.SerializerMethodField()
    series_count = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = [
            'user',
            'bio',
            'profileimg',
            'unread_notification_count',
            'banner_image',
            'books_count',
            'series_count',
        ]
        read_only_fields = ('user',)

    def create(self, validated_data):
        # Custom creation logic if needed
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Custom update logic if needed
        return super().update(instance, validated_data)

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # If the last name is not provided, you can choose to omit it or return an empty string
        representation['user']['last_name'] = representation['user'].get('last_name', '')
        return representation

    def get_books_count(self, obj):
        # Assuming the related_name for books in User model is 'authored_books'
        return obj.user.authored_books.count()

    def get_series_count(self, obj):
        # Assuming the related_name for series in User model is 'authored_series'
        return obj.user.authored_series.count()


class LibraryBookSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField()
    genre = serializers.SlugRelatedField(
        slug_field='name',
        queryset=Genre.objects.all()
    )
    subgenres = serializers.StringRelatedField(many=True)

    class Meta:
        model = Book
        fields = [
            'id',
            'name',
            'coverpage',
            'author',
            'genre',
            'subgenres',
            'volume_number',
        ]


class AuthoredBookSerializer(serializers.ModelSerializer):
    like_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Book
        fields = ['id', 'name', 'genre', 'subgenres', 'coverpage', 'rating', 'views_count', 'last_modified', 'series',
                  'volume_number', 'status', 'description', 'author', 'like_count']


class SeriesSerializer(serializers.ModelSerializer):
    books = AuthoredBookSerializer(many=True, read_only=True)

    class Meta:
        model = Series
        fields = ['id', 'name', 'books']


class ParentCommentSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()  # This will return the string representation of the user.

    class Meta:
        model = Comment
        fields = ['id', 'user']


class CommentSerializer(serializers.ModelSerializer):
    parent_comment = ParentCommentSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'book', 'text', 'timestamp', 'parent_comment']
        # Во фронте добавить типа, if parent_comment is null : use book
