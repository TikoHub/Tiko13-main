# Generated by Django 4.2.7 on 2023-11-19 15:20

from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('store', '0058_alter_commentdislike_comment_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='chapter',
            name='created',
            field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
    ]
