from django.shortcuts import render, redirect, get_object_or_404
from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView, View, TemplateView
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from datetime import timedelta
from django.utils import timezone
from .models import CommentLike, CommentDislike, ReviewLike, ReviewDislike, Series, Genre, BookUpvote, BookDownvote, Chapter, AuthorNote
from django.contrib.auth.models import User, auth
from django.contrib.auth.mixins import LoginRequiredMixin
from .forms import BooksForm, CommentForm, ReviewCreateForm, BookTypeForm, SeriesForm, ChapterForm
from .filters import BookFilter
from django.utils.decorators import method_decorator
from django.contrib.auth.decorators import login_required
from django.contrib.admin.views.decorators import staff_member_required
from django.http import HttpResponse, HttpResponseRedirect
from django.http import JsonResponse
from django.db.models import Count
from django.urls import reverse_lazy, reverse
from django.views.generic.edit import FormView
from django.contrib import messages
from users.models import Notification, Library, Wallet, Illustration
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import generics
from rest_framework.response import Response
from .models import Book, Comment, Review, BookLike, ReviewView, UserBookHistory
from .utils import get_client_ip, is_book_purchased_by_user
from .ip_views import check_book_ip_last_viewed, update_book_ip_last_viewed, check_review_ip_last_viewed, update_review_ip_last_viewed
from .serializer import *
from .converters import create_fb2, parse_fb2
from django.core.files.storage import default_storage
import datetime
from datetime import date
from users.models import WebPageSettings, Library


class BooksListAPIView(generics.ListAPIView):
    queryset = Book.objects.order_by('-id')
    serializer_class = BookSerializer


class BookDetailAPIView(generics.RetrieveAPIView):
    queryset = Book.objects.all()
    serializer_class = BookSerializer

    def get_object(self):
        book_id = self.kwargs.get('book_id')
        return get_object_or_404(Book, id=book_id)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serialized_data = self.get_serializer(instance).data

        if 'accept_cookies' in request.COOKIES:
            # Frontend handles the view count
            pass
        else:
            ip_address = get_client_ip(request)
            last_viewed = check_book_ip_last_viewed(ip_address, instance)
            if not last_viewed or (timezone.now() - last_viewed > datetime.timedelta(days=1)):
                instance.views_count += 1
                instance.save()
                update_book_ip_last_viewed(ip_address, instance)

        return Response(serialized_data)


@api_view(['GET'])
def get_book_info(request, book_id):
    try:
        book = Book.objects.get(pk=book_id)
    except Book.DoesNotExist:
        return Response({'error': 'Book not found'}, status=404)

    serializer = BookInfoSerializer(book)
    return Response(serializer.data)


@api_view(['GET'])
def get_book_content(request, book_id):
    try:
        book = Book.objects.get(pk=book_id)
    except Book.DoesNotExist:
        return Response({'error': 'Book not found'}, status=404)

    serializer = BookContentSerializer(book)
    return Response(serializer.data)


class BookSearch(ListView):
    template_name = 'store/book_search.html'
    queryset = Book.objects.all()

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['filter'] = BookFilter(self.request.GET, queryset=self.get_queryset())
        return context


class BooksCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = BookCreateSerializer(data=request.data, context={'request': request})

        if serializer.is_valid():
            book = serializer.save()
            request.session['book_id'] = book.id
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChapterContentView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = ChapterContentSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChapterListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, book_id):
        book = Book.objects.get(id=book_id)
        chapters = book.chapters.all()
        serializer = ChapterSerializers(chapters, many=True)
        return Response(serializer.data)

    def post(self, request, book_id):
        serializer = ChapterSerializers(data=request.data)
        if serializer.is_valid():
            serializer.save(book_id=book_id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AddChapterView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, book_id):
        try:
            book = Book.objects.get(id=book_id)
            if book.author != request.user:
                return Response({'error': 'You are not the author of this book.'}, status=status.HTTP_403_FORBIDDEN)

            # Create an empty chapter
            new_chapter = Chapter.objects.create(book=book, status='in_draft')
            serializer = ChapterSerializers(new_chapter)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Book.DoesNotExist:
            return Response({'error': 'Book not found.'}, status=status.HTTP_404_NOT_FOUND)


