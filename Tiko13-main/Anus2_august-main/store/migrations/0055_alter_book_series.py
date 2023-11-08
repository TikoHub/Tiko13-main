# Generated by Django 4.2.1 on 2023-11-08 06:59

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('store', '0054_book_sequence_number'),
    ]

    operations = [
        migrations.AlterField(
            model_name='book',
            name='series',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='books', to='store.series'),
        ),
    ]
