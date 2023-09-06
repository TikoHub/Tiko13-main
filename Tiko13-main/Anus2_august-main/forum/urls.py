from django.urls import path
from . import views

app_name = 'forum'

urlpatterns = [
    path('', views.DiscussionListView.as_view(), name='discussion_list'),
    path('create/', views.DiscussionCreateView.as_view(), name='discussion_create'),
    path('<int:pk>/', views.DiscussionDetailView.as_view(), name='discussion_detail'),
    path('<int:pk>/comment/', views.comment_create, name='comment_create'),

]
