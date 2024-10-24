import os
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
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
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
import requests
from .utils import generate_unique_username, TemporaryStorage
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.urls import reverse
from django.utils.encoding import force_bytes

from .models import Achievement, Notification, Conversation, Message, \
    WebPageSettings, Library, EmailVerification, Wallet, StripeCustomer, \
    UsersNotificationSettings, VerificationCode

from .serializers import *


class RegisterView(generics.CreateAPIView):
    serializer_class = CustomUserRegistrationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        self.send_verification_code(user)
        return Response({'status': 'Пользователь успешно зарегистрирован. Пожалуйста, подтвердите свой email.'}, status=status.HTTP_201_CREATED)

    def send_verification_code(self, user):
        code = str(random.randint(1000, 9999))
        # Сохраняем код в VerificationCode
        VerificationCode.objects.create(user=user, code=code)
        # Отправляем код на email
        subject = 'Код подтверждения регистрации'
        message = f'Ваш код подтверждения: {code}'
        send_mail(subject, message, 'from@example.com', [user.email])


class ResendVerificationCodeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Необходимо указать email.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email=email)
            if user.is_active:
                return Response({'error': 'Учетная запись уже активирована.'}, status=status.HTTP_400_BAD_REQUEST)
            # Генерируем новый код и отправляем
            code = str(random.randint(1000, 9999))
            VerificationCode.objects.update_or_create(user=user, defaults={'code': code, 'created_at': timezone.now()})
            subject = 'Новый код подтверждения регистрации'
            message = f'Ваш новый код подтверждения: {code}'
            send_mail(subject, message, 'from@example.com', [user.email])
            return Response({'status': 'Новый код отправлен на ваш email.'}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({'error': 'Пользователь с таким email не найден.'}, status=status.HTTP_400_BAD_REQUEST)


class VerifyEmailCodeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')
        if not email or not code:
            return Response({'error': 'Необходимо указать email и код.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email=email)
            verification_code = VerificationCode.objects.get(user=user, code=code)
            if verification_code.is_expired:
                return Response({'error': 'Код истек. Пожалуйста, запросите новый код.'}, status=status.HTTP_400_BAD_REQUEST)
            user.is_active = True
            user.save()
            verification_code.delete()  # Удаляем использованный код
            return Response({'status': 'Email успешно подтвержден.'}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({'error': 'Пользователь с таким email не найден.'}, status=status.HTTP_400_BAD_REQUEST)
        except VerificationCode.DoesNotExist:
            return Response({'error': 'Неверный код подтверждения.'}, status=status.HTTP_400_BAD_REQUEST)


class ActivateAccountView(APIView):
    def get(self, request, uidb64, token):
        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = get_object_or_404(User, pk=uid)
        except (TypeError, ValueError, OverflowError):
            user = None

        if user is not None and default_token_generator.check_token(user, token):
            user.is_active = True
            user.save()
            return Response({'status': 'Аккаунт успешно активирован'}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Неверная ссылка активации или она уже была использована.'}, status=status.HTTP_400_BAD_REQUEST)


class CustomUserLoginView(APIView):
    serializer_class = CustomUserLoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email'].lower()  # Преобразование email в нижний регистр
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


@api_view(['POST'])
def forgot_password(request):
    captcha_response = request.data.get('captcha')
    # Verify CAPTCHA using the secret key from settings
    data = {
        'secret': settings.RECAPTCHA_SECRET_KEY,
        'response': captcha_response
    }
    r = requests.post('https://www.google.com/recaptcha/api/siteverify', data=data)
    result = r.json()
    if not result.get('success'):
        return Response({"error": "Invalid CAPTCHA"}, status=status.HTTP_400_BAD_REQUEST)

    # Generate the 6-digit code
    code = str(random.randint(1000, 9999))

    # Attempt to get the user by email
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"error": "Email not found."}, status=status.HTTP_404_NOT_FOUND)

    # Send the verification email
    send_verification_email(user, code)

    return Response({"message": "Verification code sent to your email."})


@api_view(['GET'])
def followers_list(request, username):
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    followers = FollowerHelper.get_followers(user)
    serializer = UserSerializer(followers, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
def following_list(request, username):
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    following = FollowerHelper.get_following(user)
    serializer = UserSerializer(following, many=True, context={'request': request})
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


class FollowView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, username):
        user_to_follow = get_object_or_404(User, username=username)
        follower = request.user

        if FollowerHelper.is_following(follower, user_to_follow):
            FollowerHelper.unfollow(follower, user_to_follow)
            message = f"You stopped following {username}."
        else:
            FollowerHelper.follow(follower, user_to_follow)
            message = f"You are now following {username}."

        return Response({"message": message}, status=status.HTTP_200_OK)


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
        profile = user.profile
    except (User.DoesNotExist, Library.DoesNotExist):
        return Response({'error': 'User or library does not exist.'}, status=404)

    # Check library visibility
    if profile.library_visibility == 'private':
        if request.user != user:
            return Response({'error': 'This library is private.'}, status=403)
    elif profile.library_visibility == 'followers':
        if request.user != user and not user.followers.filter(id=request.user.id).exists():
            return Response({'error': 'This library is visible only to followers.'}, status=403)

    filter_by = request.query_params.get('filter_by')

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

    books_serializer = LibraryBookSerializer(books_qs, many=True, context={'request': request})
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
def get_user_reviews(request, username):
    user = get_object_or_404(User, username=username)
    reviews = Review.objects.filter(author=user)
    serializer = ReviewSerializer(reviews, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


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
    profile = get_object_or_404(Profile, user__username=username)

    if request.method == 'GET':
        serializer = ProfileDescriptionSerializer(profile)
        return Response(serializer.data)

    elif request.method == 'PUT':
        if request.user.username != username:
            return Response({'error': 'You do not have permission to edit this profile.'},
                            status=status.HTTP_403_FORBIDDEN)

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


'''class WebPageSettingsAPIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)  # Add parsers for file upload

    def get(self, request, *args, **kwargs):
        profile = request.user.profile
        webpage_settings = get_object_or_404(WebPageSettings, profile=profile)
        serializer = WebPageSettingsSerializer(webpage_settings)
        return Response(serializer.data)

    def put(self, request, *args, **kwargs):
        profile = request.user.profile
        webpage_settings = WebPageSettings.objects.get(profile=profile)
        serializer = WebPageSettingsSerializer(webpage_settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        else:
            return Response(serializer.errors, status=400)


class UserUpdateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        serializer = CustomUserSerializer(user)
        return Response(serializer.data)

    def put(self, request, *args, **kwargs):
        profile = request.user.profile
        webpage_settings = WebPageSettings.objects.get(profile=profile)
        serializer = WebPageSettingsSerializer(webpage_settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        else:
            print(serializer.errors)  # Выводим ошибки в консоль
            return Response(serializer.errors, status=400)'''


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_temp_profile_image(request):
    if 'profileimg' in request.FILES:
        profile_img = request.FILES['profileimg']
        fs = TemporaryStorage(location=os.path.join(settings.MEDIA_ROOT, 'tmp', 'profile_img'),
                              base_url=os.path.join(settings.MEDIA_URL, 'tmp', 'profile_img/'))
        filename = fs.save(profile_img.name, profile_img)
        uploaded_file_url = fs.url(filename)

        # Возвращаем путь к временному файлу
        return Response({
            'temp_img_url': uploaded_file_url,
            'temp_img_path': fs.path(filename)
        })
    return Response({'error': 'No file uploaded.'}, status=400)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_temp_banner_image(request):
    if 'banner_image' in request.FILES:
        banner_img = request.FILES['banner_image']
        fs = TemporaryStorage(location=os.path.join(settings.MEDIA_ROOT, 'tmp', 'banner'),
                              base_url=os.path.join(settings.MEDIA_URL, 'tmp', 'banner/'))
        filename = fs.save(banner_img.name, banner_img)
        uploaded_file_url = fs.url(filename)

        # Возвращаем путь к временному файлу
        return Response({
            'temp_img_url': uploaded_file_url,
            'temp_img_path': fs.path(filename)
        })
    return Response({'error': 'No file uploaded.'}, status=400)


class UserProfileSettingsAPIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get(self, request, *args, **kwargs):
        profile = request.user.profile
        webpage_settings, _ = WebPageSettings.objects.get_or_create(profile=profile)
        serializer = UserProfileSettingsSerializer(webpage_settings)
        return Response(serializer.data)

    def put(self, request, *args, **kwargs):
        print("request.FILES:", request.FILES)
        print("request.data:", request.data)

        profile = request.user.profile
        webpage_settings, _ = WebPageSettings.objects.get_or_create(profile=profile)
        serializer = UserProfileSettingsSerializer(webpage_settings, data=request.data, partial=True)

        temp_profile_img_path = request.data.get('temp_profile_img_path')
        temp_banner_img_path = request.data.get('temp_banner_img_path')

        import os
        from django.core.files import File

        if temp_profile_img_path and os.path.exists(temp_profile_img_path):
            with open(temp_profile_img_path, 'rb') as f:
                profile.profileimg.save(os.path.basename(temp_profile_img_path), File(f))
            os.remove(temp_profile_img_path)

        if temp_banner_img_path and os.path.exists(temp_banner_img_path):
            with open(temp_banner_img_path, 'rb') as f:
                profile.banner_image.save(os.path.basename(temp_banner_img_path), File(f))
            os.remove(temp_banner_img_path)

        profile.save()

        if serializer.is_valid():
            serializer.save()
            return Response({'status': 'Settings updated successfully'})
        else:
            print(serializer.errors)  # Для отладки
            return Response(serializer.errors, status=400)


class NotificationSettingsAPIView(generics.RetrieveUpdateAPIView):
    serializer_class = NotificationSettingSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        # Ensure that a NotificationSetting instance exists for the user
        obj, created = NotificationSetting.objects.get_or_create(user=self.request.user)
        return obj


class UpdateNotificationSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        serializer = NotificationSettingSerializer(data=request.data)

        if serializer.is_valid():
            # Assuming the NotificationSetting model has a OneToOne relation with User
            notification_settings, created = NotificationSetting.objects.get_or_create(user=user)
            # Update the instance with validated data
            for attr, value in serializer.validated_data.items():
                setattr(notification_settings, attr, value)
            notification_settings.save()

            return Response({'message': 'Settings updated successfully'}, status=status.HTTP_200_OK)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserNotificationSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        settings = UsersNotificationSettings.objects.get(user=request.user)
        serializer = UserNotificationSettingsSerializer(settings)
        return Response(serializer.data)

    def patch(self, request):
        settings, created = UsersNotificationSettings.objects.get_or_create(user=request.user)
        serializer = UserNotificationSettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserNotificationsAPIView(APIView):
    def get(self, request, username, *args, **kwargs):
        user = get_object_or_404(User, username=username)

        # Ensure the authenticated user is the same as the user whose notifications are being requested
        if request.user != user:
            return Response({'error': 'You do not have permission to access these notifications.'},
                            status=status.HTTP_403_FORBIDDEN)

        notifications = Notification.objects.filter(recipient=user.profile).order_by('-timestamp')
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)


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


def notify_users_of_new_chapter(book):
    # Retrieve the latest published chapter
    new_chapter = book.chapters.filter(published=True).order_by('-created').first()
    new_chapter_count = book.chapters.filter(published=True).count()

    if new_chapter is None:
        return  # If no chapter is found or none are published, exit the function

    new_chapter_title = new_chapter.title

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
            book=book,
            chapter=new_chapter,  # Now include the chapter in the notification
            message=f"{book.name}: {new_chapter_title} has been added."
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


class TokenCheckView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # If the token is valid, the request will have a user associated with it
        return Response({
            'is_authenticated': True,
            'user_id': request.user.id,
            'username': request.user.username
        })


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


'''class WithdrawView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        amount = request.data.get('amount')
        profile = request.user.profile
        wallet = get_object_or_404(Wallet, profile=profile)
        if wallet.withdraw(amount):
            return Response({'message': 'Withdrawal successful'})
        else:
            return Response({'error': 'Insufficient funds'}, status=400)
'''


class WalletBalanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = request.user.profile
        wallet = get_object_or_404(Wallet, profile=profile)
        return Response({'balance': wallet.balance})


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

