# Generated by Django 4.2.1 on 2023-11-08 07:13

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('store', '0055_alter_book_series'),
    ]

    operations = [
        migrations.RenameField(
            model_name='book',
            old_name='sequence_number',
            new_name='volume_number',
        ),
    ]
