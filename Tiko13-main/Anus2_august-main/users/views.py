import uuid
from datetime import datetime, timedelta, timezone, date
import time
from decimal import Decimal

from django.db import transaction
import random
import re
from django.contrib.auth.hashers import make_password
from django.contrib import messages
from django.contrib.auth import authenticate, login
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.db import transaction
from django.db.models import Q, Count
from django.http import JsonResponse, HttpResponse, HttpResponseForbidden
from django.shortcuts import render, redirect, get_object_or_404
from rest_framework import status, generics
from rest_framework.decorators import permission_classes, api_view
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.status import HTTP_404_NOT_FOUND
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from store.models import Book, Comment, Review, Series
from .helpers import FollowerHelper
from django.core.files.storage import FileSystemStorage
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
import stripe

from .forms import UploadIllustrationForm, UploadTrailerForm
from .models import Achievement, Illustration, Trailer, Notification, Conversation, Message, \
    WebPageSettings, Library, EmailVerification, TemporaryRegistration, Wallet, StripeCustomer, \
    UsersNotificationSettings
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import *


class RegisterView(generics.CreateAPIView):
    serializer_class = CustomUserRegistrationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            # Extract validated data
            validated_data = serializer.validated_data

            # Generate a verification code
            verification_code = str(random.randint(1000, 9999))

            # Store the registration data temporarily
            temp_reg = TemporaryRegistration.objects.create(
                first_name=validated_data['first_name'],
                last_name=validated_data.get('last_name', ''),
                email=validated_data['email'],
                password=validated_data['password'],  # Password lives in temporary storage on server for 10 minutes
                dob_month=validated_data.get('dob_month'),
                dob_year=validated_data.get('dob_year'),
                verification_code=verification_code,
            )
            # Send verification email
            send_mail(
                'Verify your account',
                f'Your verification code is {verification_code}.',
                'from@example.com',  # Use your actual sender email address here
                [validated_data['email']],
                fail_silently=False,
            )

            # Return a response indicating that the user needs to verify their email
            return Response({'status': 'Please verify your email'}, status=status.HTTP_200_OK)

        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def generate_unique_username(base_username):
    # Generate a unique username using a base username and appending a random number
    username = f"{base_username}{random.randint(1000, 9999)}"
    while User.objects.filter(username=username).exists():
        username = f"{base_username}{random.randint(1000, 9999)}"
    return username


