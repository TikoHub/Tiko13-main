# Generated by Django 4.2.7 on 2024-01-21 18:34

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('store', '0075_remove_comment_rating'),
    ]

    operations = [
        migrations.AlterField(
            model_name='commentdislike',
            name='comment',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='comment_dislikes', to='store.comment'),
        ),
        migrations.AlterField(
            model_name='commentlike',
            name='comment',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='comment_likes', to='store.comment'),
        ),
    ]
