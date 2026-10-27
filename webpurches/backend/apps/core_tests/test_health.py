"""Health endpoint contracts: liveness vs readiness."""
from django.test import TestCase


class HealthEndpointsTestCase(TestCase):
    def test_liveness_ok_without_db_probe(self):
        res = self.client.get('/health/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()['status'], 'ok')
        self.assertNotIn('password', str(res.json()).lower())

    def test_readiness_reports_database(self):
        res = self.client.get('/api/health/')
        self.assertEqual(res.status_code, 200)
        self.assertIn(res.json()['status'], ('healthy', 'degraded'))
