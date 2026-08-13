from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User
from complaints.models import Category, Ward, Complaint


class ComplaintTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.citizen = User.objects.create_user(
            email='citizen@example.com', full_name='Citizen', password='citizen123', role='citizen'
        )
        self.official = User.objects.create_user(
            email='official@example.com', full_name='Official', password='official123', role='official'
        )
        self.category = Category.objects.create(name='Roads', description='Road issues')
        self.other_category = Category.objects.create(name='Water', description='Water issues')
        self.ward = Ward.objects.create(name='Westlands', sub_county='Westlands')

    def test_citizen_create_complaint(self):
        self.client.force_authenticate(user=self.citizen)
        data = {
            'category': self.category.id,
            'ward': self.ward.id,
            'title': 'Pothole on Ngong Road',
            'description': 'Large pothole causing accidents',
            'location': 'Ngong Road, Nairobi',
            'latitude': -1.2921,
            'longitude': 36.8219,
        }
        response = self.client.post('/api/complaints/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Complaint.objects.count(), 1)
        complaint = Complaint.objects.first()
        self.assertEqual(complaint.status, 'submitted')
        self.assertEqual(complaint.citizen, self.citizen)

    def test_citizen_list_own_complaints(self):
        self.client.force_authenticate(user=self.citizen)
        Complaint.objects.create(
            citizen=self.citizen, category=self.category, ward=self.ward,
            title='Test', description='Test', location='Test', status='submitted'
        )
        response = self.client.get('/api/complaints/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_official_sees_own_department_complaints(self):
        self.official.department = self.category
        self.official.save()
        Complaint.objects.create(
            citizen=self.citizen, category=self.category, ward=self.ward,
            title='In department', description='Test', location='Test', status='submitted'
        )
        Complaint.objects.create(
            citizen=self.citizen, category=self.other_category, ward=self.ward,
            title='Other department', description='Test', location='Test', status='submitted'
        )
        self.client.force_authenticate(user=self.official)
        response = self.client.get('/api/complaints/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        titles = {c['title'] for c in response.data['results']}
        self.assertIn('In department', titles)
        self.assertNotIn('Other department', titles)

    def test_official_sees_complaint_assigned_to_them_outside_department(self):
        self.official.department = self.category
        self.official.save()
        assigned = Complaint.objects.create(
            citizen=self.citizen, category=self.other_category, ward=self.ward,
            assigned_to=self.official,
            title='Assigned but other department', description='Test', location='Test', status='submitted'
        )
        self.client.force_authenticate(user=self.official)
        response = self.client.get('/api/complaints/')
        titles = {c['title'] for c in response.data['results']}
        self.assertIn('Assigned but other department', titles)

    def test_official_update_status(self):
        self.official.department = self.category
        self.official.save()
        self.client.force_authenticate(user=self.official)
        complaint = Complaint.objects.create(
            citizen=self.citizen, category=self.category, ward=self.ward,
            title='Test', description='Test', location='Test', status='submitted'
        )
        response = self.client.patch(f'/api/complaints/{complaint.id}/update/', {
            'status': 'under_review'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        complaint.refresh_from_db()
        self.assertEqual(complaint.status, 'under_review')

    def test_official_cannot_update_other_department_unassigned_complaint(self):
        self.official.department = self.category
        self.official.save()
        self.client.force_authenticate(user=self.official)
        complaint = Complaint.objects.create(
            citizen=self.citizen, category=self.other_category, ward=self.ward,
            title='Test', description='Test', location='Test', status='submitted'
        )
        response = self.client.patch(f'/api/complaints/{complaint.id}/update/', {
            'status': 'under_review'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_admin_can_assign_official_in_matching_department(self):
        admin = User.objects.create_superuser(
            email='admin2@example.com', full_name='Admin', password='admin12345'
        )
        self.official.department = self.category
        self.official.save()
        complaint = Complaint.objects.create(
            citizen=self.citizen, category=self.category, ward=self.ward,
            title='Test', description='Test', location='Test', status='submitted'
        )
        self.client.force_authenticate(user=admin)
        response = self.client.patch(f'/api/complaints/{complaint.id}/update/', {
            'assigned_to': self.official.id
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        complaint.refresh_from_db()
        self.assertEqual(complaint.assigned_to, self.official)

    def test_cannot_assign_official_from_other_department(self):
        admin = User.objects.create_superuser(
            email='admin3@example.com', full_name='Admin', password='admin12345'
        )
        self.official.department = self.other_category
        self.official.save()
        complaint = Complaint.objects.create(
            citizen=self.citizen, category=self.category, ward=self.ward,
            title='Test', description='Test', location='Test', status='submitted'
        )
        self.client.force_authenticate(user=admin)
        response = self.client.patch(f'/api/complaints/{complaint.id}/update/', {
            'assigned_to': self.official.id
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        complaint.refresh_from_db()
        self.assertIsNone(complaint.assigned_to)

    def test_cannot_assign_complaint_to_a_citizen(self):
        admin = User.objects.create_superuser(
            email='admin4@example.com', full_name='Admin', password='admin12345'
        )
        complaint = Complaint.objects.create(
            citizen=self.citizen, category=self.category, ward=self.ward,
            title='Test', description='Test', location='Test', status='submitted'
        )
        self.client.force_authenticate(user=admin)
        response = self.client.patch(f'/api/complaints/{complaint.id}/update/', {
            'assigned_to': self.citizen.id
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_citizen_cannot_update_status(self):
        self.client.force_authenticate(user=self.citizen)
        complaint = Complaint.objects.create(
            citizen=self.citizen, category=self.category, ward=self.ward,
            title='Test', description='Test', location='Test', status='submitted'
        )
        response = self.client.patch(f'/api/complaints/{complaint.id}/update/', {
            'status': 'resolved'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_official_cannot_view_other_department_complaint_detail(self):
        self.official.department = self.category
        self.official.save()
        complaint = Complaint.objects.create(
            citizen=self.citizen, category=self.other_category, ward=self.ward,
            title='Test', description='Test', location='Test', status='submitted'
        )
        self.client.force_authenticate(user=self.official)
        response = self.client.get(f'/api/complaints/{complaint.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_complaint_detail(self):
        self.client.force_authenticate(user=self.citizen)
        complaint = Complaint.objects.create(
            citizen=self.citizen, category=self.category, ward=self.ward,
            title='Test Detail', description='Test', location='Test', status='submitted'
        )
        response = self.client.get(f'/api/complaints/{complaint.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Test Detail')

    def test_feedback_submission(self):
        self.client.force_authenticate(user=self.citizen)
        complaint = Complaint.objects.create(
            citizen=self.citizen, category=self.category, ward=self.ward,
            title='Test', description='Test', location='Test', status='resolved'
        )
        response = self.client.post('/api/complaints/feedback/', {
            'complaint': complaint.id,
            'rating': 4,
            'comment': 'Good service',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class CategoryWardTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser(
            email='admin@example.com', full_name='Admin', password='admin12345'
        )
        self.citizen = User.objects.create_user(
            email='citizen@example.com', full_name='Citizen', password='citizen123', role='citizen'
        )

    def test_list_categories(self):
        self.client.force_authenticate(user=self.citizen)
        Category.objects.create(name='Roads')
        response = self.client.get('/api/complaints/categories/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_create_category(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post('/api/complaints/categories/', {
            'name': 'New Category', 'description': 'Test'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_citizen_cannot_create_category(self):
        self.client.force_authenticate(user=self.citizen)
        response = self.client.post('/api/complaints/categories/', {
            'name': 'New Category', 'description': 'Test'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_wards(self):
        self.client.force_authenticate(user=self.citizen)
        Ward.objects.create(name='Westlands', sub_county='Westlands')
        response = self.client.get('/api/complaints/wards/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
