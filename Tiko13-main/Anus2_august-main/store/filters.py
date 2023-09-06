from dataclasses import field
from django_filters import FilterSet
from .models import Book

class BookFilter(FilterSet):
    class Meta:
        model = Book
        fields = {
            'name': ['icontains'],
            'genre': ['exact'],
        }
