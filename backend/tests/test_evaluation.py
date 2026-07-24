from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User
from evaluation.models import EvaluationResponse


def build_evaluation_payload():
    payload = {
        'age_range': '26-35',
        'gender': 'female',
        'education': 'bachelors',
        'digital_service_frequency': 'sometimes',
        'reported_issue_before': True,
        'county_of_residence': 'Nairobi',
    }
    for i in range(1, 11):
        payload[f'sus_{i}'] = 4
    for i in range(1, 7):
        payload[f'pu_{i}'] = 4
        payload[f'peou_{i}'] = 4
    for i in range(1, 4):
        payload[f'bi_{i}'] = 4
    return payload


class EvaluationSubmitTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.citizen = User.objects.create_user(
            email='citizen@example.com', full_name='Citizen', password='citizen123', role='citizen'
        )

    def test_submit_evaluation(self):
        self.client.force_authenticate(user=self.citizen)
        response = self.client.post('/api/evaluation/submit/', build_evaluation_payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(EvaluationResponse.objects.count(), 1)

    def test_cannot_submit_twice(self):
        self.client.force_authenticate(user=self.citizen)
        self.client.post('/api/evaluation/submit/', build_evaluation_payload(), format='json')
        response = self.client.post('/api/evaluation/submit/', build_evaluation_payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(EvaluationResponse.objects.count(), 1)

    def test_check_endpoint(self):
        self.client.force_authenticate(user=self.citizen)
        response = self.client.get('/api/evaluation/check/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['has_submitted'])
        self.client.post('/api/evaluation/submit/', build_evaluation_payload(), format='json')
        response = self.client.get('/api/evaluation/check/')
        self.assertTrue(response.data['has_submitted'])

    def test_sus_score_calculation(self):
        self.client.force_authenticate(user=self.citizen)
        self.client.post('/api/evaluation/submit/', build_evaluation_payload(), format='json')
        evaluation = EvaluationResponse.objects.get(user=self.citizen)
        # All Likert answers are 4: odd items contribute (4-1)=3 each (x5),
        # even items contribute (5-4)=1 each (x5) -> (15+5)*2.5 = 50.0
        self.assertEqual(evaluation.sus_score, 50.0)


class EvaluationOfficialTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.official = User.objects.create_user(
            email='official@example.com', full_name='Official', password='official123', role='official'
        )
        self.citizen = User.objects.create_user(
            email='citizen@example.com', full_name='Citizen', password='citizen123', role='citizen'
        )
        self.client.force_authenticate(user=self.citizen)
        self.client.post('/api/evaluation/submit/', build_evaluation_payload(), format='json')

    def test_citizen_cannot_list(self):
        self.client.force_authenticate(user=self.citizen)
        response = self.client.get('/api/evaluation/list/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_official_can_list(self):
        self.client.force_authenticate(user=self.official)
        response = self.client.get('/api/evaluation/list/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_official_analytics(self):
        self.client.force_authenticate(user=self.official)
        response = self.client.get('/api/evaluation/analytics/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_responses'], 1)
        self.assertIn('sus', response.data)
        self.assertIn('tam', response.data)

    def test_official_export_excel(self):
        self.client.force_authenticate(user=self.official)
        response = self.client.get('/api/evaluation/export/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response['Content-Type'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )

    def test_citizen_cannot_export(self):
        self.client.force_authenticate(user=self.citizen)
        response = self.client.get('/api/evaluation/export/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
