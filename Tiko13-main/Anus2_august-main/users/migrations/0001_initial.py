# Generated by Django 4.2.1 on 2023-06-20 00:17

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('store', '0002_alter_comment_user'),
    ]

    operations = [
        migrations.CreateModel(
            name='FollowersCount',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('follower', models.CharField(max_length=100)),
                ('user', models.CharField(max_length=100)),
            ],
        ),
        migrations.CreateModel(
            name='Profile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('id_user', models.IntegerField()),
                ('bio', models.TextField(blank=True)),
                ('profileimg', models.ImageField(default='blank-profile-picture.png', upload_to='profile_images')),
                ('location', models.CharField(blank=True, max_length=100)),
                ('library', models.ManyToManyField(to='store.book')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
