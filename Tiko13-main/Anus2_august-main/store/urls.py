from django.urls import path, include
from .views import *
from . import views


urlpatterns = [

    path('', BooksListAPIView.as_view(), name='books_list_api'),  # Главная Страница
    path('book_detail/<int:book_id>/', BookDetailAPIView.as_view(), name='book_detail_api'),  #Страница Книги
    path('book_detail/<int:book_id>/info', views.get_book_info, name='get_book_info'), # Описание книги, кол-во глав,страниц
    path('book_detail/<int:book_id>/content', views.get_book_content, name='get_book_content'), # Главы с датой добавления
    path('book_detail/<int:book_id>/review', ReviewListView.as_view(), name='post_review'), # Отзывы (пока отсутствуют)
    path('book_detail/<int:book_id>/comments/', CommentListCreateView.as_view(), name='book-comments'),# Комментарии
    path('book/<int:book_id>/chapters/', ChapterContentView.as_view(), name='chapter_content'), # Отдел Глав для писателя
    path('book/<int:book_id>/chapter_side/', ChapterListView.as_view(), name='chapter-list'), # Менюшка слева для выбора главы или добавления
    path('book/<int:book_id>/add_chapter/', AddChapterView.as_view(), name='add_chapter'),
    path('book/<int:book_id>/chapter/<int:chapter_id>/', ChapterView.as_view(), name='chapter-detail'), # Отдел определенной Главы для писателя
    path('book/<int:book_id>/chapter/<int:chapter_id>/upload/', ChapterUploadView.as_view(), name='upload-chapter'), # Кнопка Загрузки на сайт
    path('book/<int:book_id>/chapter/<int:chapter_id>/download/', ChapterDownloadView.as_view(), name='download-chapter'), # Кнопка Скачивания
    path('book/<int:book_id>/settings/', BookSettingsView.as_view(), name='book_settings'), # Настройки Книги (MVP Studio Settings 1)
    path('book/<int:book_id>/illustrations/', IllustrationView.as_view(), name='book_illustrations'), # Иллюстрации Книги (Еще нету)
    path('book/<int:book_id>/booksale/', BookSaleView.as_view(), name='book_sale'), # Книги на Продажу (возможно скидка) (Еще нету)
    path('history/', HistoryView.as_view(), name='history'), # История книг (пока не тестил)
 #   path('add/', BooksCreate.as_view(), name='book_create'),
 #   path('book_type/', SelectBookTypeView.as_view(), name='book_type'),
 #   path('<int:pk>/edit/', BooksUpdate.as_view(), name='book_update'),
 #   path('<int:pk>/delete/', BooksDelete.as_view(), name='book_delete'),
 #   path('search', BookSearch.as_view(), name='book_search'),
 #   path('comment/like/<int:comment_id>/', views.like_comment, name='like_comment'),
 #   path('comment/dislike/<int:comment_id>/', views.dislike_comment, name='dislike_comment'),
 #   path('review/create/<int:pk>/', ReviewCreateAPIView.as_view(), name='review_create'),
 #   path('book_detail/<int:pk>/toggle/', review_toggle, name='review_toggle'),
 #   path('reviews/<int:review_id>/', views.review_detail, name='review-detail'),
 #   path('review/<int:review_id>/like/', LikeReviewAPIView.as_view(), name='like_review'),
 #   path('review/<int:review_id>/dislike/', DislikeReviewAPIView.as_view(), name='dislike_review'),
 #   path('create_series/', SeriesCreateView.as_view(), name='create_series'),
 #   path('book_text/', BookTextView.as_view(), name='book_text'),
 #   path('rating/<int:book_id>/upvote/', views.upvote_book, name='upvote_book'),
 #   path('rating/<int:book_id>/downvote/', views.downvote_book, name='downvote_book'),
 #   path('series/<int:pk>/', SeriesDetailView.as_view(), name='series_detail'),
 #   path('series/<int:pk>/update/', SeriesUpdateView.as_view(), name='series_update'),

    path('reader/<int:book_id>/', Reader.as_view(), name='reader'), # Читать книги (Здесь Список глав с содержимым), надо настроить правильно будет
    path('reader/<int:book_id>/chapter/<int:chapter_id>/', SingleChapterView.as_view(), name='single_chapter'), # Читать определенную главу


    path('api/book/create/', views.BooksCreateAPIView.as_view(), name='api_book_create'), # Создать книгу (название, жанр, тип книги и описание)
    path('api/book/text/', views.BookTextAPIView.as_view(), name='api_book_text'), # Продолжение создание книги
    # Сделаны как в Автор Тудей, возможна переработка

    path('api/comments/<int:comment_id>/delete/', views.delete_comment, name='api_delete_comment'), # Удаляет коммент по этой ссылке (Возможно уже не нужно)
    path('book_detail/<int:book_id>/purchase', PurchaseBookView.as_view(), name='wallet-purchase-book'), # Покупка книги за внутренную сумму








]