class StudioChapterView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, book_id, chapter_id, format=None):
        try:
            chapter = Chapter.objects.get(book_id=book_id, id=chapter_id)
        except Chapter.DoesNotExist:
            return Response({'error': 'Chapter not found'}, status=status.HTTP_404_NOT_FOUND)

        if chapter.book.author != request.user:
            return Response({'error': 'You are not authorized to view this chapter.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = ChapterContentSerializer(chapter)
        return Response(serializer.data)

    def put(self, request, book_id, chapter_id, format=None):
        try:
            chapter = Chapter.objects.get(book_id=book_id, id=chapter_id)
        except Chapter.DoesNotExist:
            return Response({'error': 'Chapter not found'}, status=status.HTTP_404_NOT_FOUND)

        if chapter.book.author != request.user:
            return Response({'error': 'You do not have permission to edit this chapter'}, status=status.HTTP_403_FORBIDDEN)

        serializer = ChapterContentSerializer(chapter, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def toggle_publish(self, request, book_id, chapter_id):
        chapter = get_object_or_404(Chapter, id=chapter_id, book__id=book_id)
        if request.user != chapter.book.author:
            return Response({'error': 'You are not authorized to change the publication status of this chapter.'},
                            status=status.HTTP_403_FORBIDDEN)

        chapter.published = not chapter.published
        chapter.save()
        return Response({'published': chapter.published})

    def delete(self, request, book_id, chapter_id, format=None):
        try:
            chapter = Chapter.objects.get(pk=chapter_id, book_id=book_id)
        except Chapter.DoesNotExist:
            return Response({'error': 'Chapter not found'}, status=status.HTTP_404_NOT_FOUND)

        # Check if the user is authorized to delete the chapter
        if chapter.book.author != request.user:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        chapter.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
def add_author_note(request, book_id, chapter_id):
    try:
        chapter = Chapter.objects.get(book_id=book_id, id=chapter_id)
    except Chapter.DoesNotExist:
        return Response({'error': 'Chapter not found'}, status=404)

    # Data from request
    start = request.data.get('start')
    end = request.data.get('end')
    note_text = request.data.get('note_text')

    # Validate data
    if start is None or end is None or note_text is None:
        return Response({'error': 'Invalid request'}, status=400)

    # Create a new AuthorNote instance
    AuthorNote.objects.create(
        chapter=chapter,
        book=chapter.book,  # Set the book field
        author=request.user,
        start_position=start,
        end_position=end,
        note_text=note_text
    )

    return Response({'message': 'Note added successfully'})


@api_view(['GET'])
def get_author_notes(request, book_id, chapter_id):
    notes = AuthorNote.objects.filter(book_id=book_id, chapter_id=chapter_id, author=request.user)
    serialized_notes = AuthorNoteSerializer(notes, many=True)
    return Response(serialized_notes.data)


class BookNotesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, book_id):
        notes = AuthorNote.objects.filter(book=book_id, author=request.user)
        serializer = AuthorNoteSerializer(notes, many=True)
        return Response(serializer.data)


class ChapterNotesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, book_id, chapter_id):
        notes = AuthorNote.objects.filter(book_id=book_id, chapter_id=chapter_id, author=request.user)
        serializer = AuthorNoteSerializer(notes, many=True)
        return Response(serializer.data)


class ChapterDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, book_id, chapter_id):
        try:
            chapter = Chapter.objects.get(book_id=book_id, id=chapter_id)
        except Chapter.DoesNotExist:
            return Response({'error': 'Chapter not found'}, status=status.HTTP_404_NOT_FOUND)

        if chapter.book.author != request.user:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        fb2_content = create_fb2(chapter)
        response = HttpResponse(fb2_content, content_type='application/xml')
        response['Content-Disposition'] = f'attachment; filename="{chapter.title}.fb2"'
        return response


class ChapterUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, book_id, chapter_id):
        try:
            chapter = Chapter.objects.get(book_id=book_id, id=chapter_id)
        except Chapter.DoesNotExist:
            return Response({'error': 'Chapter not found'}, status=status.HTTP_404_NOT_FOUND)

        if chapter.book.author != request.user:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        file = request.FILES.get('file')
        if not file or not file.name.endswith('.fb2'):
            return Response({'error': 'Invalid file format'}, status=status.HTTP_400_BAD_REQUEST)

        # Save file temporarily
        file_path = default_storage.save(f'tmp/{file.name}', file)
        with default_storage.open(file_path, 'rb') as fb2_file:
            content = parse_fb2(fb2_file)  # Parse FB2 file to extract content

        chapter.content = content
        chapter.save()

        # Cleanup the temporary file
        default_storage.delete(file_path)

        return Response({'message': 'Chapter uploaded successfully'})


class BookSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        context = {}
        followers_usernames = self.request.user.follower_users.values_list('follower__username', flat=True)
        context['co_author_queryset'] = User.objects.filter(username__in=followers_usernames)
        return context

    def patch(self, request, book_id, format=None):
        try:
            book = Book.objects.get(pk=book_id)
        except Book.DoesNotExist:
            return Response({'error': 'Book not found'}, status=status.HTTP_404_NOT_FOUND)

        if book.author != request.user:
            return Response({'error': 'You do not have permission to edit this book'}, status=status.HTTP_403_FORBIDDEN)

        serializer = BookSettingsSerializer(book, data=request.data, partial=True, context=self.get_serializer_context())
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class IllustrationView(APIView):
    def get(self, request, *args, **kwargs):
        illustrations = Illustration.objects.filter(book_id=kwargs['book_id'])
        serializer = IllustrationSerializer(illustrations, many=True)
        return Response(serializer.data)

    def post(self, request, *args, **kwargs):
        serializer = IllustrationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(book_id=kwargs['book_id'])
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BookSaleView(APIView):
    pass


class BookTextAPIView(APIView):
    """
    Add text to a book.
    """

    def post(self, request, *args, **kwargs):
        book_id = request.session.get('book_id', None)

        if not book_id:
            return Response({"error": "Book ID not found in session."}, status=status.HTTP_400_BAD_REQUEST)

        book = get_object_or_404(Book, id=book_id)
        serializer = ChapterSerializers(data=request.data)

        if serializer.is_valid():
            chapter = serializer.save(book=book)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(staff_member_required, name='dispatch')
class BooksUpdate(UpdateView):
    template_name = 'store/book_create.html'
    form_class = BooksForm
    success_url = '/'
    queryset = Book.objects.all()


@method_decorator(staff_member_required, name='dispatch')
class BooksDelete(DeleteView):
    template_name = 'store/book_delete.html'
    queryset = Book.objects.all()
    success_url = '/'


class SeriesCreateView(LoginRequiredMixin, CreateView):
    model = Series
    form_class = SeriesForm
    template_name = 'store/create_series.html'
    success_url = '/'

    def form_valid(self, form):
        series = form.save(commit=False)
        series.author = self.request.user
        series.save()
        return super().form_valid(form)


class SeriesDetailView(DetailView):
    model = Series
    context_object_name = 'series'
    template_name = 'store/series_detail.html'


class SeriesUpdateView(LoginRequiredMixin, UpdateView):
    model = Series
    form_class = SeriesForm
    template_name = 'store/update_series.html'

    def form_valid(self, form):
        series = form.save(commit=False)
        series.author = self.request.user
        series.save()
        return super().form_valid(form)

    def get_success_url(self):
        return reverse('series_detail', args=[self.object.id])


