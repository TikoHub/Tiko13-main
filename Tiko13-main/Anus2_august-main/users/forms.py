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


class ProfileForm(forms.ModelForm):
    class Meta:
        model = Profile
        fields = ['bio', 'profileimg', 'banner_image', ]


class WebPageSettingsForm(forms.ModelForm):
    dob_month = models.IntegerField(null=True, blank=True)
    dob_year = models.IntegerField(null=True, blank=True)

    class Meta:
        model = WebPageSettings
        fields = ['about', 'date_of_birth', 'status', 'website', 'email', 'facebook', 'instagram', 'twitter', 'display_dob_option']


class MessageForm(forms.ModelForm):
    class Meta:
        model = Message
        fields = ['text',]
