from django.contrib import admin
from .models import Profile, FollowersCount, Library, Achievement, WebPageSettings, TemporaryRegistration, Wallet

admin.site.register(Profile)
admin.site.register(FollowersCount)
admin.site.register(Library)
admin.site.register(Achievement)
admin.site.register(WebPageSettings)
admin.site.register(TemporaryRegistration)
admin.site.register(Wallet)