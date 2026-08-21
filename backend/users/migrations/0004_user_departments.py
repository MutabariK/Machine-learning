from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("complaints", "0002_initial"),
        ("users", "0003_user_avatar"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="departments",
            field=models.ManyToManyField(
                blank=True, related_name="officials", to="complaints.category"
            ),
        ),
    ]