class CommentListCreateView(APIView):
    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.request.method == 'POST':
            self.permission_classes = [IsAuthenticated,]
        else:
            self.permission_classes = [AllowAny,]
        return super(CommentListCreateView, self).get_permissions()

    def get(self, request, book_id):
        book = get_object_or_404(Book, pk=book_id)
        comments = Comment.objects.filter(book=book, parent_comment=None).order_by('-rating')

        # No need to manually include 'is_author' field and calculate 'rating' here
        # It should be handled in the serializer if it's part of your model logic

        serialized_comments = CommentSerializer(comments, many=True, context={'request': request})
        return Response({'comments': serialized_comments.data})

    def post(self, request, book_id):
        book = get_object_or_404(Book, pk=book_id)
        serializer = CreateCommentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user, book=book)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def like_comment(self, request, book_id, comment_id):
        # Logic to like a comment
        pass

    @action(detail=True, methods=['post'])
    def dislike_comment(self, request, book_id, comment_id):
        # Logic to dislike a comment
        pass


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_comment(request, comment_id):
    try:
        comment = Comment.objects.get(pk=comment_id, user=request.user)
    except Comment.DoesNotExist:
        return Response({'error': 'Comment not found or not owned by user.'}, status=status.HTTP_404_NOT_FOUND)

    comment.delete()
    return Response({'message': 'Comment deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)


def like_comment(request, comment_id):
    comment = get_object_or_404(Comment, id=comment_id)

    # Check if the user has already disliked the comment
    if CommentDislike.objects.filter(user=request.user, comment=comment).exists():
        # User has previously disliked the comment, so remove the dislike
        CommentDislike.objects.filter(user=request.user, comment=comment).delete()

    # Perform the logic for handling the like action
    CommentLike.objects.get_or_create(user=request.user, comment=comment)

    # Prepare the response data
    like_count = comment.count_likes()
    dislike_count = comment.count_dislikes()
    response_data = {
        'like_count': like_count,
        'dislike_count': dislike_count
    }

    return JsonResponse(response_data)


def dislike_comment(request, comment_id):
    comment = get_object_or_404(Comment, id=comment_id)

    # Check if the user has already liked the comment
    if CommentLike.objects.filter(user=request.user, comment=comment).exists():
        # User has previously liked the comment, so remove the like
        CommentLike.objects.filter(user=request.user, comment=comment).delete()

    # Perform the logic for handling the dislike action
    CommentDislike.objects.get_or_create(user=request.user, comment=comment)

    # Prepare the response data
    like_count = comment.count_likes()
    dislike_count = comment.count_dislikes()
    response_data = {
        'like_count': like_count,
        'dislike_count': dislike_count
    }

    return JsonResponse(response_data)


class ReviewCreateView(CreateView):
    model = Review
    form_class = ReviewCreateForm
    template_name = 'review/review_create.html'
    success_url = '/reviews/'  # URL to redirect after successfully creating a review

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        book_id = self.kwargs['pk']
        book = get_object_or_404(Book, pk=book_id)
        kwargs['initial']['book'] = book
        return kwargs

    def form_valid(self, form):
        book_id = self.kwargs['pk']
        book = get_object_or_404(Book, pk=book_id)
        form.instance.book = book
        form.instance.author = self.request.user
        return super().form_valid(form)


def review_toggle(request, pk):
    book = get_object_or_404(Book, pk=pk)
    book.display_comments = not book.display_comments
    book.save()
    return redirect('book_detail', pk=pk)


class ReviewListView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer

    def get_queryset(self):
        book_id = self.kwargs.get('book_id')
        return Review.objects.filter(book_id=book_id)

    def get(self, request, *args, **kwargs):
        reviews = self.get_queryset()
        for review in reviews:
            if 'accept_cookies' in request.COOKIES:
                # Frontend handles the view count
                pass
            else:
                ip_address = get_client_ip(request)
                last_viewed = check_review_ip_last_viewed(ip_address, review)
                if not last_viewed or (timezone.now() - last_viewed > timedelta(days=1)):
                    review.views_count += 1
                    review.save()
                    update_review_ip_last_viewed(ip_address, review)

        return super().get(request, *args, **kwargs)

    def perform_create(self, serializer):
        book = get_object_or_404(Book, pk=self.kwargs.get('book_id'))
        serializer.save(user=self.request.user, book=book)

        # Send notification if the reviewer is not the book's author
        if book.author != self.request.user:
            if book.author.notification_settings.show_review_updates:
                Notification.objects.create(
                    recipient=book.author,
                    sender=self.request.user.profile,
                    notification_type='new_review',
                    # Additional fields as needed
                )


def like_review(request, review_id):
    review = get_object_or_404(Review, id=review_id)
    user = request.user

    # Check if the user has already disliked the review
    if ReviewDislike.objects.filter(user=request.user, review=review).exists():
        # User has previously disliked the review, so remove the dislike
        ReviewDislike.objects.filter(user=request.user, review=review).delete()
        review.rating += 1

    # Perform the logic for handling the like action
    ReviewLike.objects.get_or_create(user=request.user, review=review)
    review.rating += 1
    review.save()

    # Redirect back to the same page
    return redirect(reverse('book_detail', kwargs={'pk': review.book.pk}))


class ReviewCreateAPIView(generics.CreateAPIView):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        book_id = self.kwargs.get('pk')
        book = generics.get_object_or_404(Book, pk=book_id)
        serializer.save(author=self.request.user, book=book)


'''class ReviewToggleAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        book = generics.get_object_or_404(Book, pk=pk)
        book.display_comments = not book.display_comments
        book.save()
        return Response({'message': 'Display comments toggled'}, status=status.HTTP_200_OK)'''


class LikeReviewAPIView(generics.CreateAPIView):
    queryset = ReviewLike.objects.all()
    serializer_class = ReviewLikeSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        review_id = self.kwargs.get('pk')
        review = generics.get_object_or_404(Review, pk=review_id)
        # Add logic for liking the review here


class DislikeReviewAPIView(generics.CreateAPIView):
    queryset = ReviewDislike.objects.all()
    serializer_class = ReviewDislikeSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        review_id = self.kwargs.get('pk')
        review = generics.get_object_or_404(Review, pk=review_id)
        # Add logic for disliking the review here


def dislike_review(request, review_id):
    review = get_object_or_404(Review, id=review_id)

    # Check if the user has already liked the review
    if ReviewLike.objects.filter(user=request.user, review=review).exists():
        # User has previously liked the review, so remove the like
        ReviewLike.objects.filter(user=request.user, review=review).delete()
        review.rating -= 1

    # Perform the logic for handling the dislike action
    ReviewDislike.objects.get_or_create(user=request.user, review=review)
    review.rating -= 1
    review.save()

    # Redirect back to the same page
    return redirect(reverse('book_detail', kwargs={'pk': review.book.pk}))

@api_view(['GET'])
def review_detail(request, review_id):
    review = get_object_or_404(Review, id=review_id)
    review.increase_views_count(request)

    serializer = ReviewSerializer(review)
    return Response(serializer.data)


def upvote_book(request, book_id):
    book = get_object_or_404(Book, id=book_id)

    # Check if the user has already downvoted the book
    if BookDownvote.objects.filter(user=request.user, book=book).exists():
        # User has previously downvoted the book, so remove the downvote
        BookDownvote.objects.filter(user=request.user, book=book).delete()

    # Perform the logic for handling the upvote action
    BookUpvote.objects.get_or_create(user=request.user, book=book)

    # Update the book rating
    book.rating = book.upvotes.count() - book.downvotes.count()
    book.save()

    # Redirect back to the same page
    return redirect(reverse('book_detail', kwargs={'pk': book.pk}))


def downvote_book(request, book_id):
    book = get_object_or_404(Book, id=book_id)

    # Check if the user has already upvoted the book
    if BookUpvote.objects.filter(user=request.user, book=book).exists():
        # User has previously upvoted the book, so remove the upvote
        BookUpvote.objects.filter(user=request.user, book=book).delete()

    # Perform the logic for handling the downvote action
    BookDownvote.objects.get_or_create(user=request.user, book=book)

    # Update the book rating
    book.rating = book.upvotes.count() - book.downvotes.count()
    book.save()

    # Redirect back to the same page
    return redirect(reverse('book_detail', kwargs={'pk': book.pk}))


class SelectBookTypeView(FormView):
    template_name = 'store/book_type.html'
    form_class = BookTypeForm
    success_url = reverse_lazy('create_book')

    def form_valid(self, form):
        book_type = form.cleaned_data['book_type']
        self.request.session['book_type'] = book_type
        return super().form_valid(form)


class Reader(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request, book_id):
        try:
            book = Book.objects.get(pk=book_id)
            # Add a check for the book's adult content flag
            if book.is_adult:
                if not request.user.is_authenticated:
                    return Response({'detail': 'Sorry, you need to log in and be older than 18 to read this book.'}, status=status.HTTP_401_UNAUTHORIZED)
                if not self.is_user_adult(request.user):
                    return Response({'detail': 'Sorry, this content is restricted to users over 18.'}, status=status.HTTP_403_FORBIDDEN)

        except Book.DoesNotExist:
            return Response({'detail': 'Book not found.'}, status=status.HTTP_404_NOT_FOUND)

        chapters = Chapter.objects.filter(book=book, published=True)
        user_is_author = request.user == book.author
        user_has_purchased = False
        if request.user.is_authenticated:
            user_has_purchased = book in request.user.library.purchased_books.all()

        can_access_all_chapters = user_is_author or user_has_purchased

        serialized_chapters = self.serialize_chapters(chapters, book, request.user, can_access_all_chapters)

        return Response(serialized_chapters)

    def is_user_adult(self, user):
        try:
            web_page_settings = WebPageSettings.objects.get(profile__user=user)
            dob = web_page_settings.date_of_birth
            if dob is None:
                # If DOB is not set, consider as not adult
                return False
            today = timezone.now().date()
            age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
            return age >= 18
        except WebPageSettings.DoesNotExist:
            # Handle cases where the user does not have WebPageSettings or it's not configured properly
            return False

    def serialize_chapters(self, chapters, book, user, user_has_purchased):
        serialized_chapters = []
        for chapter in chapters:
            chapter_data = {
                'id': chapter.id,
                'title': chapter.title,
            }
            if chapter.is_free or user_has_purchased:
                chapter_data['content'] = chapter.content
            else:
                chapter_data['content'] = 'This content is locked. Please purchase the book to read.'
            serialized_chapters.append(chapter_data)

        return serialized_chapters


def is_user_adult(user):
    if not user.is_authenticated:
        return False
    try:
        dob = user.profile.webpagesettings.date_of_birth
        today = timezone.now().date()
        return (today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))) >= 18
    except (AttributeError, WebPageSettings.DoesNotExist):
        return False


