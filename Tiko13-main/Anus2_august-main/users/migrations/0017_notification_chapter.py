# Generated by Django 4.2.1 on 2024-05-03 15:12

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('store', '0111_chapter_chapter_number'),
        ('users', '0016_notification_book_name_notification_chapter_title'),
    ]

    operations = [
        migrations.AddField(
            model_name='notification',
            name='chapter',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='store.chapter'),
        ),
    ]
