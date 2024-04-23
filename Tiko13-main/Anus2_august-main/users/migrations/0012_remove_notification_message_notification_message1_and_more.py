# Generated by Django 4.2.1 on 2024-04-23 10:18

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0011_userbookchapternotification_chapter_count_at_last_notification'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='notification',
            name='message',
        ),
        migrations.AddField(
            model_name='notification',
            name='message1',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='notification',
            name='message2',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]
