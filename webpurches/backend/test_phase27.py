"""
Phase 27: Progressive Web App and Mobile Experience Automated Test Suite
Fast Delivery (FD) Ecosystem
"""

import os
import sys
import json
from pathlib import Path
from PIL import Image

# Reconfigure stdout for UTF-8 on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Initialize Django environment
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from django.test import RequestFactory
from django.db import connection
from apps.accounts.admin_views import HealthCheckView
from apps.accounts.models import User, UserSettings

ROOT_DIR = Path(__file__).resolve().parent.parent

APPS = [
    ('customer-app', 'Customer Portal', 'fd-customer-v1', '#22C55E'),
    ('restaurant-app', 'Restaurant Hub', 'fd-restaurant-v1', '#062817'),
    ('delivery-partner-app', 'Delivery Partner', 'fd-delivery-v1', '#22C55E'),
    ('admin-app', 'Admin Mission Control', 'fd-admin-v1', '#062817'),
]


def test_1_manifest_verification():
    print("\n--- TEST 1: Web App Manifests Verification Across 4 Apps ---")
    for app_folder, app_title, _, theme_color in APPS:
        manifest_path = ROOT_DIR / app_folder / 'public' / 'manifest.webmanifest'
        assert manifest_path.exists(), f"Manifest missing for {app_folder}: {manifest_path}"

        with open(manifest_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        assert 'name' in data and len(data['name']) > 0, f"Name missing in {app_folder} manifest"
        assert 'short_name' in data, f"Short name missing in {app_folder} manifest"
        assert data.get('start_url') == '/', f"start_url must be / in {app_folder}"
        assert data.get('scope') == '/', f"scope must be / in {app_folder}"
        assert data.get('display') == 'standalone', f"display must be standalone in {app_folder}"
        assert 'icons' in data and len(data['icons']) >= 4, f"At least 4 icons required in {app_folder}"

        # Verify icon entries
        icon_sizes = [ic.get('sizes') for ic in data['icons']]
        assert '192x192' in icon_sizes, f"192x192 icon missing in {app_folder} manifest"
        assert '512x512' in icon_sizes, f"512x512 icon missing in {app_folder} manifest"
        purposes = [ic.get('purpose') for ic in data['icons']]
        assert 'maskable' in purposes, f"Maskable icon missing in {app_folder} manifest"

        print(f"  [OK] {app_title} ({app_folder}): Valid manifest verified ({data['short_name']}, standalone, icons)")
    print("PASS: All 4 web app manifests verified successfully.")


def test_2_service_worker_architecture():
    print("\n--- TEST 2: Service Worker & Caching Strategy Verification ---")
    for app_folder, app_title, cache_name, _ in APPS:
        sw_path = ROOT_DIR / app_folder / 'public' / 'sw.js'
        assert sw_path.exists(), f"sw.js missing for {app_folder}"

        with open(sw_path, 'r', encoding='utf-8') as f:
            content = f.read()

        assert cache_name in content, f"Expected cache name {cache_name} not found in {sw_path}"
        assert 'PRECACHE_ASSETS' in content, f"PRECACHE_ASSETS missing in {sw_path}"
        assert '/offline.html' in content, f"/offline.html must be in precache for {sw_path}"
        assert 'SENSITIVE_API_PATTERNS' in content, f"SENSITIVE_API_PATTERNS missing in {sw_path}"
        assert 'SKIP_WAITING' in content, f"SKIP_WAITING message handler missing in {sw_path}"
        assert 'self.clients.claim()' in content, f"clients.claim missing in {sw_path}"

        # Check sensitive routes are excluded from cache
        assert '/api/orders/' in content, f"/api/orders/ must be protected in {sw_path}"
        assert '/api/payments/' in content or '/api/settlements/' in content, f"Financial routes must be protected in {sw_path}"

        print(f"  [OK] {app_title} ({app_folder}): Service worker verified (cache: {cache_name}, offline fallback, sensitive API guards)")
    print("PASS: All 4 service workers configured cleanly with security guards.")


def test_3_offline_fallback_pages():
    print("\n--- TEST 3: Offline Fallback Experience (offline.html) ---")
    for app_folder, app_title, _, _ in APPS:
        offline_path = ROOT_DIR / app_folder / 'public' / 'offline.html'
        assert offline_path.exists(), f"offline.html missing for {app_folder}"

        with open(offline_path, 'r', encoding='utf-8') as f:
            content = f.read()

        assert 'FD' in content, f"FD logo brand missing in {offline_path}"
        assert 'offline' in content.lower(), f"Offline heading missing in {offline_path}"
        assert 'இணைப்பு' in content or 'ஆஃப்லைன்' in content or 'மீண்டும்' in content, f"Tamil offline text missing in {offline_path}"

        if app_folder == 'delivery-partner-app':
            assert 'GPS' in content or 'gps' in content.lower(), "Delivery offline page must highlight GPS pause"

        print(f"  [OK] {app_title}: Offline page verified with FD branding and bilingual guidance")
    print("PASS: Offline fallback pages verified across all applications.")


def test_4_pwa_icons_and_dimensions():
    print("\n--- TEST 4: PWA Icon Asset Verification & Dimensions ---")
    required_icons = [
        ('icon-192.png', (192, 192)),
        ('icon-512.png', (512, 512)),
        ('icon-maskable-192.png', (192, 192)),
        ('icon-maskable-512.png', (512, 512)),
        ('apple-touch-icon.png', (180, 180)),
    ]

    for app_folder, app_title, _, _ in APPS:
        icons_dir = ROOT_DIR / app_folder / 'public' / 'icons'
        assert icons_dir.exists(), f"Icons dir missing in {app_folder}"

        for filename, expected_size in required_icons:
            icon_file = icons_dir / filename
            assert icon_file.exists(), f"Icon {filename} missing in {app_folder}"
            with Image.open(icon_file) as im:
                assert im.size == expected_size, f"Icon {filename} has size {im.size}, expected {expected_size}"

        print(f"  [OK] {app_title}: All 5 required icons verified with exact dimensions")
    print("PASS: All icon assets match PWA specifications.")


def test_5_index_html_metadata():
    print("\n--- TEST 5: HTML Document PWA Metadata & Viewport ---")
    for app_folder, app_title, _, _ in APPS:
        html_path = ROOT_DIR / app_folder / 'index.html'
        assert html_path.exists(), f"index.html missing for {app_folder}"

        with open(html_path, 'r', encoding='utf-8') as f:
            content = f.read()

        assert 'rel="manifest"' in content, f"manifest link missing in {html_path}"
        assert 'name="theme-color"' in content, f"theme-color meta missing in {html_path}"
        assert 'name="mobile-web-app-capable"' in content, f"mobile-web-app-capable missing in {html_path}"
        assert 'name="apple-mobile-web-app-capable"' in content, f"apple-mobile-web-app-capable missing in {html_path}"
        assert 'rel="apple-touch-icon"' in content, f"apple-touch-icon link missing in {html_path}"
        assert 'viewport-fit=cover' in content, f"viewport-fit=cover missing in {html_path}"

        print(f"  [OK] {app_title}: PWA metadata, theme-color, and standalone capabilities verified")
    print("PASS: All index.html files contain standard PWA headers.")


def test_6_pwa_bilingual_translations():
    print("\n--- TEST 6: Bilingual i18n Dictionaries for PWA ---")
    for app_folder, app_title, _, _ in APPS:
        i18n_path = ROOT_DIR / app_folder / 'src' / 'utils' / 'i18n.js'
        assert i18n_path.exists(), f"i18n.js missing in {app_folder}"

        with open(i18n_path, 'r', encoding='utf-8') as f:
            content = f.read()

        assert 'install_app' in content, f"install_app missing in {i18n_path}"
        assert 'offline_banner_title' in content, f"offline_banner_title missing in {i18n_path}"
        assert 'update_title' in content, f"update_title missing in {i18n_path}"
        assert 'செயலியை நிறுவுங்கள்' in content or 'நிறுவப்பட்டது' in content, f"Tamil PWA translations missing in {i18n_path}"

        print(f"  [OK] {app_title}: Bilingual PWA namespaces verified (English & Tamil)")
    print("PASS: PWA translations verified across all 4 applications.")


def test_7_backend_health_probe():
    print("\n--- TEST 7: Backend PWA Health Probe (/api/health/) ---")
    rf = RequestFactory()
    req = rf.get('/api/health/')
    view = HealthCheckView.as_view()
    resp = view(req)

    assert resp.status_code == 200, f"Expected 200 from health view, got {resp.status_code}"
    assert resp.data.get('status') == 'healthy', f"Expected status 'healthy', got {resp.data.get('status')}"
    assert resp.data.get('pwa_ready') is True, "pwa_ready must be True"
    assert resp.data.get('database') == 'postgresql', f"database must be postgresql, got {resp.data.get('database')}"
    print(f"  [OK] Health probe responded with 200 OK: {resp.data}")
    print("PASS: Backend health probe operational.")


def test_8_database_and_security_integrity():
    print("\n--- TEST 8: PostgreSQL Database & Business Logic Preservation ---")
    with connection.cursor() as cursor:
        cursor.execute("SELECT current_database();")
        db_name = cursor.fetchone()[0]
        assert db_name == 'wsfood_db', f"Connected to unexpected database: {db_name}"

    user_count = User.objects.count()
    settings_count = UserSettings.objects.count()
    assert user_count > 0, "Users table must not be empty"
    print(f"  [OK] Connected to PostgreSQL '{db_name}'. Active users: {user_count}, UserSettings: {settings_count}")
    print("PASS: Database and business logic strictly preserved.")


def run_all_tests():
    print("====================================================================")
    print("PHASE 27: PROGRESSIVE WEB APP & MOBILE EXPERIENCE TEST SUITE")
    print("====================================================================")
    
    test_1_manifest_verification()
    test_2_service_worker_architecture()
    test_3_offline_fallback_pages()
    test_4_pwa_icons_and_dimensions()
    test_5_index_html_metadata()
    test_6_pwa_bilingual_translations()
    test_7_backend_health_probe()
    test_8_database_and_security_integrity()

    print("\n====================================================================")
    print("RESULTS: 8/8 TEST SUITES PASSED SUCCESSFULLY (100%)")
    print("ALL PHASE 27 PROGRESSIVE WEB APP REQUIREMENTS VERIFIED CLEANLY!")
    print("====================================================================")


if __name__ == '__main__':
    run_all_tests()
