# Generated by Django 4.2.1 on 2024-02-19 07:25

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('store', '0079_chapter_status'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='chapter',
            name='status',
        ),
        migrations.AddField(
            model_name='chapter',
            name='published',
            field=models.BooleanField(default=False),
        ),
    ]
