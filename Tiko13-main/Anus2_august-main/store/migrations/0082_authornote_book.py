# Generated by Django 4.2.1 on 2024-02-22 11:21

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('store', '0081_authornote'),
    ]

    operations = [
        migrations.AddField(
            model_name='authornote',
            name='book',
            field=models.ForeignKey(default=45, on_delete=django.db.models.deletion.CASCADE, to='store.book'),
            preserve_default=False,
        ),
    ]