class SingleChapterView(APIView):
    def get(self, request, book_id, chapter_id):
        try:
            chapter = Chapter.objects.get(book_id=book_id, id=chapter_id, published=True)
        except Chapter.DoesNotExist:
            return Response({'detail': 'Chapter not found or not published.'}, status=status.HTTP_404_NOT_FOUND)

        is_author = request.user.is_authenticated and chapter.book.author == request.user
        is_adult = is_user_adult(request.user)
        can_access = (
            (chapter.is_free and (not chapter.book.is_adult or is_adult)) or
            (is_book_purchased_by_user(chapter.book, request.user) and (not chapter.book.is_adult or is_adult)) or
            is_author
        )

        if not can_access:
            return Response({'detail': 'You do not have access to this chapter.'}, status=status.HTTP_403_FORBIDDEN)

        serialized_chapter = ChapterSerializers(chapter).data

        # Update user's book reading history
        if request.user.is_authenticated:
            UserBookHistory.objects.update_or_create(
                user=request.user,
                book=chapter.book,
                defaults={'last_accessed': timezone.now()}
            )

        return Response(serialized_chapter)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def like_book(request, pk):
    book = Book.objects.get(pk=pk)
    BookLike.objects.get_or_create(user=request.user, book=book)
    return Response({'status': 'book liked'})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def unlike_book(request, pk):
    book = Book.objects.get(pk=pk)
    BookLike.objects.filter(user=request.user, book=book).delete()
    return Response({'status': 'book unliked'})


