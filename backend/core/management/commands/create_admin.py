import os
from django.core.management.base import BaseCommand
from users.models import User


class Command(BaseCommand):
    help = (
        'Create an admin account from ADMIN_EMAIL/ADMIN_PASSWORD/ADMIN_FULL_NAME '
        'env vars. Safe to run on every deploy: does nothing if the vars are unset, '
        'and never touches the account (including its password) if it already exists.'
    )

    def handle(self, *args, **options):
        email = os.environ.get('ADMIN_EMAIL')
        password = os.environ.get('ADMIN_PASSWORD')
        full_name = os.environ.get('ADMIN_FULL_NAME', 'Administrator')

        if not email or not password:
            self.stdout.write('  Admin bootstrap: ADMIN_EMAIL/ADMIN_PASSWORD not set, skipping.')
            return

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'full_name': full_name,
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if created:
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f'  Admin account created: {email}'))
        else:
            self.stdout.write(f'  Admin account already exists: {email} (left untouched)')
