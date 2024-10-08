# Generated by Django 4.2.1 on 2024-03-27 23:14

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('store', '0095_alter_book_genre_alter_book_visibility'),
    ]

    operations = [
        migrations.AddField(
            model_name='book',
            name='demo_version',
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name='book',
            name='authors_note',
            field=models.TextField(default="Author's Note"),
        ),
        migrations.AlterField(
            model_name='book',
            name='book_type',
            field=models.CharField(choices=[('epic_novel', 'Epic Novel'), ('novel', 'Novel'), ('short_story_poem', 'Short Story / Poem'), ('collection', 'Short Story Collection / Poem Collection')], default='epic_novel', max_length=50),
        ),
        migrations.AlterField(
            model_name='book',
            name='description',
            field=models.CharField(default="Book's Description", max_length=2000),
        ),
    ]
