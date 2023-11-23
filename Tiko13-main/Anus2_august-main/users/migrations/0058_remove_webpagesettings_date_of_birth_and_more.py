# Generated by Django 4.2.7 on 2023-11-22 18:52

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0057_wallet'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='webpagesettings',
            name='date_of_birth',
        ),
        migrations.AddField(
            model_name='webpagesettings',
            name='dob_month',
            field=models.IntegerField(blank=True, choices=[(1, 1), (2, 2), (3, 3), (4, 4), (5, 5), (6, 6), (7, 7), (8, 8), (9, 9), (10, 10), (11, 11), (12, 12)], null=True),
        ),
        migrations.AddField(
            model_name='webpagesettings',
            name='dob_year',
            field=models.IntegerField(blank=True, null=True),
        ),
    ]
