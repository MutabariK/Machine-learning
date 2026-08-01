from django.core.management.base import BaseCommand
from complaints.models import Category, Ward


class Command(BaseCommand):
    help = 'Seed complaint categories and wards. Safe to run in production (idempotent, no demo accounts).'

    def handle(self, *args, **options):
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
        self.stdout.write(f'  Categories: {len(categories)} present')

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
        self.stdout.write(f'  Wards: {len(wards)} present')
        self.stdout.write(self.style.SUCCESS('Reference data seeding complete.'))
