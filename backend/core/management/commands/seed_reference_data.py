from django.core.management.base import BaseCommand
from complaints.models import Category, Ward


class Command(BaseCommand):
    help = 'Seed complaint categories and wards. Safe to run in production (idempotent, no demo accounts).'

    def handle(self, *args, **options):
        # Rename legacy 'Roads' in place so existing complaints/assignments stay linked.
        Category.objects.filter(name='Roads').update(
            name='Road Maintenance',
            description='Road conditions, potholes, and infrastructure',
        )

        active_categories_data = [
            ('Road Maintenance', 'Road conditions, potholes, and infrastructure'),
            ('Waste Management', 'Issues related to garbage collection and waste disposal'),
            ('Water Services', 'Water supply, sewerage, and drainage issues'),
        ]
        categories = []
        for name, desc in active_categories_data:
            cat, _ = Category.objects.get_or_create(name=name, defaults={'description': desc})
            if not cat.is_active:
                cat.is_active = True
                cat.save(update_fields=['is_active'])
            categories.append(cat)

        # Out-of-scope categories from earlier seeding stay in the database (any linked
        # complaints keep their category) but are hidden from new complaint submissions.
        deactivated = Category.objects.exclude(
            name__in=[name for name, _ in active_categories_data]
        ).update(is_active=False)

        self.stdout.write(f'  Categories: {len(categories)} active, {deactivated} deactivated')

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
