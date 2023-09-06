from django.shortcuts import render, redirect, get_object_or_404
from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView, View, TemplateView
from .models import Book, Comment, CommentLike, CommentDislike, Review, ReviewLike, ReviewDislike, Series, Genre, BookUpvote, BookDownvote, Chapter
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
from users.models import Notification, Library
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import generics
from rest_framework.response import Response
from .models import Book, Comment, Review
from .serializer import BookSerializer, CommentSerializer, ReviewSerializer, ChapterSerializers




class BooksListAPIView(generics.ListAPIView):
    queryset = Book.objects.order_by('-id')
    serializer_class = BookSerializer



class BookDetailAPIView(generics.RetrieveAPIView):
    queryset = Book.objects.all()
    serializer_class = BookSerializer

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.increase_views_count(request.user if request.user.is_authenticated else None)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


    def get_object(self):
        obj = super().get_object()
        obj.increase_views_count(self.request.user if self.request.user.is_authenticated else None)
        return obj

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        book = self.get_object()
        context['book'] = book

        comments = book.comments.all()

        # Annotate the comments queryset with the likes and dislikes counts
        comments = comments.annotate(
            likes_count=Count('likes'),
            dislikes_count=Count('dislikes')
        )

        # Calculate the rating for each comment by subtracting dislikes from likes
        for comment in comments:
            comment.rating = comment.likes_count - comment.dislikes_count

        # Fetch the reviews queryset and annotate it with the likes and dislikes counts
        reviews = Review.objects.filter(book=book).annotate(
            likes_count=Count('review_likes'),
            dislikes_count=Count('review_dislikes')
        )

        # Calculate the rating for each review by subtracting dislikes from likes
        for review in reviews:
            review.rating = review.likes_count - review.dislikes_count

        comments_rating_sum = sum(comment.rating for comment in comments)
        reviews_rating_sum = sum(review.rating for review in reviews)

        # Sort the comments and reviews by rating in descending order
        comments = sorted(comments, key=lambda c: c.rating, reverse=True)
        reviews = sorted(reviews, key=lambda r: r.rating, reverse=True)

        context['comments'] = comments
        context['comment_form'] = CommentForm(book=book)  # Pass the book instance to the form
        context['reviews'] = reviews
        context['comments_rating_sum'] = comments_rating_sum
        context['reviews_rating_sum'] = reviews_rating_sum
        return context

    def post(self, request, *args, **kwargs):
        book_id = request.POST.get('book')  # Retrieve the book ID from the POST data
        book = get_object_or_404(Book, id=book_id)  # Get the book instance
        form = CommentForm(request.POST, book=book)  # Pass the book instance to the form

        if form.is_valid():
            comment = form.save(commit=False)
            comment.book = book
            comment.user = request.user
            comment.save()
            return redirect('book_detail', pk=book.pk)
        else:
            return HttpResponse('Invalid form submission')


def delete_comment(request, comment_id):
    comment = Comment.objects.get(id=comment_id)
    book_id = comment.book.id
    if request.user == comment.user:
        comment.delete()
    return redirect('book_detail', pk=book_id)  # Update with the appropriate URL name


class BookSearch(ListView):
    template_name = 'store/book_search.html'
    queryset = Book.objects.all()

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['filter'] = BookFilter(self.request.GET, queryset=self.get_queryset())
        return context


class BooksCreate(CreateView):
    model = Book
    template_name = 'store/book_create.html'
    form_class = BooksForm

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs.update({'user': self.request.user})
        return kwargs

    def form_valid(self, form):
        book = form.save(commit=False)
        book.author = self.request.user
        book.save()

        # Store the book's ID in the session
        self.request.session['book_id'] = book.id
        return HttpResponseRedirect(reverse('book_text'))

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['user_series'] = Series.objects.filter(author=self.request.user)
        return context


class BookTextView(FormView):
    template_name = 'store/book_text.html'
    form_class = ChapterForm

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        self.book_id = self.request.session.get('book_id', None)
        if self.book_id:
            self.book = Book.objects.get(id=self.book_id)
        else:
            # You can add redirection or error handling here
            pass
        return kwargs

    def form_valid(self, form):
        chapter = form.save(commit=False)
        chapter.book = self.book
        chapter.save()
        return super().form_valid(form)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['book'] = self.book
        return context

    def get_success_url(self):
        return reverse('book_detail', args=(self.book.id,))


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


class CommentView(ListView):
    queryset = Comment.objects.all()
    template_name = 'comment/comment_list.html'


class CommentDetailView(DetailView):
    template_name = 'comment/comment_detail.html'


@method_decorator(login_required, name='dispatch')
class CommentCreateView(CreateView):
    template_name = 'comment/comment_create.html'
    form_class = CommentForm

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs['book'] = Book.objects.get(pk=self.kwargs['pk'])
        return kwargs

    def form_valid(self, form):
        book = Book.objects.get(pk=self.kwargs['pk'])
        # Check if the current user is in the book author's blacklist
        if self.request.user in book.author.profile.blacklist.all():
            # If they are, return an error message and don't save the comment
            messages.error(self.request, "You have been blacklisted by the author and cannot comment.")
            return redirect('book_detail', pk=book.pk)  # Redirect back to the book detail page

        self.object = form.save(commit=False)
        self.object.user = self.request.user
        self.object.book = book
        self.object.save()

        # Get parent comment id from POST data
        parent_comment_id = self.request.POST.get('parent_comment_id')
        if parent_comment_id:
            # Get the parent comment from the database
            parent_comment = Comment.objects.get(id=parent_comment_id)
            self.object.parent_comment = parent_comment

            # create a notification for the author of the parent comment
            if self.request.user.profile != parent_comment.user.profile:
                notification = Notification(
                    recipient=parent_comment.user.profile,
                    sender=self.request.user.profile,
                    notification_type='comment'
                )
                notification.save()

        self.object.save()
        return super().form_valid(form)


    def get_success_url(self):
        return reverse_lazy('book_detail', kwargs={'pk': self.object.book.pk})


@method_decorator(login_required, name='dispatch')
class CommentUpdateView(UpdateView):
    template_name = 'comment/comment_create.html'
    form_class = CommentForm


class CommentDeleteView(DeleteView):
    template_name = 'comment/comment_delete.html'
    queryset = Comment.objects.all()
    def get_success_url(self):
        return reverse_lazy('book_detail', kwargs={'pk': self.object.book.pk})


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


def increase_views_count(request, review_id):
    review = get_object_or_404(Review, id=review_id)
    if review.increase_views_count(request.user):
        return HttpResponse("Views count increased.")
    return HttpResponse("Cannot increase views count within 24 hours.")


def like_review(request, review_id):
    review = get_object_or_404(Review, id=review_id)

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
    def get(self, request, book_id):
        try:
            book = Book.objects.get(pk=book_id)
        except Book.DoesNotExist:
            return Response({'detail': 'Book not found.'}, status=status.HTTP_404_NOT_FOUND)

        chapters = Chapter.objects.filter(book=book)

        # Serialize the chapters data and return it as JSON
        serialized_chapters = [{'title': chapter.title, 'additional_title': chapter.additional_title, 'content': chapter.content} for chapter in chapters]

        return Response(serialized_chapters)






