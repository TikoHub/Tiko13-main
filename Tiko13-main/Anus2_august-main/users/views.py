import uuid
from datetime import datetime, timedelta, timezone

from django.db import transaction
import random
import re

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
from rest_framework_jwt.settings import api_settings
from store.models import Book, Comment, Review, Series
from .helpers import FollowerHelper

from .forms import UploadIllustrationForm, UploadTrailerForm
from .models import Achievement, Illustration, Trailer, Notification, Conversation, Message, \
    WebPageSettings, Library, EmailVerification
from .serializers import *


class RegisterView(generics.CreateAPIView):
    serializer_class = CustomUserRegistrationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            with transaction.atomic():
                # Extract validated data
                validated_data = serializer.validated_data

                # Generate a unique username
                base_username = validated_data['first_name'].lower()
                username = f"{base_username}{random.randint(1000, 9999)}"

                # Ensure the username is unique
                while User.objects.filter(username=username).exists():
                    username = f"{base_username}{random.randint(1000, 9999)}"

                # Create the user instance
                user = User.objects.create_user(
                    username=username,
                    email=validated_data['email'],
                    password=validated_data['password'],
                )

                # Create the profile, library, and webpage_settings
                profile, _ = Profile.objects.get_or_create(user=user)
                WebPageSettings.objects.get_or_create(profile=profile)
                Library.objects.get_or_create(user=user)

                # Set optional fields if provided
                user.first_name = validated_data.get('first_name', '')
                user.last_name = validated_data.get('last_name', '')
                user.save()

                # Set date of birth if provided
                dob_month = validated_data.get('date_of_birth_month')
                dob_year = validated_data.get('date_of_birth_year')
                if dob_month and dob_year:
                    profile.dob_month = dob_month
                    profile.dob_year = dob_year
                    profile.save()

                verification_code = random.randint(1000, 9999)
                # Сюда можно добавить респонс
                send_mail(
                    'Verify your account',
                    f'Your verification code is {verification_code}.',
                    'from@example.com',  # Use your actual sender email address here
                    [validated_data['email']],
                    fail_silently=False,
                )
                # Save the verification code to the user's profile or a related model
                # profile.verification_code = verification_code
                # profile.save()

                # Return a response indicating that the user needs to verify their email
                return Response({'status': 'User created, please verify your email'}, status=status.HTTP_201_CREATED)

        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


jwt_payload_handler = api_settings.JWT_PAYLOAD_HANDLER
jwt_encode_handler = api_settings.JWT_ENCODE_HANDLER


class CustomUserLoginView(APIView):
    serializer_class = CustomUserLoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']

            user = authenticate(username=email, password=password)
            if user:
                payload = jwt_payload_handler(user)
                payload['token_type'] = 'access'
                payload['jti'] = str(uuid.uuid4())
                payload['iat'] = datetime.now(timezone.utc)
                payload['exp'] = datetime.now(timezone.utc) + timedelta(days=7)
                token = jwt_encode_handler(payload)
                return Response({'token': token})
            else:
                return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



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


def add_to_library(request, book_id, category):
    if request.user.is_authenticated:
        book = Book.objects.get(pk=book_id)
        my_library, created = Library.objects.get_or_create(user=request.user)

        # Remove the book from other categories if it exists
        my_library.reading_books.remove(book)
        my_library.watchlist_books.remove(book)
        my_library.finished_books.remove(book)

        if category == 'reading':
            my_library.reading_books.add(book)
        elif category == 'watchlist':
            my_library.watchlist_books.add(book)
        elif category == 'finished':
            my_library.finished_books.add(book)

    return redirect('library', username=request.user.username)


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

    filter_by = request.query_params.get('filter_by')     #Filter Takumi позже решить + проверить

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

    # Serialize the book data
    books_serializer = LibraryBookSerializer(books_qs, many=True)

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

    # Serialize the book data
    books_serializer = AuthoredBookSerializer(authored_books, many=True)

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


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile_description(request, username):
    profile = request.user.profile
    description = request.data.get('description', '')

    # Optionally, validate the description content here

    profile.description = description
    profile.save()
    return Response({'message': 'Description updated successfully.'}, status=status.HTTP_200_OK)




def get_achievements_content(request, username):
    user_object = get_object_or_404(User, username=username)
    user_profile = Profile.objects.get(user=user_object)
    achievements = user_profile.achievements.all()

    context = {
        'achievements': achievements,
    }
    return render(request, 'profile/achievements.html', context)


def get_profile_content(request, username):
    user_object = get_object_or_404(User, username=username)
    user_profile = Profile.objects.get(user=user_object)

    context = {
        'user_profile': user_profile,
    }

    return render(request, 'profile/profile.html', context)


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


def upload_illustration(request):
    if request.method == 'POST':
        form = UploadIllustrationForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            return redirect('../settings/book_settings')
    else:
        form = UploadIllustrationForm()
    return render(request, 'settings/book_settings.html', {'form': form})


def upload_trailer(request):
    if request.method == 'POST':
        form = UploadTrailerForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, 'Your trailer link was uploaded successfully.')
            return redirect('../settings/book_settings')
    else:
        form = UploadTrailerForm()
    return render(request, 'settings/book_settings.html', {'form': form})


def display_illustrations(request):
    illustrations = Illustration.objects.all()
    return render(request, 'settings/display_illustrations.html', {'illustrations': illustrations})


def delete_illustration(request, illustration_id):
    if request.method == 'POST':  # Make sure the method is POST to prevent accidental deletions
        illustration = get_object_or_404(Illustration, id=illustration_id)
        illustration.image.delete(save=True)  # This also deletes the file from the file system
        illustration.delete()
    return redirect('display_illustrations')


def delete_trailer(request, trailer_id):
    trailer = get_object_or_404(Trailer, id=trailer_id)
    if request.method == 'POST':
        trailer.delete()
        messages.success(request, 'The trailer has been deleted successfully.')
        return redirect('book_settings')


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


def main_settings(request):
    return render(request, 'settings/main_settings.html')


def settings_notifications(request):
    return render(request, 'settings/notifications.html')


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


def send_verification_email(user, verification_type, new_email=None):
    verification_code = str(random.randint(1000, 9999))

    EmailVerification.objects.update_or_create(
        user=user,
        defaults={
            'verification_code': verification_code,
            'verified': False,
           # 'verification_type': verification_type,
           # 'new_email': new_email if verification_type == 'email_change' else None
        }
    )

    email_subject = 'Your Verification Code'
    email_body = f'Your verification code is: {verification_code}'

   # if verification_type == 'email_change':            Закомментил возможность менять эмейл
   #     email_subject = 'Your Email Change Verification Code'
   #     email_body = f'Your verification code for changing your email is: {verification_code}'
    if verification_type == 'password_change':
        email_subject = 'Your Password Change Verification Code'
        email_body = f'Your verification code for changing your password is: {verification_code}'

    send_mail(
        email_subject,
        email_body,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )


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
