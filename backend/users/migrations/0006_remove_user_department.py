from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0005_copy_department_to_departments"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="user",
            name="department",
        ),
    ]
