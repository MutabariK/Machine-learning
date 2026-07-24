from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User
from complaints.models import Category, Ward, Complaint
from notifications.models import Notification


class NotificationCreationTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.citizen = User.objects.create_user(
            email='citizen@example.com', full_name='Citizen', password='citizen123', role='citizen'
        )
        self.official = User.objects.create_user(
            email='official@example.com', full_name='Official', password='official123', role='official'
        )
        self.category = Category.objects.create(name='Roads')
        self.ward = Ward.objects.create(name='Westlands', sub_county='Westlands')
        self.complaint = Complaint.objects.create(
            citizen=self.citizen, category=self.category, ward=self.ward,
            title='Pothole', description='Test', location='Test', status='submitted',
        )

    def test_status_change_notifies_citizen(self):
        self.client.force_authenticate(user=self.official)
        response = self.client.patch(f'/api/complaints/{self.complaint.id}/update/', {
            'status': 'under_review'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        notification = Notification.objects.filter(recipient=self.citizen, complaint=self.complaint).first()
        self.assertIsNotNone(notification)
        self.assertIn('Under Review', notification.message)

    def test_assignment_notifies_official(self):
        self.client.force_authenticate(user=self.official)
        response = self.client.patch(f'/api/complaints/{self.complaint.id}/update/', {
            'assigned_to': self.official.id
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        notification = Notification.objects.filter(recipient=self.official, complaint=self.complaint).first()
        self.assertIsNotNone(notification)

    def test_no_notification_when_status_unchanged(self):
        self.client.force_authenticate(user=self.official)
        self.client.patch(f'/api/complaints/{self.complaint.id}/update/', {
            'resolution_notes': 'Investigating'
        }, format='json')
        self.assertEqual(Notification.objects.count(), 0)


class NotificationAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.citizen = User.objects.create_user(
            email='citizen@example.com', full_name='Citizen', password='citizen123', role='citizen'
        )
        self.other_citizen = User.objects.create_user(
            email='other@example.com', full_name='Other', password='other12345', role='citizen'
        )
        self.notification = Notification.objects.create(recipient=self.citizen, message='Test notification')

    def test_list_only_own_notifications(self):
        Notification.objects.create(recipient=self.other_citizen, message='Not yours')
        self.client.force_authenticate(user=self.citizen)
        response = self.client.get('/api/notifications/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 1)

    def test_unread_count(self):
        self.client.force_authenticate(user=self.citizen)
        response = self.client.get('/api/notifications/unread-count/')
        self.assertEqual(response.data['unread_count'], 1)

    def test_mark_read(self):
        self.client.force_authenticate(user=self.citizen)
        response = self.client.post(f'/api/notifications/{self.notification.id}/read/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.notification.refresh_from_db()
        self.assertTrue(self.notification.is_read)

    def test_cannot_mark_others_notification_read(self):
        self.client.force_authenticate(user=self.other_citizen)
        response = self.client.post(f'/api/notifications/{self.notification.id}/read/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_mark_all_read(self):
        Notification.objects.create(recipient=self.citizen, message='Second')
        self.client.force_authenticate(user=self.citizen)
        response = self.client.post('/api/notifications/read-all/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Notification.objects.filter(recipient=self.citizen, is_read=False).count(), 0)

    def test_requires_authentication(self):
        response = self.client.get('/api/notifications/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
