from django.db.models import Count, Q
from django.shortcuts import render, redirect, get_object_or_404
from .models import Profile, FollowersCount, Library, Achievement, Illustration, Trailer, WebPageSettings, Notification, Conversation, Message
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User, auth
from store.models import Book, Comment, Review, Series
from django.http import JsonResponse, HttpResponse, HttpResponseForbidden
from .forms import UploadIllustrationForm, UploadTrailerForm, ProfileForm, WebPageSettingsForm, MessageForm
from django.contrib.auth import authenticate, login


@login_required(login_url='signin')
def settings(request):
    profile = Profile.objects.get(user=request.user)
    webpage_settings = WebPageSettings.objects.get(profile=profile)

    if request.method == 'POST':
        profile_form = ProfileForm(request.POST, request.FILES, instance=profile)
        webpage_settings_form = WebPageSettingsForm(request.POST, instance=webpage_settings)

        if profile_form.is_valid() and webpage_settings_form.is_valid():
            profile_form.save()
            webpage_settings_form.save()
            return redirect('settings/main_settings')

    else:
        profile_form = ProfileForm(instance=profile)
        webpage_settings_form = WebPageSettingsForm(instance=webpage_settings)

    return render(request, 'settings/main_settings.html',
                  {'profile_form': profile_form, 'webpage_settings_form': webpage_settings_form})


class FollowerHelper:
    @staticmethod
    def is_following(follower, user):
        return FollowersCount.objects.filter(follower=follower, user=user).exists()

    @staticmethod
    def follow(follower, user):
        if not FollowerHelper.is_following(follower, user):
            new_follower = FollowersCount.objects.create(follower=follower, user=user)
            return new_follower
        return None

    @staticmethod
    def unfollow(follower, user):
        if FollowerHelper.is_following(follower, user):
            delete_follower = FollowersCount.objects.get(follower=follower, user=user)
            delete_follower.delete()

    @staticmethod
    def get_followers_count(user):
        return FollowersCount.objects.filter(user=user).count()

    @staticmethod
    def get_following_count(follower):
        return FollowersCount.objects.filter(follower=follower).count()

    @staticmethod
    def get_followers(user):
        return User.objects.filter(following_users__user=user)

    @staticmethod
    def get_following(follower):
        return User.objects.filter(follower_users__follower=follower)

    @staticmethod
    def get_friends(user):
        # Get users followed by 'user'
        following = set(FollowersCount.objects.filter(follower=user).values_list('user__username', flat=True))

        # Get users who follow 'user'
        followers = set(FollowersCount.objects.filter(user=user).values_list('follower__username', flat=True))

        # Find mutual following - this is the 'friends' set
        friends = following.intersection(followers)

        return User.objects.filter(username__in=friends)


def profile(request, username):
    profile_owner = get_object_or_404(User, username=username)

    if request.user in profile_owner.profile.blacklist.all():
        return HttpResponse("You are not allowed to view this profile.")

    user_object = User.objects.get(username=username)
    user_profile = Profile.objects.get(user=user_object)

    follower = request.user
    user = get_object_or_404(User, username=username)

    is_following = FollowerHelper.is_following(follower, user)

    button_text = 'Unfollow' if is_following else 'Follow'

    user_followers = FollowerHelper.get_followers_count(user)
    user_following = FollowerHelper.get_following_count(user)

    context = {
        'user_object': user_object,
        'user_profile': user_profile,
        'button_text': button_text,
        'user_followers': user_followers,
        'user_following': user_following,
    }
    return render(request, 'profile.html', context)


@login_required(login_url='signin')
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


