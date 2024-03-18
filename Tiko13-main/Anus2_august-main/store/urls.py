from django.urls import path, include
from .views import *
from . import views


urlpatterns = [
    path('api/', include([
        path('', BooksListAPIView.as_view(), name='books_list_api'),  # Главная Страница
        path('book_detail/<int:book_id>/', BookDetailAPIView.as_view(), name='book_detail_api'),  #Страница Книги
        path('book_detail/<int:book_id>/info', views.get_book_info, name='get_book_info'), # Описание книги, кол-во глав,страниц
        path('book_detail/<int:book_id>/content', views.get_book_content, name='get_book_content'), # Главы с датой добавления
        path('book_detail/<int:book_id>/review', ReviewListView.as_view(), name='post_review'), # Отзывы (пока отсутствуют)
        path('book_detail/<int:book_id>/comments/', CommentListCreateView.as_view(), name='book-comments'),# Комментарии
        path('book_detail/<int:book_id>/add_to_library/', views.AddToReadingView.as_view(), name='add_to_library'),

        path('book/<int:book_id>/chapters/', ChapterContentView.as_view(), name='chapter_content'), # Отдел Глав для писателя
        path('book/<int:book_id>/chapter_side/', ChapterListView.as_view(), name='chapter-list'), # Менюшка слева для выбора главы или добавления
        path('book/<int:book_id>/add_chapter/', AddChapterView.as_view(), name='add_chapter'),
        path('book/<int:book_id>/chapter/<int:chapter_id>/', StudioChapterView.as_view(), name='chapter-detail'), # Отдел определенной Главы для писателя
        path('book/<int:book_id>/chapter/<int:chapter_id>/upload/', ChapterUploadView.as_view(), name='upload-chapter'), # Кнопка Загрузки на сайт
        path('book/<int:book_id>/chapter/<int:chapter_id>/download/', ChapterDownloadView.as_view(), name='download-chapter'), # Кнопка Скачивания
        path('book/<int:book_id>/chapter/<int:chapter_id>/add_note/', views.add_author_note, name='add_note'), # Добавить заметку / комментарий (для автора)
        path('book/<int:book_id>/notes/', BookNotesView.as_view(), name='book_notes'),
        path('book/<int:book_id>/chapter/<int:chapter_id>/notes/', ChapterNotesView.as_view(), name='chapter_notes'),
        path('book/<int:book_id>/settings/', BookSettingsView.as_view(), name='book_settings'), # Настройки Книги (MVP Studio Settings 1)
        path('book/<int:book_id>/illustrations/', IllustrationView.as_view(), name='book_illustrations'), # Иллюстрации Книги (Еще нету)
        path('book/<int:book_id>/booksale/', BookSaleView.as_view(), name='book_sale'), # Книги на Продажу (возможно скидка) (Еще нету)
        path('history/', HistoryView.as_view(), name='history'), # История книг (пока не тестил)
        path('history/delete/', delete_history, name='delete_history'),
        path('history/record/', update_history_settings, name='update-history-settings'),
        path('unlogged-user-history/', UnloggedUserHistoryView.as_view(), name='unlogged-user-history'),

        path('news/', NewsNotificationsView.as_view(), name='news_notifications'),
        path('search/', SearchApiView.as_view(), name='search_api'),
        path('studio/welcome/', StudioWelcomeAPIView.as_view(), name='studio_welcome'),
        path('books/<int:book_id>/upload/', BookFileUploadView.as_view(), name='book-file-upload'),
        path('studio/books/', StudioBooksAPIView.as_view(), name='studio-books'),
        path('studio/books/<int:book_id>/', StudioBooksAPIView.as_view(), name='update-book-visibility'),


        path('reader/<int:book_id>/', Reader.as_view(), name='reader'), # Читать книги (Здесь Список глав с содержимым), надо настроить правильно будет
        path('reader/<int:book_id>/chapter/<int:chapter_id>/', SingleChapterView.as_view(), name='single_chapter'), # Читать определенную главу


        path('book/create/', views.BooksCreateAPIView.as_view(), name='api_book_create'), # Создать книгу (название, жанр, тип книги и описание)
        path('book/text/', views.BookTextAPIView.as_view(), name='api_book_text'), # Продолжение создание книги
        # Сделаны как в Автор Тудей, возможна переработка

        path('comments/<int:comment_id>/delete/', views.delete_comment, name='api_delete_comment'), # Удаляет коммент по этой ссылке (Возможно уже не нужно)
        path('book_detail/<int:book_id>/purchase/', PurchaseBookView.as_view(), name='wallet-purchase-book'), # Покупка книги за внутренную сумму
        path('book_detail/<int:book_id>/refund/', RefundBookView.as_view(), name='refund_book'),

    ])),
]