class PurchaseBookView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, book_id):
        user = request.user
        profile = user.profile
        wallet = get_object_or_404(Wallet, profile=profile)

        book = get_object_or_404(Book, id=book_id)
        book_price = book.price

        if wallet.balance >= book_price:
            wallet.purchase(book, book_price)
            user.library.purchased_books.add(book)
            # Add additional logic if needed, like adding the book to the user's library
            return Response({'message': 'Book purchased successfully'})
        else:
            return Response({'error': 'Insufficient wallet balance'}, status=400)


class HistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        now = timezone.now()
        user_history = UserBookHistory.objects.filter(user=request.user).order_by('-last_accessed')

        history_dict = {
            "Today": user_history.filter(last_accessed__date=now.date()),
            "Yesterday": user_history.filter(last_accessed__date=(now - timedelta(days=1)).date()),
            "Last Week": user_history.filter(
                last_accessed__date__range=[now.date() - timedelta(days=7), now.date() - timedelta(days=2)]),
            "Week Ago": user_history.filter(
                last_accessed__date__range=[now.date() - timedelta(days=14), now.date() - timedelta(days=8)]),
            "Two Weeks Ago": user_history.filter(
                last_accessed__date__range=[now.date() - timedelta(days=21), now.date() - timedelta(days=15)]),
            "Three Weeks Ago": user_history.filter(
                last_accessed__date__range=[now.date() - timedelta(days=28), now.date() - timedelta(days=22)]),
            "Month Ago": user_history.filter(
                last_accessed__date__range=[now.date() - timedelta(days=60), now.date() - timedelta(days=29)]),
            "Two Months Ago": user_history.filter(
                last_accessed__date__range=[now.date() - timedelta(days=90), now.date() - timedelta(days=61)]),
            "Three Months Ago": user_history.filter(
                last_accessed__date__range=[now.date() - timedelta(days=180), now.date() - timedelta(days=91)]),
            "Half Year Ago": user_history.filter(
                last_accessed__date__range=[now.date() - timedelta(days=365), now.date() - timedelta(days=181)]),
            "A Year Ago": user_history.filter(
                last_accessed__date__range=[now.date() - timedelta(days=730), now.date() - timedelta(days=366)]),
            "Two Years Ago": user_history.filter(
                last_accessed__date__range=[now.date() - timedelta(days=1095), now.date() - timedelta(days=731)]),
            "A Long Time Ago": user_history.filter(last_accessed__date__lte=now.date() - timedelta(days=1096)),
        }

        # Serialize each queryset and add to response
        for time_category, queryset in history_dict.items():
            history_dict[time_category] = BookViewSerializer(queryset, many=True).data

        return Response(history_dict)


def update_user_book_history(user, book):
    # Check if there's an existing history entry for this user and book
    history_entry, created = UserBookHistory.objects.get_or_create(user=user, book=book)

    # Update the last_accessed timestamp to the current time
    history_entry.last_accessed = timezone.now()
    history_entry.save()


class NewsNotificationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Filter notifications based on the user's preferences and the types of notifications they want to receive
        notifications = Notification.objects.filter(
            recipient=request.user.profile,
            notification_type='book_update'
        ).order_by('-timestamp')

        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)
