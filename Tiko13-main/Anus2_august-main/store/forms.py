from django.forms import ModelForm, Textarea, Select
from django import forms
from .models import Book, Comment, Review, Genre, Series, Chapter
from django.contrib.auth.models import User
from django.forms import TextInput
from users.helpers import FollowerHelper
from django.core.exceptions import ValidationError


class BooksForm(forms.ModelForm):
    book_type = forms.ChoiceField(choices=Book.TYPE_CHOICES)
    abstract = forms.CharField(widget=forms.Textarea(attrs={'rows': 3}), max_length=500, required=False)
    author_remark = forms.CharField(widget=forms.Textarea(attrs={'rows': 3}), max_length=500, required=False)
    is_adult = forms.BooleanField(required=False)
    genre2 = forms.ModelChoiceField(queryset=Genre.objects.all(), empty_label='Select a genre', required=False)
    genre3 = forms.ModelChoiceField(queryset=Genre.objects.all(), empty_label='Select a genre', required=False)
    co_author = forms.ModelChoiceField(queryset=User.objects.none(), required=False)
    co_author2 = forms.ModelChoiceField(queryset=User.objects.none(), required=False)
    series = forms.ModelChoiceField(queryset=Series.objects.none(), required=False)  # Added this line

    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user')
        super().__init__(*args, **kwargs)
        # Use the get_friends function to get the friends of the current user
        friends = FollowerHelper.get_friends(user)
        # Set the queryset of the co_author field to these friends
        self.fields['series'].queryset = Series.objects.filter(author=user)
        self.fields['co_author'].queryset = friends
        self.fields['co_author2'].queryset = friends

    class Meta:
        model = Book
        fields = ['name', 'genre', 'description', 'price', 'coverpage', 'abstract', 'author_remark', 'is_adult',
                  'genre2', 'genre3', 'co_author', 'co_author2', 'status']


class CommentForm(ModelForm):
    class Meta:
        model = Comment
        fields = ('text',)
        widgets = {
            'text': TextInput(attrs={"class": "form-control small-text-input"})
        }

    def __init__(self, *args, **kwargs):
        self.book = kwargs.pop('book')  # Get the book instance from the kwargs
        super().__init__(*args, **kwargs)

    def save(self, commit=True):
        comment = super().save(commit=False)
        comment.book = self.book  # Set the book for the comment
        if commit:
            comment.save()
        return comment


class ReviewCreateForm(ModelForm):
    class Meta:
        model = Review
        fields = ['text']


class BookTypeForm(forms.Form):
    book_type = forms.ChoiceField(choices=Book.TYPE_CHOICES)


class SeriesForm(forms.ModelForm):
    class Meta:
        model = Series
        exclude = ('author',)


class ChapterForm(forms.ModelForm):
    class Meta:
        model = Chapter
        fields = ['title', 'content']

    def clean_content(self):
        content = self.cleaned_data.get('content')

        if content:
            num_chars = len(content)
            if num_chars > 50000:
                raise ValidationError("Content cannot exceed 5000 characters.")

        return content



