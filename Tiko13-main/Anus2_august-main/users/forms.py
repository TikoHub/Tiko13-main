from django import forms
from .models import Illustration, Trailer, Profile, WebPageSettings, Message
import datetime
from django.db import models
from django.contrib.auth.forms import AuthenticationForm


class UploadIllustrationForm(forms.ModelForm):
    class Meta:
        model = Illustration
        fields = ('image',)


class UploadTrailerForm(forms.ModelForm):
    class Meta:
        model = Trailer
        fields = ('link', )



class MessageForm(forms.ModelForm):
    class Meta:
        model = Message
        fields = ['text',]
