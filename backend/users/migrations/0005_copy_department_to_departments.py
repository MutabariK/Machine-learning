from django.db import migrations


def copy_department_forward(apps, schema_editor):
    User = apps.get_model('users', 'User')
    for user in User.objects.exclude(department__isnull=True):
        user.departments.add(user.department_id)


def copy_department_backward(apps, schema_editor):
    User = apps.get_model('users', 'User')
    for user in User.objects.all():
        first_department = user.departments.first()
        if first_department is not None:
            user.department_id = first_department.id
            user.save(update_fields=['department'])


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0004_user_departments"),
    ]

    operations = [
        migrations.RunPython(copy_department_forward, copy_department_backward),
    ]
