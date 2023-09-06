from django.views.generic import ListView, CreateView, DetailView, DeleteView
from django.urls import reverse_lazy
from django.shortcuts import render, redirect
from .forms import CommentForm

from .models import Discussion, Comment


class DiscussionListView(ListView):
    model = Discussion
    template_name = 'forum/discussion_list.html'
    context_object_name = 'discussions'

class DiscussionCreateView(CreateView):
    model = Discussion
    fields = ['title', 'content']
    template_name = 'forum/discussion_create.html'
    success_url = reverse_lazy('forum:discussion_list')

    def form_valid(self, form):
        form.instance.author = self.request.user
        return super().form_valid(form)


def comment_create(request, pk):
    discussion = Discussion.objects.get(pk=pk)

    if request.method == 'POST':
        form = CommentForm(request.POST)
        if form.is_valid():
            comment = form.save(commit=False)
            comment.author = request.user
            comment.discussion = discussion
            comment.save()
            return redirect('forum:discussion_detail', pk=pk)
    else:
        form = CommentForm()

    return render(request, 'forum/discussion_detail.html', {'form': form, 'discussion': discussion})


class DiscussionDetailView(DetailView):
    model = Discussion
    template_name = 'forum/discussion_detail.html'
    context_object_name = 'discussion'


