# Generated by Django 4.2.1 on 2024-03-19 15:55

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('store', '0089_alter_book_description'),
    ]

    operations = [
        migrations.AlterField(
            model_name='book',
            name='volume_number',
            field=models.PositiveIntegerField(blank=True, default=1, help_text='The number of the book in the series'),
        ),
    ]
