from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User
from ai.services import suggest_category, analyze_complaint_priority, draft_response


class AIServiceTest(TestCase):
    def test_suggest_category_matches_keywords(self):
        result = suggest_category('Burst water pipe', 'Water leaking onto the road for days')
        self.assertEqual(result['suggested_category'], 'Water & Sewerage')
        self.assertGreater(result['confidence'], 0)

    def test_suggest_category_no_match(self):
        result = suggest_category('', '')
        self.assertIsNone(result['suggested_category'])

    def test_priority_critical_signal(self):
        result = analyze_complaint_priority('Fire outbreak', 'There is a fire emergency near the market', 'Security')
        self.assertEqual(result['priority'], 'critical')

    def test_priority_low_signal(self):
        result = analyze_complaint_priority('Minor cosmetic issue', 'Just a suggestion for improvement', 'Roads')
        self.assertEqual(result['priority'], 'low')

    def test_draft_response_known_status(self):
        result = draft_response('Pothole', 'Large pothole', status='resolved', category='Roads', official_name='Jane')
        self.assertIn('resolved', result['draft'].lower())
        self.assertTrue(result['editable'])


class AIViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.citizen = User.objects.create_user(
            email='citizen@example.com', full_name='Citizen', password='citizen123', role='citizen'
        )
        self.official = User.objects.create_user(
            email='official@example.com', full_name='Official', password='official123', role='official'
        )

    def test_suggest_category_endpoint(self):
        self.client.force_authenticate(user=self.citizen)
        response = self.client.post('/api/ai/suggest-category/', {
            'title': 'Garbage not collected', 'description': 'Trash piling up for a week'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_suggest_category_requires_input(self):
        self.client.force_authenticate(user=self.citizen)
        response = self.client.post('/api/ai/suggest-category/', {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_draft_response_denied_for_citizen(self):
        self.client.force_authenticate(user=self.citizen)
        response = self.client.post('/api/ai/draft-response/', {
            'title': 'Test', 'description': 'Test', 'status': 'resolved', 'category': 'Roads'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_draft_response_allowed_for_official(self):
        self.client.force_authenticate(user=self.official)
        response = self.client.post('/api/ai/draft-response/', {
            'title': 'Test', 'description': 'Test', 'status': 'resolved', 'category': 'Roads'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_chat_requires_message(self):
        self.client.force_authenticate(user=self.citizen)
        response = self.client.post('/api/ai/chat/', {'message': ''}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_chat_rule_based_fallback(self):
        self.client.force_authenticate(user=self.citizen)
        response = self.client.post('/api/ai/chat/', {'message': 'How do I submit a complaint?'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('response', response.data)

    def test_chat_requires_authentication(self):
        response = self.client.post('/api/ai/chat/', {'message': 'hello'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
