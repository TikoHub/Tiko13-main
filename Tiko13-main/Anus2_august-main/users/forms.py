from django import forms
from .models import Illustration, Trailer, Profile, WebPageSettings, Message
import datetime


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
        fields = ['nickname', 'bio', 'profileimg']


class WebPageSettingsForm(forms.ModelForm):
    class Meta:
        model = WebPageSettings
        fields = ['about', 'date_of_birth', 'status', 'profile_url', 'website', 'email', 'facebook', 'instagram', 'twitter', 'display_dob_option']
        widgets = {
            'date_of_birth': forms.SelectDateWidget(years=range(1900, datetime.date.today().year+1))
        }


class MessageForm(forms.ModelForm):
    class Meta:
        model = Message
        fields = ['text',]
