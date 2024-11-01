# Generated by Django 4.2.1 on 2024-03-19 02:10

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('store', '0087_remove_book_abstract_remove_book_author_remark'),
    ]

    operations = [
        migrations.AlterField(
            model_name='book',
            name='description',
            field=models.CharField(max_length=1000),
        ),
        migrations.AlterField(
            model_name='comment',
            name='text',
            field=models.CharField(max_length=500),
        ),
        migrations.AlterField(
            model_name='genre',
            name='name',
            field=models.CharField(max_length=50),
        ),
        migrations.AlterField(
            model_name='series',
            name='name',
            field=models.CharField(max_length=100),
        ),
    ]