class VerifyRegistrationView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = VerificationCodeSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            code = serializer.validated_data['verification_code']

            try:
                temp_reg = TemporaryRegistration.objects.get(email=email, verification_code=code)
                if not temp_reg.is_expired:
                    # Generate a unique username using a utility function
                    base_username = temp_reg.first_name.lower()
                    unique_username = generate_unique_username(base_username)

                    # Create the actual User record
                    user = User.objects.create_user(
                        username=unique_username,
                        email=temp_reg.email,
                        password=temp_reg.password
                    )

                    # Set first and last names
                    user.first_name = temp_reg.first_name
                    user.last_name = temp_reg.last_name
                    user.save()

                    # Create or get the user's profile
                    profile, _ = Profile.objects.get_or_create(user=user)
                    # Set additional profile fields if needed

                    # Create or get the user's library
                    Library.objects.get_or_create(user=user)

                    print(f"DOB Year: {temp_reg.dob_year}, DOB Month: {temp_reg.dob_month}")
                    dob = date(year=temp_reg.dob_year, month=temp_reg.dob_month, day=1)
                    print(f"Constructed DOB: {dob}")

                    # Create or update WebPageSettings
                    WebPageSettings.objects.update_or_create(
                        profile=profile,
                        defaults={'date_of_birth': dob}
                    )

                    # Delete the temporary registration
                    temp_reg.delete()

                    return Response({'status': 'User registered successfully'}, status=status.HTTP_201_CREATED)
                else:
                    return Response({'error': 'Verification code expired'}, status=status.HTTP_400_BAD_REQUEST)
            except TemporaryRegistration.DoesNotExist:
                return Response({'error': 'Invalid verification details'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CustomUserLoginView(APIView):
    serializer_class = CustomUserLoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        user = authenticate(request, username=email, password=password)

        if user is not None:
            # Reset login attempt count on successful login
            request.session['login_attempts'] = 0
            token_serializer_data = {'username': email, 'password': password}
            token_serializer = MyTokenObtainPairSerializer(data=token_serializer_data)

            if token_serializer.is_valid():
                return Response(token_serializer.validated_data, status=status.HTTP_200_OK)
            else:
                return Response(token_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        else:
            # Increment login attempt count
            request.session['login_attempts'] = request.session.get('login_attempts', 0) + 1

            # Check if captcha is required
            if request.session['login_attempts'] > 1:
                return Response({'error': 'Invalid email or password. Please complete the captcha.'}, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({'error': 'Invalid email or password.'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def followers_list(request, username):
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    followers = FollowerHelper.get_followers(user)
    serializer = UserSerializer(followers, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def following_list(request, username):
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    following = FollowerHelper.get_following(user)
    serializer = UserSerializer(following, many=True)
    return Response(serializer.data)


class ProfileAPIView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request, username, format=None):
        profile_owner = get_object_or_404(User, username=username)
        if request.user in profile_owner.profile.blacklist.all():
            return Response({"detail": "You are not allowed to view this profile."}, status=status.HTTP_403_FORBIDDEN)

        user_profile = Profile.objects.get(user=profile_owner)
        profile_serializer = ProfileSerializer(user_profile, context={'request': request})

        context = {
            'user_profile': profile_serializer.data,
        }
        return Response(profile_serializer.data)

    def put(self, request, username, format=None):
        if request.user.username != username:
            return Response({"detail": "You do not have permission to edit this profile."},
                            status=status.HTTP_403_FORBIDDEN)

        user_profile = request.user.profile
        serializer = ProfileSerializer(user_profile, data=request.data, partial=True)  # Allow partial update

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def follow(request):
    if request.method == 'POST':
        follower_username = request.POST.get('follower', '')
        user_username = request.POST.get('user', '')
        try:
            follower = User.objects.get(username=follower_username)
            user = User.objects.get(username=user_username)
        except User.DoesNotExist:
            return redirect('/')

        if FollowerHelper.is_following(follower, user):
            FollowerHelper.unfollow(follower, user)
        else:
            FollowerHelper.follow(follower, user)

            notification = Notification(
                recipient=user.profile,
                sender=follower.profile,
                notification_type='follow'
            )
            print(f'Follower: {follower}, Profile: {follower.profile}, Username: {follower.profile.nickname}')
            print(f'User: {user}, Profile: {user.profile}, Username: {user.profile.nickname}')

            notification.save()

        return redirect('./profile/' + user_username)
    else:
        return redirect('/')


class AddToLibraryView(APIView):
    def post(self, request):
        user = request.user
        book_id = request.data.get('book_id')
        category = request.data.get('category')  # e.g., 'reading', 'wishlist'

        if not book_id or not category:
            return Response({'error': 'Missing book ID or category'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            book = Book.objects.get(id=book_id)
            library, _ = Library.objects.get_or_create(user=user)

            # Add book to the specified category
            getattr(library, f'{category}_books').add(book)
            return Response({'message': 'Book added successfully'}, status=status.HTTP_200_OK)

        except Book.DoesNotExist:
            return Response({'error': 'Book not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


def can_view_library(request_user, user):
    privacy = user.profile.library_privacy
    if privacy == "anyone":
        return True

    if privacy == "followers":
        followers = [follower.id for follower in FollowerHelper.get_followers(user)]
        return request_user.id in followers

    if privacy == "friends":
        friends = [friend.id for friend in FollowerHelper.get_friends(user)]
        return request_user.id in friends

    return False


def my_library_view(request, username):
    user = get_object_or_404(User, username=username)

    try:
        library = Library.objects.get(user=user)
    except Library.DoesNotExist:
        library = None

    user_profile = Profile.objects.get(user=user)
    if library and library.finished_books.count() >= 5:
        achievement = Achievement.objects.get(name='First steps')
        user_profile.achievements.add(achievement)

    show_library_link = True #can_view_library(request.user, user)
    print("show_library_link:", show_library_link)

    context = {
        'library': library,
        'show_library_link': show_library_link,
        'user_object': user,
    }

    return render(request, 'library.html', context)


@login_required(login_url='signin')
def delete_book_from_library(request, book_id):
    library = get_object_or_404(Library, user=request.user)
    book = get_object_or_404(Book, id=book_id)
    library.watchlist_books.remove(book)

    user_profile = Profile.objects.get(user=request.user)
    if library.finished_books.count() >= 5:
        achievement = Achievement.objects.get(name='First steps')
        user_profile.achievements.add(achievement)

    return redirect('library')


@api_view(['GET'])
def get_library_content(request, username):
    try:
        user = User.objects.get(username=username)
        library, created = Library.objects.get_or_create(user=user)
    except User.DoesNotExist:
        return Response({'error': 'User does not exist.'}, status=404)

    filter_by = request.query_params.get('filter_by')  # Add your filter logic here

    if filter_by == 'reading':
        books_qs = library.reading_books.all()
    elif filter_by == 'liked':
        books_qs = library.liked_books.all()
    elif filter_by == 'wish_list':
        books_qs = library.wish_list_books.all()
    elif filter_by == 'favorites':
        books_qs = library.favorites_books.all()
    elif filter_by == 'finished':
        books_qs = library.finished_books.all()
    else:
        books_qs = library.get_all_books()

    # Serialize the book data with request context
    books_serializer = LibraryBookSerializer(books_qs, many=True, context={'request': request})

    # Return the serialized book data in the response
    return Response(books_serializer.data)


@login_required(login_url='signin')
def get_comments_content(request, username):
    user_object = User.objects.get(username=username)
    user_comments = Comment.objects.filter(user=user_object)
    # Get the sorting parameter from the request GET parameters
    sort_by = request.GET.get('sort_by')

    # Retrieve the comments based on the sorting parameter
    if sort_by == 'newest':
        comments = user_comments.order_by('-timestamp')
    elif sort_by == 'oldest':
        comments = user_comments.order_by('timestamp')
    elif sort_by == 'popularity':
        comments = user_comments.annotate(num_likes=Count('likes')).order_by('-num_likes')
    else:
        comments = user_comments.all()

    # Check if the user has at least 5 comments
    if user_comments.count() >= 5:
        achievement = Achievement.objects.get(name='First Coms')
        user_profile = Profile.objects.get(user=request.user)
        user_profile.achievements.add(achievement)

    if user_comments.count() < 5:
        achievement = Achievement.objects.get(name='First Coms')
        user_profile = Profile.objects.get(user=request.user)
        user_profile.achievements.remove(achievement)

    # Get the total number of responses
    total_responses = Comment.objects.filter(parent_comment__in=comments).count()

    context = {
        'username': username,
        'comments': comments,
        'total_responses': total_responses,
    }
    return render(request, 'profile/comments.html', context)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_comments(request, username):
    try:
        user_object = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({'error': 'User does not exist.'}, status=HTTP_404_NOT_FOUND)

    user_comments = Comment.objects.filter(user=user_object)

    # Retrieve the comments based on the sorting parameter
    sort_by = request.query_params.get('sort_by')
    if sort_by == 'newest':
        comments = user_comments.order_by('-timestamp')
    elif sort_by == 'oldest':
        comments = user_comments.order_by('timestamp')
    elif sort_by == 'popularity':
        comments = user_comments.annotate(num_likes=Count('likes')).order_by('-num_likes')
    else:
        comments = user_comments.all()

    # Handle achievements logic as needed

    # Serialize the comment data
    comments_serializer = CommentSerializer(comments, many=True)

    # Get the total number of responses
    total_responses = Comment.objects.filter(parent_comment__in=comments).count()

    # Return the serialized comment data
    return Response({
        'username': username,
        'comments': comments_serializer.data,
        'total_responses': total_responses,
    })
# Тико, еще подумай что делать с parent comment-ом при удалении комментария(к примеру, парент коммент у мен был Андрей, но он удалил комментарий, что случается)
# Должно высвечиваться что комментарий удалён, соответственно, айди комментария остаётся, и только текст удаляется, и если текст удаляется
# То отображать что комментарий удалён (или узнать еще способы)
@api_view(['GET'])
def get_authored_books(request, username):
    try:
        user = User.objects.get(username=username)
        authored_books = Book.objects.filter(author=user)
    except User.DoesNotExist:
        return Response({'error': 'User does not exist.'}, status=404)

    # Serialize the book data with request context
    books_serializer = AuthoredBookSerializer(authored_books, many=True, context={'request': request})

    # Return the serialized book data in the response
    return Response(books_serializer.data)



@api_view(['GET'])
def get_user_series(request, username):
    try:
        user = User.objects.get(username=username)
        user_series = Series.objects.filter(author=user).prefetch_related('books')
    except User.DoesNotExist:
        return Response({'error': 'User does not exist.'}, status=404)

    # You can now serialize the series and include the books in each series using your SeriesBookSerializer
    series_serializer = SeriesSerializer(user_series, many=True, context={'request': request})

    return Response(series_serializer.data)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def update_profile_description(request, username):
    if request.user.username != username:
        return Response({'error': 'You do not have permission to access this profile.'}, status=status.HTTP_403_FORBIDDEN)

    profile = request.user.profile

    if request.method == 'GET':
        serializer = ProfileDescriptionSerializer(profile)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = ProfileDescriptionSerializer(profile, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Description updated successfully.'}, status=status.HTTP_200_OK)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



def get_achievements_content(request, username):
    user_object = get_object_or_404(User, username=username)
    user_profile = Profile.objects.get(user=user_object)
    achievements = user_profile.achievements.all()

    context = {
        'achievements': achievements,
    }
    return render(request, 'profile/achievements.html', context)


def achievements(request, username):
    user_profile = Profile.objects.get(user=username)
    achievements = user_profile.achievements.all()

    context = {
        'achievements': achievements,
    }

    return render(request, 'achievements.html', context)


def book_settings(request, book_id):
    from store.forms import BooksForm, BookTypeForm, SeriesForm, ChapterForm
    from store.models import Series, Book
    book = get_object_or_404(Book, id=book_id)

    if request.method == 'POST':
        book_form = BooksForm(data=request.POST, files=request.FILES, instance=book, user=request.user)
        if book_form.is_valid():
            book = book_form.save(commit=False)
            if 'series' in request.POST:  # Ensure the series field is present
                series_id = request.POST.get('series')  # Get the series id from POST data
                if series_id:  # if a series was selected
                    series = Series.objects.get(id=series_id)  # Get the series instance
                    book.series = series  # Set the book's series to the selected series
                else:  # If no series was selected (i.e., the series_id is an empty string)
                    book.series = None
            book.save()

    else:
        book_form = BooksForm(instance=book, user=request.user)

    # Instantiate other forms
    book_type_form = BookTypeForm()
    series_form = SeriesForm()
    illustration_form = UploadIllustrationForm()
    trailer_form = UploadTrailerForm()
    chapter_form = ChapterForm()  # Instantiate the ChapterForm

    # Fetch all illustration and trailer links
    illustrations = Illustration.objects.all()
    trailers = Trailer.objects.all()

    # Fetch all series related to the current user
    user_series = Series.objects.filter(author=request.user)

    # Include all forms and data in context
    context = {
        'book_form': book_form,
        'illustration_form': illustration_form,
        'trailer_form': trailer_form,
        'illustrations': illustrations,
        'trailers': trailers,
        'book_type_form': book_type_form,
        'series_form': series_form,
        'user_series': user_series,  # Include user_series in the context
        'chapter_form': chapter_form,  # Include the ChapterForm in the context
    }

    return render(request, 'settings/book_settings.html', context)


class WebPageSettingsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        try:
            profile = request.user.profile
            webpage_settings = WebPageSettings.objects.get(profile=profile)
        except WebPageSettings.DoesNotExist:
            return Response({'error': 'WebPageSettings not found.'}, status=404)

        serializer = WebPageSettingsSerializer(webpage_settings)
        return Response(serializer.data)

    def put(self, request, *args, **kwargs):
        print(request.data)
        profile = request.user.profile
        webpage_settings = WebPageSettings.objects.get(profile=profile)
        serializer = WebPageSettingsSerializer(webpage_settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        else:
            return Response(serializer.errors, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_temp_profile_image(request):
    if 'profile_img' in request.FILES:
        profile_img = request.FILES['profile_img']
        fs = FileSystemStorage(location='/path/to/temp/storage')  # Specify your temp storage
        filename = fs.save(profile_img.name, profile_img)
        uploaded_file_url = fs.url(filename)

        # Optionally, store this temp file info in the session or a temporary field
        request.session['temp_profile_img_path'] = fs.path(filename)

        return Response({'temp_img_url': uploaded_file_url})
    return Response({'error': 'No file uploaded.'}, status=400)


class NotificationSettingsAPIView(generics.RetrieveUpdateAPIView):
    serializer_class = NotificationSettingSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        # Ensure that a NotificationSetting instance exists for the user
        obj, created = NotificationSetting.objects.get_or_create(user=self.request.user)
        return obj


class NotificationsAPIView(APIView):
    def get(self, request, *args, **kwargs):
        user = request.user
        notifications = Notification.objects.filter(recipient=user.profile)
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)


class UserNotificationSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        settings = UsersNotificationSettings.objects.get(user=request.user)
        serializer = UserNotificationSettingsSerializer(settings)
        return Response(serializer.data)

    def put(self, request):
        settings = UsersNotificationSettings.objects.get(user=request.user)
        serializer = UserNotificationSettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def read_notification(request, notification_id):
    notification = get_object_or_404(Notification, id=notification_id, recipient=request.user.profile)
    notification.read = True
    notification.save()
    return Response({'status': 'Notification marked as read'})


@api_view(['GET'])
def notification_count(request):
    count = request.user.profile.unread_notification_count()
    return Response({"unread_count": count})
                                                # Тут я удалил старые нотификации, так как еще незатестил её поэтому оставил их


def notify_users_of_new_chapter(book): # Функция для оповещения пользователей о новой главе NEWS
    new_chapter_count = book.chapters.filter(published=True).count()  # Assuming you have a published field on your chapter model

    # Identify users based on their preferences and relation to the book
    interested_users = User.objects.filter(
        Q(library__reading_books=book, notification_settings__notify_reading=True) |
        Q(library__liked_books=book, notification_settings__notify_liked=True) |
        Q(library__wish_list_books=book, notification_settings__notify_wishlist=True) |
        Q(library__favorites_books=book, notification_settings__notify_favorites=True),
        notification_settings__chapter_notification_threshold__lte=new_chapter_count
    ).distinct()

    # Create notifications for these users
    for user in interested_users:
        Notification.objects.create(
            recipient=user.profile,
            notification_type='book_update',
            book=book
        )


def notify_author_followers(author, update_type, book=None):
    followers = User.objects.filter(following__user=author)

    for follower in followers:
        Notification.objects.create(
            recipient=follower.profile,
            sender=author.profile,
            notification_type='author_update',
            book=book,  # Optional: Include the book if the update is related to a specific book
            message=f"{author.username} has a new {update_type}."  # Customize the message as needed
        )


'''
def notifications(request):
    # get all unread notifications
    notifications = Notification.objects.filter(recipient=request.user.profile, read=False)
    return render(request, 'notifications/notifications.html', {'notifications': notifications})
def read_notification(request, notification_id):
    # Retrieve the notification by id or return 404 if not found
    notification = get_object_or_404(Notification, id=notification_id)

    # Check if the logged-in user is the recipient of the notification
    if request.user.profile == notification.recipient:
        notification.read = True
        notification.save()

    # Redirect back to the notifications page
    return redirect('notifications')
@login_required(login_url='signin')
def notification_count(request):
    count = request.user.profile.unread_notification_count()
    return JsonResponse({"unread_count": count})
'''


class PrivacySettingsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user_profile = request.user.profile
        serializer = PrivacySettingsSerializer(user_profile)
        return Response(serializer.data)

    def put(self, request, *args, **kwargs):
        user_profile = request.user.profile
        serializer = PrivacySettingsSerializer(user_profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)


def privacy_settings(request):
    if request.method == "POST":
        auto_add_reading = request.POST.get('auto_add_reading') == 'true'  # Get value from select dropdown
        request.user.profile.auto_add_reading = auto_add_reading
        request.user.profile.save()

    if request.method == "POST":
        library_privacy = request.POST.get('see_my_library')
        request.user.profile.library_privacy = library_privacy
        request.user.profile.save()

    return render(request, 'settings/privacy.html')


def add_to_blacklist(request, username):
    user_to_blacklist = get_object_or_404(User, username=username)
    request.user.profile.blacklist.add(user_to_blacklist)
    return redirect('profile', username=username)


def remove_from_blacklist(request, username):
    user_to_remove = get_object_or_404(User, username=username)
    request.user.profile.blacklist.remove(user_to_remove)
    return redirect('profile', username=username)


def blacklist(request):
    blacklisted_users = request.user.profile.blacklist.all()
    return render(request, 'settings/blacklist.html', {'blacklisted_users': blacklisted_users})


def reviews(request):
    user_reviews = Review.objects.filter(author=request.user)
    return render(request, 'settings/reviews_settings.html', {'user_reviews': user_reviews})


def social(request):
    user_object = request.user
    friends = FollowerHelper.get_friends(user_object)
    followers = FollowerHelper.get_followers(user_object)
    following = FollowerHelper.get_following(user_object)

    context = {
        'friends': friends,
        'followers': followers,
        'following': following,
    }
    return render(request, 'settings/social.html', context)


def my_books(request):
    my_authored_books = Book.objects.filter(
        Q(author=request.user) | Q(co_author=request.user) | Q(co_author2=request.user))

    for book in my_authored_books:
        book.comment_count = Comment.objects.filter(book=book).count()
        book.review_count = Review.objects.filter(book=book).count()
        finished_users = Library.objects.filter(finished_books__in=[book]).count()
        reading_users = Library.objects.filter(reading_books__in=[book]).count()
        book.in_library_users = reading_users + finished_users
        book.character_count = sum([len(chapter.content) for chapter in book.chapters.all()])

    context = {
        'my_authored_books': my_authored_books,
    }

    return render(request, 'settings/my_books.html', context)


def my_account(request):
    return render(request, 'settings/my_account.html')


def my_series(request):
    # Assuming you want to show series of the currently logged-in user
    user = request.user
    user_series = Series.objects.filter(author=user)

    return render(request, 'settings/my_series.html', {'user_series': user_series})


def security(request):
    print("Check1")
    if request.method == 'POST':
        print("Check2")
        if 'change_password' in request.POST:
            print("Check3")
            old_password = request.POST.get('old_password')
            new_password = request.POST.get('new_password')
            confirm_password = request.POST.get('confirm_password')

            if old_password and new_password and confirm_password:
                print("Check4")
                user = authenticate(request, username=request.user.username, password=old_password)
                if user is None:
                    print("Check5")
                    messages.error(request, 'Old password is incorrect')
                elif new_password != confirm_password:
                    print("Check6")
                    messages.error(request, 'New password and confirmation password do not match')
                else:
                    print("Check7")
                    user.set_password(new_password)
                    user.save()
                    login(request, user)  # log user back in since their session was invalidated due to password change
                    messages.success(request, 'Password updated successfully')
            else:
                print("Check8")
                messages.error(request, 'Please fill all the fields')

    return render(request, 'settings/security.html')


def purchase_history(request):
    return render(request, 'settings/purchase_history.html')


def conversation_view(request, user_id):
    other_user = get_object_or_404(User, id=user_id)

    # get conversation if it exists, or create it if it doesn't exist yet
    conversation = Conversation.objects.filter(participants=request.user).filter(participants=other_user).first()
    if conversation is None:
        conversation = Conversation.objects.create()
        conversation.participants.add(request.user, other_user)

    if request.method == 'POST':
        text = request.POST.get('message')
        if text:  # this is equivalent to form.is_valid()
            Message.objects.create(sender=request.user, conversation=conversation, text=text)
            return redirect('conversation', user_id=other_user.id)

    messages = Message.objects.filter(conversation=conversation)
    return render(request, 'messages/conversation.html', {'messages': messages, 'other_user': other_user})


def messages_list_view(request):
    conversations = Conversation.objects.filter(participants=request.user)
    return render(request, 'messages/messages_list.html', {'conversations': conversations})


def delete_message(request, message_id):
    message = get_object_or_404(Message, id=message_id)

    # only allow a user to delete their own messages
    if message.sender != request.user:
        return HttpResponseForbidden()

    message.delete()
    return redirect('conversation', user_id=message.conversation.get_other_user(request.user).id)


def delete_conversation(request, user_id):
    other_user = get_object_or_404(User, id=user_id)
    conversation = get_object_or_404(Conversation, participants__in=[request.user, other_user])
    conversation.delete()
    return redirect('messages_list')


def validate_username(username):
    # Length should be more than 4 characters and less than 33
    if not (3 < len(username) < 33):
        return False, "Username must be between 4 and 32 characters long."

    # No more than 2 digits at the beginning
    if re.match(r"^\d{3,}", username):
        return False, "Username must not have more than 2 digits at the beginning."

    # Should not start or end with an underscore
    if username.startswith('_') or username.endswith('_'):
        return False, "Username must not start or end with an underscore."

    # Should not contain two consecutive underscores
    if '__' in username:
        return False, "Username must not contain consecutive underscores."

    if not re.match(r"^[A-Za-z0-9_.]+$", username):
        return False, "Username must only contain letters, digits, underscores, or dots."

    if '.' in username:
        if username.endswith('.'):
            return False, "Username must not end with a dot."
        if username.startswith('.'):
            return False, "Username must not start with a dot."
        if '.' in username[1:-1]:  # Checking for a dot not at the first or last character
            parts = username.split('.')
            # Ensure the parts around dots have at least three characters
            for part in parts[1:]:  # Skip the first part because a dot at the start is okay
                if len(part) < 3:
                    return False, "There must be at least 3 characters between dots."

    return True, "Username is valid."


def send_verification_email(user, code):
    # Update or create the EmailVerification record with the provided code
    EmailVerification.objects.update_or_create(
        user=user,
        defaults={
            'verification_code': code,
            'verified': False
        }
    )

    email_subject = 'Your Password Change Verification Code'
    email_body = f'Your verification code for changing your password is: {code}'

    send_mail(
        email_subject,
        email_body,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )


'''
class VerificationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        code = request.data.get('code')
        verification_type = request.data.get('verification_type')
        user = request.user
        verification_instance = EmailVerification.objects.get(user=user)

        if verification_instance.verification_code == code and not verification_instance.verified:
          #  if verification_type == 'email_change':             Закомментил возможность менять Эмейл
          #      user.email = verification_instance.new_email
          #      user.save()
            if verification_type == 'password_change':
                new_password = request.data.get('new_password')
                user.set_password(new_password)
                user.save()

            verification_instance.verified = True
            verification_instance.save()
            return Response({'status': f'{verification_type} updated successfully'}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Invalid verification code'}, status=status.HTTP_400_BAD_REQUEST)
'''


class PasswordChangeRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeRequestSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = request.user
            new_password = serializer.validated_data['new_password']  # Store it in plain text
            code = str(random.randint(100000, 999999))
            TemporaryPasswordStorage.create_for_user(user, new_password, code)
            send_verification_email(user, code)
            return Response({'status': 'Verification code sent.'}, status=200)
        return Response(serializer.errors, status=400)


class PasswordChangeVerificationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = PasswordChangeVerificationSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = request.user
            temp_storage = TemporaryPasswordStorage.objects.get(user=user)
            if not temp_storage.is_expired:
                plain_new_password = temp_storage.hashed_new_password  # Retrieve the plain new password

                user.set_password(plain_new_password)  # This will hash the password
                user.save()
                temp_storage.delete()

                # Verifying if the new password works
                if authenticate(username=user.username, password=plain_new_password):
                    # Now using the plain new password for verification
                    return Response({'status': 'Password updated successfully'}, status=200)
                else:
                    return Response({'error': 'New password verification failed'}, status=400)
            else:
                return Response({'error': 'Verification code expired'}, status=400)
        return Response(serializer.errors, status=400)


class DepositView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        stripe.api_key = settings.STRIPE_SECRET_KEY_TEST
        amount = request.data.get('amount')
        if not amount:
            return Response({'error': 'Amount is required'}, status=400)

        amount_in_cents = int(float(amount) * 100)
        profile = request.user.profile
        wallet = get_object_or_404(Wallet, profile=profile)

        # Ensure Stripe customer exists for the user
        stripe_customer, created = StripeCustomer.objects.get_or_create(user=request.user)
        if not stripe_customer.stripe_customer_id:
            customer = stripe.Customer.create(email=request.user.email)
            stripe_customer.stripe_customer_id = customer.id
            stripe_customer.save()

        try:
            # Create a Stripe Checkout Session
            checkout_session = stripe.checkout.Session.create(
                customer=stripe_customer.stripe_customer_id,
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'usd',
                        'unit_amount': amount_in_cents,
                        'product_data': {
                            'name': f'Deposit into Wallet for {profile.user.username}',
                        },
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=settings.REDIRECT_DOMAIN + '/users/payment_successful?session_id={CHECKOUT_SESSION_ID}',
                cancel_url=settings.REDIRECT_DOMAIN + '/users/payment_cancelled',
                metadata={'initiating_user_id': request.user.id},  # Include initiating user's ID in metadata
            )

            return Response({'url': checkout_session.url})
        except Exception as e:
            return Response({'error': str(e)}, status=400)


class WithdrawView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        amount = request.data.get('amount')
        profile = request.user.profile
        wallet = get_object_or_404(Wallet, profile=profile)
        if wallet.withdraw(amount):
            return Response({'message': 'Withdrawal successful'})
        else:
            return Response({'error': 'Insufficient funds'}, status=400)


class TransactionHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = request.user.profile
        wallet = get_object_or_404(Wallet, profile=profile)
        transactions = WalletTransaction.objects.filter(wallet=wallet)
        serializer = WalletTransactionSerializer(transactions, many=True)
        return Response(serializer.data)


def payment_successful(request):
    stripe.api_key = settings.STRIPE_SECRET_KEY_TEST
    session_id = request.GET.get('session_id')

    try:
        session = stripe.checkout.Session.retrieve(session_id)
        initiating_user_id = session.metadata.get('initiating_user_id')

        # Assuming you can get the profile directly from the initiating_user_id
        # Note: Adjust this logic if you have a different way to associate profiles with user IDs
        profile = Profile.objects.get(user_id=initiating_user_id)

        amount = Decimal(session.amount_total) / Decimal(100)  # Convert cents to dollars as Decimal

        wallet, created = Wallet.objects.get_or_create(profile=profile)
        wallet.balance += amount
        wallet.save()

        response_data = {
            "message": f"Hello {profile.user.username}, you successfully added ${amount} to your wallet. Now you have a balance of ${wallet.balance}."
        }
        return JsonResponse(response_data)

    except Profile.DoesNotExist:
        return JsonResponse({"error": "Profile not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


def payment_failed(request):
    return JsonResponse({
        'message': "Something went wrong! Please try again."
    })


@csrf_exempt
def stripe_webhook(request):
    stripe.api_key = settings.STRIPE_SECRET_KEY_TEST
    endpoint_secret = settings.STRIPE_WEBHOOK_SECRET_TEST  # Set this in your Django settings

    payload = request.body
    sig_header = request.META['HTTP_STRIPE_SIGNATURE']

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        )
    except ValueError as e:
        return JsonResponse({'status': 'invalid payload'}, status=400)
    except stripe.error.SignatureVerificationError as e:
        return JsonResponse({'status': 'invalid signature'}, status=400)

    # Handle the event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        # Retrieve the user from your database
        user_id = session.metadata.user_id  # Ensure you send the user ID in the metadata when creating the session
        user = User.objects.get(id=user_id)

        # Calculate the amount and update the user's wallet
        amount = session.amount_total / 100  # Convert to dollars
        wallet, created = Wallet.objects.get_or_create(user=user)
        wallet.balance += amount
        wallet.save()

        return JsonResponse({'status': 'success'})

    # ... handle other event types as needed

    return JsonResponse({'status': 'Unhandled event type'}, status=200)

