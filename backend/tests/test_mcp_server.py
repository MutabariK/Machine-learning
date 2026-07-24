import json
from django.test import TestCase
from users.models import User
from complaints.models import Category, Ward, Complaint
import mcp_server


class MCPServerToolsTest(TestCase):
    def setUp(self):
        self.citizen = User.objects.create_user(
            email='citizen@example.com', full_name='Citizen', password='citizen123', role='citizen'
        )
        self.category = Category.objects.create(name='Roads')
        self.ward = Ward.objects.create(name='Westlands', sub_county='Westlands')
        self.complaint = Complaint.objects.create(
            citizen=self.citizen, category=self.category, ward=self.ward,
            title='Pothole on Ngong Road', description='Large pothole', location='Ngong Road',
            status='submitted',
        )

    def test_search_complaints(self):
        result = json.loads(mcp_server.search_complaints())
        self.assertEqual(result['total_found'], 1)
        self.assertEqual(result['complaints'][0]['title'], 'Pothole on Ngong Road')

    def test_search_complaints_filters_by_status(self):
        result = json.loads(mcp_server.search_complaints(status='resolved'))
        self.assertEqual(result['total_found'], 0)

    def test_get_complaint_details(self):
        result = json.loads(mcp_server.get_complaint_details(self.complaint.id))
        self.assertEqual(result['id'], self.complaint.id)
        self.assertEqual(result['status'], 'submitted')

    def test_get_complaint_details_not_found(self):
        result = json.loads(mcp_server.get_complaint_details(999999))
        self.assertIn('error', result)

    def test_list_categories(self):
        result = json.loads(mcp_server.list_categories())
        self.assertTrue(any(c['name'] == 'Roads' for c in result))

    def test_list_wards(self):
        result = json.loads(mcp_server.list_wards())
        self.assertTrue(any(w['name'] == 'Westlands' for w in result))

    def test_platform_stats(self):
        result = json.loads(mcp_server.platform_stats())
        self.assertEqual(result['total_complaints'], 1)
        self.assertEqual(result['citizens'], 1)

    def test_suggest_complaint_category(self):
        result = json.loads(mcp_server.suggest_complaint_category('Pothole', 'Large pothole on the road'))
        self.assertIn('suggestions', result)
