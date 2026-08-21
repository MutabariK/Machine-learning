import io
from django.test import TestCase
from django.core import mail
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework.test import APIClient
from rest_framework import status
from PIL import Image
from users.models import User
from complaints.models import Category


class UserRegistrationTest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_register_citizen(self):
        data = {
            'email': 'test@example.com',
            'full_name': 'Test User',
            'phone_number': '+254712345678',
            'role': 'citizen',
            'password': 'testpass123',
            'password_confirm': 'testpass123',
        }
        response = self.client.post('/api/auth/register/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(User.objects.first().role, 'citizen')

    def test_register_password_mismatch(self):
        data = {
            'email': 'test@example.com',
            'full_name': 'Test User',
            'password': 'testpass123',
            'password_confirm': 'wrongpass',
        }
        response = self.client.post('/api/auth/register/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_duplicate_email(self):
        User.objects.create_user(email='test@example.com', full_name='Existing', password='pass12345')
        data = {
            'email': 'test@example.com',
            'full_name': 'New User',
            'password': 'testpass123',
            'password_confirm': 'testpass123',
        }
        response = self.client.post('/api/auth/register/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class UserLoginTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com', full_name='Test User', password='testpass123'
        )

    def test_login_success(self):
        response = self.client.post('/api/auth/login/', {
            'email': 'test@example.com', 'password': 'testpass123'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_login_wrong_password(self):
        response = self.client.post('/api/auth/login/', {
            'email': 'test@example.com', 'password': 'wrongpass'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class UserProfileTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com', full_name='Test User', password='testpass123'
        )
        self.client.force_authenticate(user=self.user)

    def test_get_profile(self):
        response = self.client.get('/api/auth/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'test@example.com')

    def test_update_profile(self):
        response = self.client.patch('/api/auth/profile/', {
            'full_name': 'Updated Name'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.full_name, 'Updated Name')

    def test_change_password(self):
        response = self.client.post('/api/auth/change-password/', {
            'old_password': 'testpass123',
            'new_password': 'newpass12345',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class UserManagementTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser(
            email='admin@example.com', full_name='Admin', password='admin12345'
        )
        self.citizen = User.objects.create_user(
            email='citizen@example.com', full_name='Citizen', password='citizen123'
        )

    def test_admin_list_users(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/auth/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_citizen_cannot_list_users(self):
        self.client.force_authenticate(user=self.citizen)
        response = self.client.get('/api/auth/users/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class OfficialDepartmentAssignmentTest(TestCase):
    """An official may cover up to 2 departments; admins are unrestricted
    regardless of what's set here (see ComplaintUpdateView, which grants
    admin unrestricted access without consulting departments at all)."""

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser(
            email='admin@example.com', full_name='Admin', password='admin12345'
        )
        self.roads = Category.objects.create(name='Roads')
        self.water = Category.objects.create(name='Water')
        self.security = Category.objects.create(name='Security')
        self.client.force_authenticate(user=self.admin)

    def test_create_official_with_two_departments(self):
        response = self.client.post('/api/auth/users/', {
            'email': 'official@example.com', 'full_name': 'Official',
            'password': 'official123', 'role': 'official',
            'departments': [self.roads.id, self.water.id],
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        official = User.objects.get(email='official@example.com')
        self.assertEqual(
            set(official.departments.values_list('name', flat=True)),
            {'Roads', 'Water'},
        )

    def test_cannot_create_official_with_three_departments(self):
        response = self.client.post('/api/auth/users/', {
            'email': 'official@example.com', 'full_name': 'Official',
            'password': 'official123', 'role': 'official',
            'departments': [self.roads.id, self.water.id, self.security.id],
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('departments', response.data)

    def test_cannot_create_official_with_no_departments(self):
        response = self.client.post('/api/auth/users/', {
            'email': 'official@example.com', 'full_name': 'Official',
            'password': 'official123', 'role': 'official',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('departments', response.data)

    def test_update_official_departments(self):
        official = User.objects.create_user(
            email='official@example.com', full_name='Official',
            password='official123', role='official',
        )
        official.departments.set([self.roads])
        response = self.client.patch(f'/api/auth/users/{official.id}/', {
            'departments': [self.water.id, self.security.id],
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        official.refresh_from_db()
        self.assertEqual(
            set(official.departments.values_list('name', flat=True)),
            {'Water', 'Security'},
        )
        self.assertEqual(set(response.data['department_names'].split(', ')), {'Water', 'Security'})


class PasswordResetTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com', full_name='Test User', password='oldpass123'
        )

    def test_request_reset_sends_email_for_known_user(self):
        response = self.client.post('/api/auth/password-reset/', {'email': 'test@example.com'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('reset-password', mail.outbox[0].body)

    def test_request_reset_same_response_for_unknown_email(self):
        response = self.client.post('/api/auth/password-reset/', {'email': 'nobody@example.com'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 0)

    def test_confirm_reset_with_valid_token(self):
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = default_token_generator.make_token(self.user)
        response = self.client.post('/api/auth/password-reset/confirm/', {
            'uid': uid, 'token': token, 'new_password': 'brandnewpass123',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('brandnewpass123'))

    def test_confirm_reset_with_invalid_token(self):
        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        response = self.client.post('/api/auth/password-reset/confirm/', {
            'uid': uid, 'token': 'not-a-real-token', 'new_password': 'brandnewpass123',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_confirm_reset_with_bad_uid(self):
        response = self.client.post('/api/auth/password-reset/confirm/', {
            'uid': 'not-valid-base64!!', 'token': 'whatever', 'new_password': 'brandnewpass123',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class EmailChangeTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com', full_name='Test User', password='testpass123'
        )
        self.other_user = User.objects.create_user(
            email='taken@example.com', full_name='Other User', password='otherpass123'
        )
        self.client.force_authenticate(user=self.user)

    def test_change_email_success(self):
        response = self.client.post('/api/auth/change-email/', {
            'new_email': 'new@example.com', 'current_password': 'testpass123',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, 'new@example.com')

    def test_change_email_wrong_password(self):
        response = self.client.post('/api/auth/change-email/', {
            'new_email': 'new@example.com', 'current_password': 'wrongpass',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_change_email_already_taken(self):
        response = self.client.post('/api/auth/change-email/', {
            'new_email': 'taken@example.com', 'current_password': 'testpass123',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class AvatarUploadTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com', full_name='Test User', password='testpass123'
        )
        self.client.force_authenticate(user=self.user)

    def _make_image_file(self, name='avatar.png'):
        buf = io.BytesIO()
        Image.new('RGB', (10, 10), color='green').save(buf, format='PNG')
        buf.seek(0)
        buf.name = name
        return buf

    def test_upload_avatar(self):
        image = self._make_image_file()
        response = self.client.patch('/api/auth/profile/', {'avatar': image}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(bool(self.user.avatar))

    def test_reject_oversized_avatar(self):
        from django.core.files.uploadedfile import SimpleUploadedFile
        oversized = SimpleUploadedFile(
            'big.png', b'0' * (6 * 1024 * 1024), content_type='image/png'
        )
        response = self.client.patch('/api/auth/profile/', {'avatar': oversized}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