def signup(request):
    if request.method == 'POST':
        username = request.POST['username']
        email = request.POST['email']
        password = request.POST['password']
        password2 = request.POST['password2']

        if password == password2:
            if User.objects.filter(email=email).exists():
                messages.info(request, 'Email Taken')
                return redirect('signup')
            elif User.objects.filter(username=username).exists():
                messages.info(request, 'Username Taken')
                return redirect('signup')
            else:
                user = User.objects.create_user(username=username, email=email, password=password)
                user.save()

                user_login = auth.authenticate(username=username, password=password)
                auth.login(request, user_login)

                # Create a profile object for the new user
                user_model = User.objects.get(username=username)
                new_profile = Profile.objects.create(user=user_model, id_user=user_model.id)
                new_profile.save()

                # Create a WebPage_Settings object for the new user
                new_webpage_settings = WebPageSettings.objects.create(profile=new_profile)
                new_webpage_settings.save()

                # Create an empty library for the new user
                my_library = Library.objects.create(user=user_model)
                my_library.save()

                return redirect('profile/' + username)
        else:
            messages.info(request, 'Password Not Matching')
            return redirect('signup')

    else:
        return render(request, 'signup.html')


def signin(request):
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']

        user = auth.authenticate(username=username, password=password)

        if user is not None:
            auth.login(request, user)
            return redirect('/')
        else:
            messages.info(request, 'Credential Invalid')
            return redirect('signin')
    else:
        return render(request, 'signin.html')


@login_required(login_url='signin')
def logout(request):
    auth.logout(request)
    return redirect('signin')


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

    show_library_link = can_view_library(request.user, user)
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


@login_required(login_url='signin')
def get_library_content(request, username):
    try:
        user = User.objects.get(username=username)
        library = user.mylibrary
    except User.DoesNotExist:
        # Consider redirecting to an error page or using a message to notify the user.
        return HttpResponse("User does not exist.")

    filter_by = request.GET.get('filter_by')

    if filter_by == 'reading':
        books = library.reading_books.all()
    elif filter_by == 'watchlist':
        books = library.watchlist_books.all()
    elif filter_by == 'finished':
        books = library.finished_books.all()
    else:
        books = library.get_all_books()

    context = {
        'username': username,
        'library': library,
        'books': books,
        'user_object': user
    }
    return render(request, 'profile/library.html', context)


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


@login_required(login_url='signin')
def get_achievements_content(request, username):
    user_object = get_object_or_404(User, username=username)
    user_profile = Profile.objects.get(user=user_object)
    achievements = user_profile.achievements.all()

    context = {
        'achievements': achievements,
    }
    return render(request, 'profile/achievements.html', context)


@login_required(login_url='signin')
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


def web_settings(request):
    webpage_settings = WebPageSettings.objects.get(profile=Profile.objects.get(user=request.user))

    if request.method == 'POST':
        print('POST request received')  # This line will print if a POST request is received
        profile_form = ProfileForm(request.POST, instance=request.user.profile)
        webpage_settings_form = WebPageSettingsForm(request.POST, instance=webpage_settings)

        if profile_form.is_valid() and webpage_settings_form.is_valid():
            profile_form.save()
            webpage_settings_form.save()
            return redirect('web_settings')
        else:
            print(profile_form.errors)
            print(webpage_settings_form.errors)
    else:
        profile_form = ProfileForm(instance=request.user.profile)
        webpage_settings_form = WebPageSettingsForm(instance=webpage_settings)

    context = {
        'profile_form': profile_form,
        'webpage_settings_form': webpage_settings_form,
    }

    return render(request, 'settings/web_settings.html', context)


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

    # Check if the logged in user is the recipient of the notification
    if request.user.profile == notification.recipient:
        notification.read = True
        notification.save()

    # Redirect back to the notifications page
    return redirect('notifications')


@login_required(login_url='signin')
def notification_count(request):
    count = request.user.profile.unread_notification_count()
    return JsonResponse({"unread_count": count})


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



@login_required
def add_to_blacklist(request, username):
    user_to_blacklist = get_object_or_404(User, username=username)
    request.user.profile.blacklist.add(user_to_blacklist)
    return redirect('profile', username=username)


@login_required
def remove_from_blacklist(request, username):
    user_to_remove = get_object_or_404(User, username=username)
    request.user.profile.blacklist.remove(user_to_remove)
    return redirect('profile', username=username)


@login_required
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
        watchlist_users = Library.objects.filter(watchlist_books__in=[book]).count()
        reading_users = Library.objects.filter(reading_books__in=[book]).count()
        book.in_library_users = reading_users + finished_users + watchlist_users
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


from django.db.models import Q, Count
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



@login_required
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

