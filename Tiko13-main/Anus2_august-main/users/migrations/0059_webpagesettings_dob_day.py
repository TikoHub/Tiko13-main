# Generated by Django 4.2.7 on 2023-11-22 19:00

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0058_remove_webpagesettings_date_of_birth_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='webpagesettings',
            name='dob_day',
            field=models.IntegerField(default=0),
        ),
    ]
