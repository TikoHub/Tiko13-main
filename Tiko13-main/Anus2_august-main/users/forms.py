from django import forms
from .models import Trailer, Profile, WebPageSettings, Message
import datetime
from django.db import models
from django.contrib.auth.forms import AuthenticationForm


class UploadTrailerForm(forms.ModelForm):
    class Meta:
        model = Trailer
        fields = ('link', )



class MessageForm(forms.ModelForm):
    class Meta:
        model = Message
        fields = ['text',]
