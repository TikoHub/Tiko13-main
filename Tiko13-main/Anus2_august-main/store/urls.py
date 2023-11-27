from django.urls import path, include
from .views import BooksCreate, BooksUpdate, BooksDelete, CommentView, CommentCreateView, CommentDetailView, \
    BookSearch, CommentDeleteView, ReviewCreateView, review_toggle, SelectBookTypeView, SeriesCreateView, \
    BookTextView, SeriesDetailView, SeriesUpdateView, Reader, BooksListAPIView, BookDetailAPIView, LikeReviewAPIView, DislikeReviewAPIView, \
    ReviewCreateAPIView, ReviewListView, SingleChapterView, PurchaseBookView
from . import views


urlpatterns = [

    path('', BooksListAPIView.as_view(), name='books_list_api'),
    path('book_detail/<int:pk>/', BookDetailAPIView.as_view(), name='book_detail_api'),
    path('book_detail/<int:book_id>/info', views.get_book_info, name='get_book_info'),
    path('book_detail/<int:book_id>/content', views.get_book_content, name='get_book_content'),
    path('book_detail/<int:book_id>/review', ReviewListView.as_view(), name='post_review'),
    path('add/',BooksCreate.as_view(), name='book_create'),
    path('book_type/', SelectBookTypeView.as_view(), name='book_type'),
    path('<int:pk>/edit/', BooksUpdate.as_view(), name='book_update'),
    path('<int:pk>/delete/', BooksDelete.as_view(), name='book_delete'),
    path('comment/create/<int:pk>/', CommentCreateView.as_view(), name='comment_create'),
    path('comment_detail/', CommentDetailView.as_view(), name='comment_detail'),
    path('comment_list/', CommentView.as_view(), name='comment_list'),
    path('search', BookSearch.as_view(), name='book_search'),
    path('comment_delete/<int:pk>', CommentDeleteView.as_view(), name='comment_delete'),
    path('comment/like/<int:comment_id>/', views.like_comment, name='like_comment'),
    path('comment/dislike/<int:comment_id>/', views.dislike_comment, name='dislike_comment'),
    path('comment/create/<int:pk>/<int:parent_comment_id>/', CommentCreateView.as_view(), name='comment_create'),
    path('review/create/<int:pk>/', ReviewCreateAPIView.as_view(), name='review_create'),
    path('book_detail/<int:pk>/toggle/', review_toggle, name='review_toggle'),
    path('reviews/<int:review_id>/', views.review_detail, name='review-detail'),
    path('review/<int:review_id>/like/', LikeReviewAPIView.as_view(), name='like_review'),
    path('review/<int:review_id>/dislike/', DislikeReviewAPIView.as_view(), name='dislike_review'),
    path('create_series/', SeriesCreateView.as_view(), name='create_series'),
    path('book_text/', BookTextView.as_view(), name='book_text'),
    path('rating/<int:book_id>/upvote/', views.upvote_book, name='upvote_book'),
    path('rating/<int:book_id>/downvote/', views.downvote_book, name='downvote_book'),
    path('series/<int:pk>/', SeriesDetailView.as_view(), name='series_detail'),
    path('series/<int:pk>/update/', SeriesUpdateView.as_view(), name='series_update'),
    path('reader/<int:book_id>/', Reader.as_view(), name='reader'),
    path('reader/<int:book_id>/chapter/<int:chapter_id>/', SingleChapterView.as_view(), name='single_chapter'),
    path('api/book/create/', views.BooksCreateAPIView.as_view(), name='api_book_create'),
    path('api/book/text/', views.BookTextAPIView.as_view(), name='api_book_text'),
    path('api/comments/<int:comment_id>/delete/', views.delete_comment, name='api_delete_comment'),
    path('book_detail/<int:book_id>/purchase', PurchaseBookView.as_view(), name='wallet-purchase-book'),







]


