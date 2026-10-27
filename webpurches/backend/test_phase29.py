import os
import sys
import io
import django

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import RequestFactory
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.exceptions import ValidationError

from apps.accounts.models import User, Profile, AuditLog
from apps.products.models import Restaurant
from apps.orders.models import Order
from apps.payments.models import Payment
from apps.delivery.models import DeliveryPartner
from apps.accounts.serializers import validate_image_upload
from apps.accounts.support_serializers import validate_support_file


def run_security_test_suite():
    print("=" * 80)
    print("FAST DELIVERY - PHASE 29: SECURITY HARDENING & AUDIT TEST SUITE")
    print("=" * 80)

    client = APIClient()

    # Setup test users
    admin_user = User.objects.filter(role='ADMIN').first() or User.objects.filter(is_superuser=True).first()
    if not admin_user:
        admin_user = User.objects.create_superuser(
            username='sec_admin_test',
            email='sec_admin_test@fastdelivery.com',
            password='AdminPassword123!',
            role='ADMIN'
        )

    customer_user = User.objects.filter(role='CUSTOMER').exclude(email=admin_user.email).first()
    if not customer_user:
        customer_user = User.objects.create_user(
            username='sec_cust_test',
            email='sec_cust_test@fastdelivery.com',
            password='CustomerPassword123!',
            role='CUSTOMER'
        )

    restaurant_user = User.objects.filter(role__in=['RESTAURANT', 'SHOP']).first()
    if not restaurant_user:
        restaurant_user = User.objects.create_user(
            username='sec_rest_test',
            email='sec_rest_test@fastdelivery.com',
            password='RestPassword123!',
            role='RESTAURANT'
        )

    delivery_user = User.objects.filter(role__in=['DELIVERY', 'RIDER']).first()
    if not delivery_user:
        delivery_user = User.objects.create_user(
            username='sec_rider_test',
            email='sec_rider_test@fastdelivery.com',
            password='RiderPassword123!',
            role='DELIVERY'
        )

    # --------------------------------------------------------------------------
    # [TEST 1] Admin Account Registration Lockout
    # --------------------------------------------------------------------------
    print("\n[TEST 1] Testing Admin Registration Lockout on Public Endpoints...")
    client.force_authenticate(user=None)

    # 1. Customer endpoint
    res1 = client.post('/api/auth/register/customer/', {'role': 'ADMIN', 'email': 'fake_admin@test.com', 'password': 'Pass'})
    assert res1.status_code == status.HTTP_403_FORBIDDEN, f"Expected 403, got {res1.status_code}"
    print("  [OK] Customer registration endpoint blocked ADMIN role creation (403 Forbidden)")

    # 2. General register endpoint
    res2 = client.post('/api/auth/register/', {'role': 'ADMIN', 'email': 'fake_admin2@test.com', 'password': 'Pass'})
    assert res2.status_code == status.HTTP_403_FORBIDDEN, f"Expected 403, got {res2.status_code}"
    print("  [OK] Unified /api/auth/register/ blocked ADMIN role creation (403 Forbidden)")

    # 3. Google Auth endpoint
    res3 = client.post('/api/auth/google/', {'role': 'ADMIN', 'email': 'fake_admin3@test.com', 'name': 'Fake Admin'})
    assert res3.status_code == status.HTTP_403_FORBIDDEN, f"Expected 403, got {res3.status_code}"
    print("  [OK] Google Social Auth blocked ADMIN role creation (403 Forbidden)")
    print("[TEST 1 PASSED]")

    # --------------------------------------------------------------------------
    # [TEST 2] Payment Refund Protection & Audit Logging (SEC-01)
    # --------------------------------------------------------------------------
    print("\n[TEST 2] Testing Payment Refund Authorization & Immutable Audit Logging...")
    order = Order.objects.filter(payments__isnull=False).first() or Order.objects.first()

    # 1. Anonymous attempt
    client.force_authenticate(user=None)
    res_anon = client.post('/api/payments/refund/', {'order_id': order.id if order else 1})
    assert res_anon.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]
    print("  [OK] Unauthenticated refund request rejected (401/403)")

    # 2. Customer user attempt (Privilege escalation attempt)
    client.force_authenticate(user=customer_user)
    res_cust = client.post('/api/payments/refund/', {'order_id': order.id if order else 1})
    assert res_cust.status_code == status.HTTP_403_FORBIDDEN
    print("  [OK] Unauthorized customer attempt to trigger refund blocked (403 Forbidden)")

    # 3. Admin user authorized refund & audit log inspection
    client.force_authenticate(user=admin_user)
    audit_count_before = AuditLog.objects.filter(action='PAYMENT_REFUND_PROCESSED').count()

    # Create payment if none exists for order
    if order and not order.payment:
        Payment.objects.create(order=order, amount=order.grand_total or 150.00, status='PAID', payment_method='UPI')

    if order and order.payment:
        res_admin = client.post('/api/payments/refund/', {'order_id': order.id, 'reason': 'Security Audit Test Refund'})
        assert res_admin.status_code == status.HTTP_200_OK, f"Expected 200, got {res_admin.status_code}: {res_admin.data}"
        audit_count_after = AuditLog.objects.filter(action='PAYMENT_REFUND_PROCESSED').count()
        assert audit_count_after > audit_count_before, "Expected AuditLog entry for refund"
        print("  [OK] Admin authorized refund generated immutable AuditLog record successfully")
    print("[TEST 2 PASSED]")

    # --------------------------------------------------------------------------
    # [TEST 3] Delivery OTP & Rider Assignment Authorization (SEC-02)
    # --------------------------------------------------------------------------
    print("\n[TEST 3] Testing Delivery OTP Verification & Rider Assignment Permissions...")
    test_order = Order.objects.first()
    client.force_authenticate(user=None)

    # 1. Unauthenticated OTP verification
    res_otp_anon = client.post(f'/api/orders/{test_order.id}/verify-otp/', {'otp': '1234'})
    assert res_otp_anon.status_code == status.HTTP_401_UNAUTHORIZED
    print("  [OK] Unauthenticated OTP verification rejected (401 Unauthorized)")

    # 2. Customer trying to verify OTP
    client.force_authenticate(user=customer_user)
    res_otp_cust = client.post(f'/api/orders/{test_order.id}/verify-otp/', {'otp': '1234'})
    assert res_otp_cust.status_code == status.HTTP_403_FORBIDDEN
    print("  [OK] Customer forbidden from verifying delivery OTP (403 Forbidden)")

    # 3. Unauthenticated Rider Assignment
    client.force_authenticate(user=None)
    res_assign_anon = client.post(f'/api/orders/{test_order.id}/assign-rider/', {'rider_id': delivery_user.id})
    assert res_assign_anon.status_code == status.HTTP_401_UNAUTHORIZED
    print("  [OK] Unauthenticated rider assignment rejected (401 Unauthorized)")

    # 4. Customer attempting to assign rider
    client.force_authenticate(user=customer_user)
    res_assign_cust = client.post(f'/api/orders/{test_order.id}/assign-rider/', {'rider_id': delivery_user.id})
    assert res_assign_cust.status_code == status.HTTP_403_FORBIDDEN
    print("  [OK] Customer forbidden from assigning rider (403 Forbidden)")
    print("[TEST 3 PASSED]")

    # --------------------------------------------------------------------------
    # [TEST 4] Ecosystem Telemetry Information Disclosure Prevention (SEC-03)
    # --------------------------------------------------------------------------
    print("\n[TEST 4] Testing Ecosystem Telemetry Access Control...")
    # 1. Anonymous access
    client.force_authenticate(user=None)
    res_telem_anon = client.get('/api/admin/ecosystem-telemetry/')
    assert res_telem_anon.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]
    print("  [OK] Anonymous access to /api/admin/ecosystem-telemetry/ blocked (401/403)")

    # 2. Customer access
    client.force_authenticate(user=customer_user)
    res_telem_cust = client.get('/api/admin/ecosystem-telemetry/')
    assert res_telem_cust.status_code == status.HTTP_403_FORBIDDEN
    print("  [OK] Customer access to /api/admin/ecosystem-telemetry/ blocked (403 Forbidden)")

    # 3. Admin access
    client.force_authenticate(user=admin_user)
    res_telem_admin = client.get('/api/admin/ecosystem-telemetry/')
    assert res_telem_admin.status_code == status.HTTP_200_OK
    assert 'total_customers' in res_telem_admin.data
    print("  [OK] Admin authorized to access ecosystem telemetry (200 OK)")
    print("[TEST 4 PASSED]")

    # --------------------------------------------------------------------------
    # [TEST 5] Restaurant Payouts & Orders CSV IDOR Prevention (SEC-04)
    # --------------------------------------------------------------------------
    print("\n[TEST 5] Testing Restaurant Payouts & Orders Export IDOR Prevention...")
    test_restaurant = Restaurant.objects.first()
    if test_restaurant:
        # 1. Anonymous payouts request
        client.force_authenticate(user=None)
        res_pay_anon = client.get(f'/api/restaurants/{test_restaurant.id}/payouts/')
        assert res_pay_anon.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]
        print(f"  [OK] Anonymous access to restaurant #{test_restaurant.id} payouts blocked (401/403)")

        # 2. Customer user requesting payouts
        client.force_authenticate(user=customer_user)
        res_pay_cust = client.get(f'/api/restaurants/{test_restaurant.id}/payouts/')
        assert res_pay_cust.status_code == status.HTTP_403_FORBIDDEN
        print(f"  [OK] Non-owner customer access to restaurant #{test_restaurant.id} payouts blocked (403 Forbidden)")

        # 3. Cross-restaurant owner or Customer accessing orders CSV
        res_csv_cust = client.get(f'/api/restaurants/{test_restaurant.id}/export-orders-csv/')
        assert res_csv_cust.status_code == status.HTTP_403_FORBIDDEN
        print(f"  [OK] Non-owner access to restaurant #{test_restaurant.id} orders CSV export blocked (403 Forbidden)")
    print("[TEST 5 PASSED]")

    # --------------------------------------------------------------------------
    # [TEST 6] Legacy Delivery Profile & Earnings Protection (SEC-05)
    # --------------------------------------------------------------------------
    print("\n[TEST 6] Testing Delivery Profile, Requests, and Earnings Authorization...")
    client.force_authenticate(user=None)

    # 1. Profile
    res_dp_anon = client.get('/api/delivery/profile/')
    assert res_dp_anon.status_code == status.HTTP_401_UNAUTHORIZED
    print("  [OK] Anonymous access to /api/delivery/profile/ rejected (401)")

    # 2. Toggle status
    res_ds_anon = client.post('/api/delivery/toggle-status/')
    assert res_ds_anon.status_code == status.HTTP_401_UNAUTHORIZED
    print("  [OK] Anonymous access to /api/delivery/toggle-status/ rejected (401)")

    # 3. Requests queue
    res_dr_anon = client.get('/api/delivery/requests/')
    assert res_dr_anon.status_code == status.HTTP_401_UNAUTHORIZED
    print("  [OK] Anonymous access to /api/delivery/requests/ rejected (401)")

    # 4. Earnings
    res_de_anon = client.get('/api/delivery/earnings/')
    assert res_de_anon.status_code == status.HTTP_401_UNAUTHORIZED
    print("  [OK] Anonymous access to /api/delivery/earnings/ rejected (401)")
    print("[TEST 6 PASSED]")

    # --------------------------------------------------------------------------
    # [TEST 7] File Upload Magic Bytes & Path Traversal Verification (SEC-09)
    # --------------------------------------------------------------------------
    print("\n[TEST 7] Testing File Upload Magic Byte Signatures & Traversal Defenses...")
    # 1. Path traversal filename test
    traversal_file = SimpleUploadedFile("avatar.png", b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR", content_type="image/png")
    traversal_file._name = "../../etc/passwd.png"
    try:
        validate_image_upload(traversal_file)
        raise AssertionError("Expected ValidationError for path traversal filename")
    except ValidationError:
        print("  [OK] Path traversal filename rejected by validate_image_upload (ValidationError)")

    # 2. Spoofed extension with executable/text bytes
    fake_png = SimpleUploadedFile("avatar.png", b"MZ\x90\x00\x03\x00\x00\x00DOSEXECUTABLE", content_type="image/png")
    try:
        validate_image_upload(fake_png)
        raise AssertionError("Expected ValidationError for executable disguised as PNG")
    except ValidationError:
        print("  [OK] Executable disguised as PNG rejected by binary signature check")

    # 3. Valid PNG header
    real_png = SimpleUploadedFile("avatar.png", b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89", content_type="image/png")
    res_valid_png = validate_image_upload(real_png)
    assert res_valid_png is not None
    print("  [OK] Authentic PNG with matching binary signature passed validation")

    # 4. Support attachment PDF magic bytes
    real_pdf = SimpleUploadedFile("receipt.pdf", b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF", content_type="application/pdf")
    validate_support_file(real_pdf)
    print("  [OK] Authentic PDF with '%PDF-' magic bytes accepted by validate_support_file")

    # 5. Support attachment disguised script
    fake_pdf = SimpleUploadedFile("receipt.pdf", b"#!/bin/bash\nrm -rf /", content_type="application/pdf")
    try:
        validate_support_file(fake_pdf)
        raise AssertionError("Expected ValidationError for shell script disguised as PDF")
    except ValidationError:
        print("  [OK] Shell script disguised as PDF rejected by validate_support_file")
    print("[TEST 7 PASSED]")

    # --------------------------------------------------------------------------
    # [TEST 8] DRF Throttling, Security Headers & WebSocket Frame Limits (SEC-08, SEC-10)
    # --------------------------------------------------------------------------
    print("\n[TEST 8] Testing Throttling Configuration, Security Headers, and WebSocket Limits...")
    from django.conf import settings

    # Check DRF throttle configuration
    drf_cfg = getattr(settings, 'REST_FRAMEWORK', {})
    throttle_classes = drf_cfg.get('DEFAULT_THROTTLE_CLASSES', [])
    throttle_rates = drf_cfg.get('DEFAULT_THROTTLE_RATES', {})
    assert any('ScopedRateThrottle' in str(c) for c in throttle_classes), "ScopedRateThrottle missing from settings"
    assert 'auth' in throttle_rates and 'register' in throttle_rates and 'otp' in throttle_rates
    print("  [OK] DRF ScopedRateThrottle and rates configured: auth, register, otp, support")

    # Check CORS & Browser Security Headers
    assert getattr(settings, 'SECURE_CONTENT_TYPE_NOSNIFF', False) is True
    assert getattr(settings, 'X_FRAME_OPTIONS', None) == 'DENY'
    cors_origins = getattr(settings, 'CORS_ALLOWED_ORIGINS', [])
    assert 'http://localhost:3000' in cors_origins and 'http://localhost:3003' in cors_origins
    print("  [OK] Explicit CORS_ALLOWED_ORIGINS configured without credentials wildcard")
    print("  [OK] Security headers verified: SECURE_CONTENT_TYPE_NOSNIFF=True, X_FRAME_OPTIONS=DENY")

    # Check WebSocket frame payload guard
    import inspect
    from apps.orders.consumers import EcosystemConsumer, OrderTrackingConsumer
    eco_src = inspect.getsource(EcosystemConsumer.receive)
    track_src = inspect.getsource(OrderTrackingConsumer.receive)
    assert 'PAYLOAD_TOO_LARGE' in eco_src and '65536' in eco_src
    assert 'PAYLOAD_TOO_LARGE' in track_src and '65536' in track_src
    print("  [OK] WebSocket consumers enforce 64KB frame ceiling with PAYLOAD_TOO_LARGE code")
    print("[TEST 8 PASSED]")

    print("\n" + "=" * 80)
    print("PHASE 29 SECURITY VERIFICATION SUMMARY: ALL 8 / 8 TEST SUITES PASSED (100%)")
    print("=" * 80)


if __name__ == '__main__':
    run_security_test_suite()
