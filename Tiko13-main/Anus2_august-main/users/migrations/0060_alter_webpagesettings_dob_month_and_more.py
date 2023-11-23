# Generated by Django 4.2.7 on 2023-11-22 19:02

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0059_webpagesettings_dob_day'),
    ]

    operations = [
        migrations.AlterField(
            model_name='webpagesettings',
            name='dob_month',
            field=models.IntegerField(choices=[(1, 1), (2, 2), (3, 3), (4, 4), (5, 5), (6, 6), (7, 7), (8, 8), (9, 9), (10, 10), (11, 11), (12, 12)]),
        ),
        migrations.AlterField(
            model_name='webpagesettings',
            name='dob_year',
            field=models.IntegerField(),
        ),
    ]
