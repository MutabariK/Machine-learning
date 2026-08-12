from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User
from evaluation.models import EvaluationResponse
from evaluation.views import cronbach_alpha


def build_evaluation_payload():
    payload = {
        'age_range': '26-35',
        'gender': 'female',
        'education': 'bachelors',
        'digital_service_frequency': 'sometimes',
        'reported_issue_before': True,
        'county_of_residence': 'Nairobi',
    }
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

    def test_tam_construct_scores(self):
        self.client.force_authenticate(user=self.citizen)
        self.client.post('/api/evaluation/submit/', build_evaluation_payload(), format='json')
        evaluation = EvaluationResponse.objects.get(user=self.citizen)
        # All Likert answers are 4, so every construct mean is 4.0
        self.assertEqual(evaluation.tam_perceived_usefulness, 4.0)
        self.assertEqual(evaluation.tam_perceived_ease_of_use, 4.0)
        self.assertEqual(evaluation.tam_behavioral_intention, 4.0)


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
        self.assertNotIn('sus', response.data)
        self.assertIn('tam', response.data)
        self.assertIn('cronbach_alpha', response.data['tam']['perceived_usefulness'])
        # Cronbach's alpha is undefined with a single respondent (no variance
        # to compute) -- the view returns None rather than a bogus number.
        self.assertIsNone(response.data['tam']['perceived_usefulness']['cronbach_alpha'])

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


class CronbachAlphaTest(TestCase):
    def test_perfectly_correlated_items_give_alpha_one(self):
        # Two items that move in lockstep across respondents are maximally
        # internally consistent -- hand-verified expected alpha is exactly 1.0.
        matrix = [[1, 1], [2, 2], [3, 3], [4, 4]]
        self.assertEqual(cronbach_alpha(matrix), 1.0)

    def test_single_respondent_returns_none(self):
        # No variance can be computed from one respondent -- must not raise
        # or return a misleading number.
        self.assertIsNone(cronbach_alpha([[3, 4, 5]]))

    def test_analytics_computes_real_alpha_with_varied_responses(self):
        client = APIClient()
        official = User.objects.create_user(
            email='official2@example.com', full_name='Official', password='official123', role='official'
        )
        varied_pu_answers = [
            [5, 5, 4, 5, 4, 5],
            [3, 4, 3, 4, 3, 4],
            [1, 2, 2, 1, 2, 1],
            [4, 4, 5, 4, 5, 4],
        ]
        for i, pu_answers in enumerate(varied_pu_answers):
            citizen = User.objects.create_user(
                email=f'citizen{i}@example.com', full_name=f'Citizen {i}', password='pw12345', role='citizen'
            )
            payload = build_evaluation_payload()
            for j, val in enumerate(pu_answers, start=1):
                payload[f'pu_{j}'] = val
            client.force_authenticate(user=citizen)
            client.post('/api/evaluation/submit/', payload, format='json')

        client.force_authenticate(user=official)
        response = client.get('/api/evaluation/analytics/')
        alpha = response.data['tam']['perceived_usefulness']['cronbach_alpha']
        self.assertIsNotNone(alpha)
        self.assertGreater(alpha, 0)
        self.assertLessEqual(alpha, 1)
