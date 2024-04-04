from rest_framework import permissions


class IsBookAuthor(permissions.BasePermission):
    """
    Custom permission to only allow the author of the book to edit it.
    """
    def has_object_permission(self, request, view, obj):
        # Check if the user is the author of the book
        return obj.author == request.user

