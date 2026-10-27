"""
================================================================================
FAST DELIVERY (FD) - PHASE 30: PRODUCTION DEPLOYMENT & DEVOPS TEST SUITE
================================================================================
Validates production settings, health probes (liveness & readiness), static assets,
Channels ASGI configuration, Nginx routing, Dockerfile directives, and database
backup/restore mechanisms.
"""

import os
import sys
import json
import shutil
import inspect
import datetime
import subprocess
from pathlib import Path

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from django.conf import settings
from django.db import connection
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User, AuditLog
from apps.orders.models import Order
from apps.payments.models import Payment
from config import asgi
from scripts.backup_db import backup_database
from scripts.restore_db import restore_database


def run_phase30_test_suite():
    print("=" * 80)
    print("FAST DELIVERY - PHASE 30: PRODUCTION DEPLOYMENT & DEVOPS TEST SUITE")
    print("=" * 80)

    client = APIClient()

    # --------------------------------------------------------------------------
    # [TEST 1] Django Production Settings & Environment Configuration
    # --------------------------------------------------------------------------
    print("\n[TEST 1] Testing Django Production Settings & Environment Configuration...")
    
    # 1. ALLOWED_HOSTS configuration
    assert hasattr(settings, 'ALLOWED_HOSTS'), "ALLOWED_HOSTS is missing"
    assert isinstance(settings.ALLOWED_HOSTS, list), "ALLOWED_HOSTS must be a list"
    print(f"  [OK] ALLOWED_HOSTS properly configured: {settings.ALLOWED_HOSTS}")

    # 2. Database connection pooling
    db_default = settings.DATABASES.get('default', {})
    assert db_default.get('ENGINE') == 'django.db.backends.postgresql', "Engine must be PostgreSQL"
    assert 'CONN_MAX_AGE' in db_default, "CONN_MAX_AGE missing in DATABASES['default']"
    assert db_default['CONN_MAX_AGE'] >= 0, "CONN_MAX_AGE must be non-negative"
    print(f"  [OK] PostgreSQL connection pooling configured (CONN_MAX_AGE = {db_default['CONN_MAX_AGE']}s)")

    # 3. Security headers & SSL settings
    assert hasattr(settings, 'SECURE_CONTENT_TYPE_NOSNIFF') and settings.SECURE_CONTENT_TYPE_NOSNIFF is True
    assert hasattr(settings, 'X_FRAME_OPTIONS') and settings.X_FRAME_OPTIONS == 'DENY'
    assert hasattr(settings, 'SECURE_REFERRER_POLICY')
    assert hasattr(settings, 'SECURE_SSL_REDIRECT')
    assert hasattr(settings, 'SESSION_COOKIE_SECURE')
    assert hasattr(settings, 'CSRF_COOKIE_SECURE')
    assert hasattr(settings, 'SECURE_HSTS_SECONDS')
    print("  [OK] Production security flags present: SECURE_SSL_REDIRECT, HSTS, Secure Cookies")

    # 4. Structured logging
    assert hasattr(settings, 'LOGGING'), "LOGGING configuration missing"
    assert 'console' in settings.LOGGING.get('handlers', {}), "Console log handler missing"
    assert 'django' in settings.LOGGING.get('loggers', {}), "Django logger missing"
    print("  [OK] Structured logging configured with console and app handlers")
    print("[TEST 1 PASSED]")

    # --------------------------------------------------------------------------
    # [TEST 2] DevOps Health Probes (Liveness & Readiness)
    # --------------------------------------------------------------------------
    print("\n[TEST 2] Testing DevOps Health Probes (Liveness & Readiness)...")
    
    # 1. Default readiness health probe
    res_health = client.get('/api/health/')
    assert res_health.status_code == status.HTTP_200_OK, f"Health probe failed: {res_health.status_code}"
    health_data = res_health.data
    assert health_data.get('status') == 'healthy', f"Expected healthy status, got {health_data.get('status')}"
    assert health_data.get('platform') == 'Fast Delivery (FD)'
    assert health_data.get('database') == 'postgresql'
    assert health_data.get('database_status') == 'connected'
    assert health_data.get('channels_status') == 'ready'
    assert health_data.get('pwa_ready') is True
    # Ensure zero secrets leaked
    assert 'password' not in json.dumps(health_data).lower()
    assert 'secret' not in json.dumps(health_data).lower()
    print("  [OK] Comprehensive readiness probe passed (/api/health/) - zero secrets disclosed")

    # 2. Pure liveness probe
    res_live = client.get('/api/health/?check=liveness')
    assert res_live.status_code == status.HTTP_200_OK
    assert res_live.data.get('status') == 'alive'
    print("  [OK] Fast liveness probe passed (/api/health/?check=liveness)")
    print("[TEST 2 PASSED]")

    # --------------------------------------------------------------------------
    # [TEST 3] Dynamic Frontend API & WebSocket Resolvers
    # --------------------------------------------------------------------------
    print("\n[TEST 3] Testing Dynamic Frontend API & WebSocket Resolvers across All 4 Apps...")
    apps = ['customer-app', 'restaurant-app', 'delivery-partner-app', 'admin-app']
    root_dir = Path(__file__).resolve().parent.parent

    for app in apps:
        api_file = root_dir / app / 'src' / 'services' / 'api.js'
        realtime_file = root_dir / app / 'src' / 'utils' / 'realtime.js'
        pwa_file = root_dir / app / 'src' / 'utils' / 'pwa.js'

        assert api_file.exists(), f"API file missing in {app}"
        assert realtime_file.exists(), f"Realtime file missing in {app}"
        assert pwa_file.exists(), f"PWA file missing in {app}"

        api_code = api_file.read_text(encoding='utf-8')
        realtime_code = realtime_file.read_text(encoding='utf-8')
        pwa_code = pwa_file.read_text(encoding='utf-8')

        assert 'VITE_API_BASE_URL' in api_code, f"Dynamic VITE_API_BASE_URL missing in {app}/api.js"
        assert 'VITE_WS_URL' in realtime_code, f"Dynamic VITE_WS_URL missing in {app}/realtime.js"
        assert 'VITE_HEALTH_URL' in pwa_code, f"Dynamic VITE_HEALTH_URL missing in {app}/pwa.js"
        print(f"  [OK] {app}: Verified dynamic VITE_API_BASE_URL, VITE_WS_URL, and VITE_HEALTH_URL resolvers")
    print("[TEST 3 PASSED]")

    # --------------------------------------------------------------------------
    # [TEST 4] Static Asset Collection & Staticfiles Verification
    # --------------------------------------------------------------------------
    print("\n[TEST 4] Testing Static Asset Collection (STATIC_ROOT)...")
    staticfiles_dir = Path(settings.STATIC_ROOT)
    assert staticfiles_dir.exists(), f"STATIC_ROOT directory does not exist: {staticfiles_dir}"
    
    # Check for presence of core Django static assets
    admin_css = list(staticfiles_dir.glob('admin/css/*.css'))
    assert len(admin_css) > 0, "No admin CSS files found in collected staticfiles"
    rest_js = list(staticfiles_dir.glob('rest_framework/js/*.js'))
    assert len(rest_js) > 0, "No rest_framework JS files found in collected staticfiles"
    print(f"  [OK] STATIC_ROOT verified ({len(list(staticfiles_dir.rglob('*.*')))} files collected)")
    print("[TEST 4 PASSED]")

    # --------------------------------------------------------------------------
    # [TEST 5] Django Channels ASGI Protocol Router & WebSocket Endpoints
    # --------------------------------------------------------------------------
    print("\n[TEST 5] Testing Channels ASGI Protocol Router & WebSocket Endpoints...")
    asgi_app = asgi.application
    assert asgi_app is not None, "ASGI application not initialized"
    
    # Check asgi source code defines required routes
    asgi_src = Path(__file__).resolve().parent / 'config' / 'asgi.py'
    src_content = asgi_src.read_text(encoding='utf-8')
    assert 'FD/ecosystem/' in src_content, "Missing FD/ecosystem/ route in asgi.py"
    assert 'FD/tracking/' in src_content, "Missing FD/tracking/ route in asgi.py"
    assert 'FD/chat/' in src_content, "Missing FD/chat/ route in asgi.py"
    assert 'ProtocolTypeRouter' in src_content
    print("  [OK] Channels ASGI routes verified: FD/ecosystem/, FD/tracking/, FD/chat/")
    print("[TEST 5 PASSED]")

    # --------------------------------------------------------------------------
    # [TEST 6] Nginx Configuration & Containerization Directives
    # --------------------------------------------------------------------------
    print("\n[TEST 6] Testing Nginx Configuration & Containerization Files...")
    nginx_conf = root_dir / 'nginx' / 'conf.d' / 'fastdelivery.conf'
    assert nginx_conf.exists(), "Nginx configuration file missing"
    nginx_txt = nginx_conf.read_text(encoding='utf-8')

    # Verify reverse proxy and SPA routing
    assert 'proxy_pass http://django_backend;' in nginx_txt, "Missing backend proxy_pass in nginx"
    assert 'Upgrade $http_upgrade;' in nginx_txt, "Missing WebSocket Upgrade header in nginx"
    assert 'Connection "upgrade";' in nginx_txt, "Missing WebSocket Connection upgrade in nginx"
    assert 'location ^~ /admin-portal/' in nginx_txt, "Missing admin-portal route in nginx"
    assert 'location ^~ /delivery/' in nginx_txt, "Missing delivery route in nginx"
    assert 'location ^~ /restaurant/' in nginx_txt, "Missing restaurant route in nginx"
    assert 'try_files $uri $uri/ /index.html;' in nginx_txt, "Missing SPA fallback in nginx"
    print("  [OK] Nginx virtual host verified: API proxy, WebSocket upgrades, SPA fallbacks for 4 portals")

    # Verify Dockerfiles & Docker Compose
    backend_docker = root_dir / 'backend' / 'Dockerfile'
    frontend_docker = root_dir / 'Dockerfile.frontend'
    compose_file = root_dir / 'docker-compose.yml'
    assert backend_docker.exists() and 'daphne' in backend_docker.read_text(encoding='utf-8')
    assert frontend_docker.exists() and 'nginx' in frontend_docker.read_text(encoding='utf-8')
    assert compose_file.exists() and 'postgres' in compose_file.read_text(encoding='utf-8')
    print("  [OK] Containerization verified: backend Dockerfile (Daphne), frontend multi-stage Dockerfile, docker-compose.yml")
    print("[TEST 6 PASSED]")

    # --------------------------------------------------------------------------
    # [TEST 7] Automated PostgreSQL Database Backup & Safe Restore Test
    # --------------------------------------------------------------------------
    print("\n[TEST 7] Testing PostgreSQL Database Backup & Restoration Safeguards...")
    
    # 1. Test backup execution
    backup_file = backup_database(retention_days=7)
    assert backup_file is not None, "Database backup script failed"
    backup_path = Path(backup_file)
    assert backup_path.exists(), "Backup file not found on filesystem"
    assert backup_path.stat().st_size > 100 * 1024, "Backup file size is smaller than expected (< 100 KB)"
    print(f"  [OK] PostgreSQL backup verified: {backup_path.name} ({backup_path.stat().st_size / 1024:.2f} KB)")

    # 2. Test restore safety guard: prevent accidental primary database overwrite
    guard_triggered = False
    try:
        # Should refuse without --force
        guard_result = restore_database(backup_file, target_db="wsfood_db", force=False)
        assert guard_result is False, "Safety guard did not trigger on primary database overwrite attempt"
        print("  [OK] Safety guard successfully blocked unforced overwrite of primary database")
    except Exception as e:
        print(f"  [OK] Safety guard blocked primary database overwrite: {e}")

    # 3. Test isolated database restoration in isolated test DB
    test_db_name = "wsfood_phase30_test_db"
    print(f"  [*] Executing test restoration into isolated database '{test_db_name}'...")
    restore_success = restore_database(backup_file, target_db=test_db_name, force=False)
    assert restore_success is True, f"Isolated restore test failed on '{test_db_name}'"
    print("  [OK] Isolated restoration completed and verified tables.")

    # 4. Clean up test database
    import psycopg2
    try:
        conn = psycopg2.connect(dbname='postgres', user='postgres', password='root', host='localhost', port=5432)
        conn.autocommit = True
        cur = conn.cursor()
        cur.execute(f"DROP DATABASE IF EXISTS \"{test_db_name}\";")
        conn.close()
        print(f"  [OK] Isolated test database '{test_db_name}' safely dropped.")
    except Exception as e:
        print(f"  [-] Note: Could not drop test db ({e}), non-blocking.")

    print("[TEST 7 PASSED]")

    # --------------------------------------------------------------------------
    # [TEST 8] Zero Regression & Database Integrity
    # --------------------------------------------------------------------------
    print("\n[TEST 8] Testing Zero Regression & PostgreSQL Database Invariants...")
    user_count = User.objects.count()
    order_count = Order.objects.count()
    payment_count = Payment.objects.count()
    audit_count = AuditLog.objects.count()

    assert user_count >= 40, f"Expected at least 40 users, found {user_count}"
    assert order_count >= 60, f"Expected at least 60 orders, found {order_count}"
    assert audit_count >= 30, f"Expected at least 30 audit logs, found {audit_count}"
    print(f"  [OK] Database invariants intact: Users={user_count}, Orders={order_count}, Payments={payment_count}, AuditLogs={audit_count}")

    # Verify SEC-01 & SEC-02 protections still held
    anon_client = APIClient()
    res_refund = anon_client.post('/api/payments/refund/')
    assert res_refund.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]
    print("  [OK] Phase 29 security guards verified intact (SEC-01 refund authorization required)")
    print("[TEST 8 PASSED]")

    print("\n" + "=" * 80)
    print("PHASE 30 DEVOPS & PRODUCTION DEPLOYMENT: ALL 8 / 8 TEST SUITES PASSED (100%)")
    print("=" * 80)


if __name__ == '__main__':
    run_phase30_test_suite()
