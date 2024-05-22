from django.contrib import admin
from .models import Book, Comment,Genre, Review, Series, Chapter, Illustration

admin.site.register(Book)
admin.site.register(Comment)
admin.site.register(Genre)
admin.site.register(Review)
admin.site.register(Series)
admin.site.register(Chapter)
admin.site.register(Illustration)