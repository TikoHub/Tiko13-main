from django.urls import path, include, re_path
from . import views
from .views import CustomUserLoginView, ProfileAPIView, RegisterView, WebPageSettingsAPIView, PrivacySettingsAPIView, \
    PasswordChangeRequestView, PasswordChangeVerificationView, VerifyRegistrationView, NotificationSettingsAPIView, \
    AddToLibraryView, NotificationsAPIView, DepositView, WithdrawView, TransactionHistoryView
from django.views.generic import TemplateView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)


urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'), #Takumi Register
    path('register_verification/', VerifyRegistrationView.as_view(), name='verify_registration'),
    path('api/login/', CustomUserLoginView.as_view(), name='custom_user_login'),
    path('drf-auth/', include('rest_framework.urls')),
    path('social-auth/', include('social_django.urls', namespace='social')),       #Пока сюда смотри
    path('auth/', include('djoser.urls')),
    path('auth/', include('djoser.urls.jwt')),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('accounts/', include('allauth.urls')),
    path('auth/', include('allauth.socialaccount.urls')),
    path('follow', views.follow, name='follow'),
    path('conversation/<int:user_id>/', views.conversation_view, name='conversation'),
    path('messages_list/', views.messages_list_view, name='messages_list'),
    path('add_to_library/', AddToLibraryView.as_view(), name='add_to_library'),
    path('<str:username>/library/', views.my_library_view, name='library'),
    path('delete_book/<int:book_id>/', views.delete_book_from_library, name='delete_book_from_library'),
    path('get_comments_content/<str:username>/', views.get_comments_content, name='get_comments_content'),
    path('get_achievements_content/<str:username>/', views.get_achievements_content, name='get_achievements_content'),
    path('achievements/', views.achievements, name='achievements'),
    path('settings/book_settings/<int:book_id>/', views.book_settings, name='book_settings'),
    path('upload_illustration/', views.upload_illustration, name='upload_illustration'),
    path('upload_trailer/', views.upload_trailer, name='upload_trailer'),
    path('delete_illustration/<int:illustration_id>/', views.delete_illustration, name='delete_illustration'),
    path('delete_trailer/<int:trailer_id>/', views.delete_trailer, name='delete_trailer'),
#    path('settings/web_settings/', views.web_settings, name='web_settings'),
    path('main_settings/', views.main_settings, name='main_settings'),
    #path('settings/privacy/', views.privacy_settings, name='settings-privacy'),
    path('settings/blacklist/', views.blacklist, name='blacklist'),
    path('settings/reviews_settings/', views.reviews, name='reviews_settings'),
    path('settings/social/', views.social, name='social'),
    path('settings/my_books/', views.my_books, name='my_books'),
    path('settings/my_series/', views.my_series, name='my_series'),
    path('settings/my_account/', views.my_account, name='my_account'),
    #path('settings/security/', views.security, name='security'),
    path('settings/purchase_history/', views.purchase_history, name='purchase_history'),
    path('blacklist/<str:username>/add/', views.add_to_blacklist, name='add_to_blacklist'),
    path('blacklist/<str:username>/remove/', views.remove_from_blacklist, name='remove_from_blacklist'),
    path('blacklist/', views.blacklist, name='blacklist'),
    path('notifications/unread_count/', views.notification_count, name='unread_notification_count'),
   # path('notifications/notifications/', views.notifications, name='notifications'),
    path('notifications/read/<int:notification_id>/', views.read_notification, name='read_notification'),
    path('delete_message/<int:message_id>/', views.delete_message, name='delete_message'),
    path('delete_conversation/<int:user_id>/', views.delete_conversation, name='delete_conversation'),
    path('<str:username>/followers/', views.followers_list, name='followers-list'),
    path('<str:username>/following/', views.following_list, name='following-list'),
    path('api/<str:username>/', ProfileAPIView.as_view(), name='api-profile'),
    path('api/<str:username>/library', views.get_library_content, name='api_get_library_content'),
    path('api/<str:username>/books/', views.get_authored_books, name='api_get_authored_books'),
    path('api/<str:username>/series/', views.get_user_series, name='api_get_user_series'),
    path('api/<str:username>/comments/', views.get_user_comments, name='api_get_user_comments'),
    path('api/<str:username>/description/', views.update_profile_description, name='api_update_profile_description'),
    path('api/<str:username>/settings/', WebPageSettingsAPIView.as_view(), name='api_web_settings'),
    path('settings/privacy/', PrivacySettingsAPIView.as_view(), name='privacy_settings'),
    path('settings/security/', PasswordChangeRequestView.as_view(), name='request-password-change'), #Поле где пароль меняют
    path('settings/verify-password-change/', PasswordChangeVerificationView.as_view(), name='verify-password-change'), # Выскакивающее окно
    path('settings/notifications/', NotificationSettingsAPIView.as_view(), name='settings-notifications'),
    path('api/notifications/', NotificationsAPIView.as_view(), name='notifications-api'),
    path('wallet/deposit/', DepositView.as_view(), name='wallet-deposit'),
    path('wallet/withdraw/', WithdrawView.as_view(), name='wallet-withdraw'),
    path('wallet/transactions/', TransactionHistoryView.as_view(), name='wallet-transactions'),


    # ...add more paths for the other settings
    # ...
    ]