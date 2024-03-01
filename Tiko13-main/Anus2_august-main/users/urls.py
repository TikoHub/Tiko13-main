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

# http://127.0.0.1:8000/users/api/accounts/facebook/login/ FACEBOOK URLS
urlpatterns = [
    path('api/', include([
        path('register/', RegisterView.as_view(), name='register'), #Регистрация
        path('register_verification/', VerifyRegistrationView.as_view(), name='verify_registration'), #Подтверждение регистрации (Код)
        path('login/', CustomUserLoginView.as_view(), name='custom_user_login'), # Логин
        path('drf-auth/', include('rest_framework.urls')), # Логин для меня, не используется в проекте
        path('social-auth/', include('social_django.urls', namespace='social')),       #Пока сюда смотри
        path('auth/', include('djoser.urls')),
        path('auth/', include('djoser.urls.jwt')),
        path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'), # Я не помню использу. ли теперь Токены эти.. надо будет проверить
        path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
        path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
        path('accounts/', include('allauth.urls')), # Пока не трогай
        path('auth/', include('allauth.socialaccount.urls')), # Пока не трогай
        #path('follow', views.follow, name='follow'),
        #path('conversation/<int:user_id>/', views.conversation_view, name='conversation'), # Пока не трогай
        #path('messages_list/', views.messages_list_view, name='messages_list'), # Пока не трогай
        path('add_to_library/', AddToLibraryView.as_view(), name='add_to_library'), # Добавляет книгу в библиотеку пользователя (позже провекрю каким образом)


        path('<str:username>/followers/', views.followers_list, name='followers-list'), # Подписчики
        path('<str:username>/following/', views.following_list, name='following-list'), # Подписки
        path('<str:username>/', ProfileAPIView.as_view(), name='api-profile'), # Профиль пользователя (Временный Адрес, буду убирать все api/ штуки позже
        path('<str:username>/library', views.get_library_content, name='api_get_library_content'), # Библиотека пользователя
        path('<str:username>/books/', views.get_authored_books, name='api_get_authored_books'),     # Книги пользователя
        path('<str:username>/series/', views.get_user_series, name='api_get_user_series'), # Серии пользователя
        path('<str:username>/comments/', views.get_user_comments, name='api_get_user_comments'), # Комментарии пользователя
        path('<str:username>/description/', views.update_profile_description, name='api_update_profile_description'), # Описание пользователя
        path('<str:username>/settings/', WebPageSettingsAPIView.as_view(), name='api_web_settings'), # Настройки пользователя
        path('upload_temp_profile_img/', views.upload_temp_profile_image, name='upload_temp_profile_img'), # Возможно создаёт темпорари сторейдж для обновы аватарки

        path('settings/privacy/', PrivacySettingsAPIView.as_view(), name='privacy_settings'), # Настройки Приватности (надо объединить с security)
        path('settings/security/', PasswordChangeRequestView.as_view(), name='request-password-change'), #Настройки безопасности (надо объединить с privacy)
        path('settings/verify-password-change/', PasswordChangeVerificationView.as_view(), name='verify-password-change'), # Выскакивающее окно

        path('settings/notifications/', NotificationSettingsAPIView.as_view(), name='settings-notifications'), # Настройки уведомлений пользователя
        path('notifications/', NotificationsAPIView.as_view(), name='notifications-api'), # Уведомления пользователя (список уведов)
        path('wallet/deposit/', DepositView.as_view(), name='wallet-deposit'), # Пополнить кошелек
        path('wallet/withdraw/', WithdrawView.as_view(), name='wallet-withdraw'), # Вывести с кошелька (вернуть деньги)
        path('wallet/transactions/', TransactionHistoryView.as_view(), name='wallet-transactions'), # История транзакций
        path('payment_successful/', views.payment_successful, name='payment_successful'), # Всплывающее окно после успешной оплаты
        path('payment_failed/', views.payment_failed, name='payment_failed'), # Всплывающее окно после неуспешной оплаты
        path('stripe_webhook/', views.stripe_webhook, name='stripe_webhook'), # Не трогать

    # ...add more paths for the other settings
    # ...
    ])),
]
