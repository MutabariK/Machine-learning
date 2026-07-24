import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from users.models import User
from complaints.models import Category, Ward, Complaint, ComplaintStatusHistory, Feedback


class Command(BaseCommand):
    help = 'Seed the database with sample data for development and testing'

    def handle(self, *args, **options):
        from django.conf import settings
        if not settings.DEBUG:
            self.stderr.write(self.style.ERROR(
                'Seed data can only be run with DEBUG=True. '
                'Set DJANGO_DEBUG=True to confirm.'
            ))
            return
        random.seed(42)
        self.stdout.write('Seeding database...')

        categories_data = [
            ('Waste Management', 'Issues related to garbage collection and waste disposal'),
            ('Water Services', 'Water supply, sewerage, and drainage issues'),
            ('Roads', 'Road conditions, potholes, and infrastructure'),
            ('Street Lighting', 'Non-functional or damaged street lights'),
            ('Health Services', 'Public health facilities and sanitation'),
            ('Licensing Services', 'Business permits and licensing issues'),
            ('Security', 'Public safety and security concerns'),
            ('Other', 'Other public service issues'),
        ]
        categories = []
        for name, desc in categories_data:
            cat, _ = Category.objects.get_or_create(name=name, defaults={'description': desc})
            categories.append(cat)
        self.stdout.write(f'  Created {len(categories)} categories')

        wards_data = [
            ('Westlands', 'Westlands'), ('Kilimani', 'Dagoretti North'),
            ('Kangemi', 'Westlands'), ('Lavington', 'Dagoretti North'),
            ('Karen', 'Lang\'ata'), ('Lang\'ata', 'Lang\'ata'),
            ('Kibra', 'Kibra'), ('Woodley', 'Kibra'),
            ('Roysambu', 'Roysambu'), ('Kahawa West', 'Roysambu'),
            ('Zimmerman', 'Roysambu'), ('Githurai', 'Roysambu'),
            ('Umoja', 'Embakasi West'), ('Kayole Central', 'Embakasi Central'),
            ('Dandora', 'Embakasi North'), ('Ruaraka', 'Ruaraka'),
            ('Kasarani', 'Kasarani'), ('Mathare', 'Mathare'),
            ('Huruma', 'Mathare'), ('Starehe', 'Starehe'),
            ('Nairobi Central', 'Starehe'), ('Pumwani', 'Kamukunji'),
            ('Eastleigh North', 'Kamukunji'), ('Makadara', 'Makadara'),
        ]
        wards = []
        for name, sub_county in wards_data:
            ward, _ = Ward.objects.get_or_create(name=name, defaults={'sub_county': sub_county})
            wards.append(ward)
        self.stdout.write(f'  Created {len(wards)} wards')

        admin_user, created = User.objects.get_or_create(
            email='admin@nairobi.go.ke',
            defaults={
                'full_name': 'System Administrator',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
                'phone_number': '+254700000001',
            }
        )
        if created:
            admin_user.set_password('admin123456')
            admin_user.save()

        official_user, created = User.objects.get_or_create(
            email='official@nairobi.go.ke',
            defaults={
                'full_name': 'James Mwangi',
                'role': 'official',
                'is_staff': True,
                'phone_number': '+254700000002',
            }
        )
        if created:
            official_user.set_password('official123')
            official_user.save()

        citizens_data = [
            ('citizen@example.com', 'Mary Wanjiku', '+254712345678'),
            ('john@example.com', 'John Kamau', '+254723456789'),
            ('alice@example.com', 'Alice Atieno', '+254734567890'),
            ('peter@example.com', 'Peter Odhiambo', '+254745678901'),
            ('grace@example.com', 'Grace Muthoni', '+254756789012'),
        ]
        citizens = []
        for email, name, phone in citizens_data:
            citizen, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'full_name': name,
                    'role': 'citizen',
                    'phone_number': phone,
                }
            )
            if created:
                citizen.set_password('citizen123')
                citizen.save()
            citizens.append(citizen)
        self.stdout.write(f'  Created {len(citizens)} citizens')
        self.stdout.write(self.style.SUCCESS('Database seeding complete!'))
