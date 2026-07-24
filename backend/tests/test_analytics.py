from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User
from complaints.models import Category, Ward, Complaint, Feedback
from analytics.services import AnalyticsService


class AnalyticsServiceTest(TestCase):
    def setUp(self):
        self.citizen = User.objects.create_user(
            email='citizen@example.com', full_name='Citizen', password='citizen123', role='citizen'
        )
        self.category = Category.objects.create(name='Roads')
        self.ward = Ward.objects.create(name='Westlands', sub_county='Westlands')

        for i in range(10):
            stat = 'resolved' if i < 4 else ('submitted' if i < 7 else 'in_progress')
            Complaint.objects.create(
                citizen=self.citizen, category=self.category, ward=self.ward,
                title=f'Test {i}', description='Test', location='Nairobi',
                status=stat, latitude=-1.29, longitude=36.82,
            )

    def test_summary_stats(self):
        stats = AnalyticsService.get_summary_stats()
        self.assertEqual(stats['total_complaints'], 10)
        self.assertEqual(stats['resolved_complaints'], 4)
        self.assertGreater(stats['resolution_rate'], 0)

    def test_complaints_by_category(self):
        result = AnalyticsService.get_complaints_by_category()
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['category'], 'Roads')
        self.assertEqual(result[0]['count'], 10)

    def test_complaints_by_ward(self):
        result = AnalyticsService.get_complaints_by_ward()
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['ward'], 'Westlands')

    def test_complaints_by_status(self):
        result = AnalyticsService.get_complaints_by_status()
        self.assertGreater(len(result), 0)

    def test_complaint_trends(self):
        result = AnalyticsService.get_complaint_trends(period='daily', days=30)
        self.assertIsInstance(result, list)

    def test_empty_dataframe(self):
        Complaint.objects.all().delete()
        stats = AnalyticsService.get_summary_stats()
        self.assertEqual(stats['total_complaints'], 0)


class AnalyticsAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.official = User.objects.create_user(
            email='official@example.com', full_name='Official', password='official123', role='official'
        )
        self.citizen = User.objects.create_user(
            email='citizen@example.com', full_name='Citizen', password='citizen123', role='citizen'
        )
        self.category = Category.objects.create(name='Roads')
        Complaint.objects.create(
            citizen=self.citizen, category=self.category,
            title='Test', description='Test', location='Nairobi', status='submitted',
        )

    def test_official_access_summary(self):
        self.client.force_authenticate(user=self.official)
        response = self.client.get('/api/analytics/summary/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_complaints', response.data)

    def test_citizen_denied_analytics(self):
        self.client.force_authenticate(user=self.citizen)
        response = self.client.get('/api/analytics/summary/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_by_category_api(self):
        self.client.force_authenticate(user=self.official)
        response = self.client.get('/api/analytics/by-category/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_trends_api(self):
        self.client.force_authenticate(user=self.official)
        response = self.client.get('/api/analytics/trends/?period=daily&days=30')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
