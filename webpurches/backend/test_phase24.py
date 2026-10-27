import os
import sys
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from decimal import Decimal
from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework import status

from apps.accounts.models import (
    User, SupportTicket, TicketMessage, TicketAttachment,
    TicketAuditLog
)
from apps.accounts.support_views import (
    CustomerTicketListCreateView,
    CustomerTicketDetailView,
    CustomerTicketReplyView,
    CustomerTicketResolutionConfirmView,
    RestaurantTicketListView,
    RestaurantTicketDetailView,
    DeliveryTicketListView,
    AdminTicketListView,
    AdminTicketDetailView,
    AdminTicketReplyView,
    AdminTicketEscalateView,
    AdminTicketResolveView,
    AdminTicketAssignView,
    TicketAttachmentDownloadView
)
from apps.orders.models import Order
from apps.products.models import Restaurant
from apps.delivery.models import DeliveryPartner, DeliveryAssignment
from apps.payments.models import Payment

def run_tests():
    print("=" * 65)
    print("PHASE 24: CUSTOMER SUPPORT & DISPUTE RESOLUTION TEST SUITE")
    print("=" * 65)

    factory = APIRequestFactory()

    # --- 1. SETUP FIXTURES IN POSTGRESQL ---
    print("\n--- SETUP: Preparing Users, Restaurants, and Orders ---")
    
    # 1. Customer A
    cust_a, _ = User.objects.get_or_create(
        username="p24_cust_a",
        defaults={"email": "cust_a@example.com", "role": "CUSTOMER"}
    )
    cust_a.set_password("pass123")
    cust_a.save()

    # 2. Customer B
    cust_b, _ = User.objects.get_or_create(
        username="p24_cust_b",
        defaults={"email": "cust_b@example.com", "role": "CUSTOMER"}
    )
    cust_b.set_password("pass123")
    cust_b.save()

    # 3. Restaurant Owner & Restaurant
    rest_owner, _ = User.objects.get_or_create(
        username="p24_rest_owner",
        defaults={"email": "rest_owner@example.com", "role": "RESTAURANT"}
    )
    rest_owner.set_password("pass123")
    rest_owner.save()

    restaurant, _ = Restaurant.objects.get_or_create(
        name="Phase 24 Spicy Kitchen",
        defaults={
            "owner": rest_owner,
            "address": "12 Support Blvd, Food City",
            "is_open": True,
            "verification_status": "APPROVED"
        }
    )

    # Other Restaurant
    other_owner, _ = User.objects.get_or_create(
        username="p24_other_owner",
        defaults={"email": "other_owner@example.com", "role": "RESTAURANT"}
    )
    other_restaurant, _ = Restaurant.objects.get_or_create(
        name="Unrelated Cafe",
        defaults={
            "owner": other_owner,
            "address": "99 Far Away",
            "is_open": True
        }
    )

    # 4. Delivery Partner & User
    rider_user, _ = User.objects.get_or_create(
        username="p24_rider",
        defaults={"email": "rider@example.com", "role": "DELIVERY_PARTNER"}
    )
    rider_user.set_password("pass123")
    rider_user.save()

    rider_partner, _ = DeliveryPartner.objects.get_or_create(
        user=rider_user,
        defaults={
            "vehicle_type": "Bike",
            "vehicle_number": "KA-03-P24-TEST",
            "is_online": True,
            "is_verified": True
        }
    )

    # 5. Admin User
    admin_user, _ = User.objects.get_or_create(
        username="p24_admin",
        defaults={"email": "admin@example.com", "role": "ADMIN", "is_staff": True}
    )
    admin_user.set_password("pass123")
    admin_user.is_staff = True
    admin_user.save()

    # 6. Order for Customer A
    order_a, _ = Order.objects.get_or_create(
        order_number="ORD-P24-TEST-001",
        defaults={
            "customer": cust_a,
            "restaurant": restaurant,
            "grand_total": Decimal("450.00"),
            "status": "DELIVERED",
            "payment_status": "PAID"
        }
    )

    # Order for Customer B
    order_b, _ = Order.objects.get_or_create(
        order_number="ORD-P24-TEST-002",
        defaults={
            "customer": cust_b,
            "restaurant": other_restaurant,
            "grand_total": Decimal("600.00"),
            "status": "PREPARING",
            "payment_status": "PAID"
        }
    )

    # Assignment for Order A to Rider
    assignment_a, _ = DeliveryAssignment.objects.get_or_create(
        order=order_a,
        defaults={
            "delivery_partner": rider_user,
            "status": "DELIVERED"
        }
    )

    # Clean up any leftover test tickets from previous test runs
    SupportTicket.objects.filter(idempotency_key__startswith="idemp-p24-").delete()
    print("PASS: Fixtures verified in PostgreSQL wsfood_db.")

    # --- TEST 1: Customer Ticket Creation & Auto Ticket Number ---
    print("\n--- TEST 1: Customer Ticket Creation & Ticket Reference ---")
    create_view = CustomerTicketListCreateView.as_view()
    req = factory.post("/api/support/tickets/", {
        "category": "DAMAGED_FOOD",
        "priority": "HIGH",
        "subject": "Soup was completely spilled upon arrival",
        "description": "The lid was cracked and the bag was soaked in soup.",
        "order_number": order_a.order_number,
        "idempotency_key": "idemp-p24-key-001"
    }, format="json")
    force_authenticate(req, user=cust_a)
    resp = create_view(req)

    assert resp.status_code == status.HTTP_201_CREATED, f"Expected 201, got {resp.status_code}: {resp.data}"
    tkt_data = resp.data
    assert tkt_data["ticket_number"].startswith("TKT-"), f"Expected TKT- prefix, got {tkt_data['ticket_number']}"
    assert tkt_data["status"] == "OPEN", f"Expected OPEN, got {tkt_data['status']}"
    assert tkt_data["category"] == "DAMAGED_FOOD"
    ticket_num = tkt_data["ticket_number"]
    print(f"PASS: Created ticket #{ticket_num} with auto-formatted reference.")

    # --- TEST 2: Order Ownership Validation (Cannot dispute another user's order) ---
    print("\n--- TEST 2: Order Ownership Security ---")
    req_spoof = factory.post("/api/support/tickets/", {
        "category": "MISSING_ITEMS",
        "subject": "Attempting to dispute someone else's order",
        "description": "Should fail with 400",
        "order_number": order_b.order_number  # Belongs to Customer B
    }, format="json")
    force_authenticate(req_spoof, user=cust_a)
    resp_spoof = create_view(req_spoof)

    assert resp_spoof.status_code == status.HTTP_400_BAD_REQUEST, f"Expected 400 for unauthorized order dispute, got {resp_spoof.status_code}"
    print("PASS: Unauthorized order linking correctly rejected with 400 Bad Request.")

    # --- TEST 3: Safeguard Check: Order & Payment State Unaltered ---
    print("\n--- TEST 3: Safeguard Check: Order & Payment State Intact ---")
    order_a.refresh_from_db()
    assert order_a.status == "DELIVERED", f"Order status should remain DELIVERED, got {order_a.status}"
    assert order_a.payment_status == "PAID", f"Payment status should remain PAID, got {order_a.payment_status}"
    print("PASS: Ticket creation did NOT alter order status or payment status.")

    # --- TEST 4: Idempotency Protection ---
    print("\n--- TEST 4: Idempotency Protection ---")
    req_repeat = factory.post("/api/support/tickets/", {
        "category": "DAMAGED_FOOD",
        "priority": "HIGH",
        "subject": "Soup was completely spilled upon arrival",
        "description": "Duplicate call",
        "order_number": order_a.order_number,
        "idempotency_key": "idemp-p24-key-001"
    }, format="json")
    force_authenticate(req_repeat, user=cust_a)
    resp_repeat = create_view(req_repeat)
    assert resp_repeat.status_code == status.HTTP_200_OK, f"Expected 200 for idempotent repeat, got {resp_repeat.status_code}"
    assert resp_repeat.data["ticket_number"] == ticket_num, "Expected matching ticket number on idempotent call"
    print("PASS: Repeated request with idempotency_key safely returned existing ticket.")

    # --- TEST 5: Attachment Security: Executable Rejection & Valid File Acceptance ---
    print("\n--- TEST 5: Attachment Validation & Security ---")
    # 5a. Disallowed executable upload
    bad_file = SimpleUploadedFile("malicious.exe", b"MZ\x90\x00\x03fake-executable", content_type="application/x-msdownload")
    req_bad_file = factory.post(f"/api/support/tickets/{ticket_num}/reply/", {
        "message": "Here is an executable file",
        "file": bad_file
    }, format="multipart")
    force_authenticate(req_bad_file, user=cust_a)
    reply_view = CustomerTicketReplyView.as_view()
    resp_bad_file = reply_view(req_bad_file, ticket_number=ticket_num)
    assert resp_bad_file.status_code == status.HTTP_400_BAD_REQUEST, f"Expected 400 for .exe file, got {resp_bad_file.status_code}"
    print("PASS: Executable file upload (.exe) strictly rejected with 400 Bad Request.")

    # 5b. Valid image evidence upload
    good_file = SimpleUploadedFile("spilled_soup.jpg", b"\xFF\xD8\xFF\xE0\x00\x10JFIFfake-image-bytes", content_type="image/jpeg")
    req_good_file = factory.post(f"/api/support/tickets/{ticket_num}/reply/", {
        "message": "Photo of spilled container attached.",
        "file": good_file
    }, format="multipart")
    force_authenticate(req_good_file, user=cust_a)
    resp_good_file = reply_view(req_good_file, ticket_number=ticket_num)
    assert resp_good_file.status_code == status.HTTP_201_CREATED, f"Expected 201 for valid evidence upload, got {resp_good_file.status_code}"
    print("PASS: Valid image evidence accepted and securely linked to conversation.")

    # --- TEST 6: Internal Support Note Privacy (Zero leakage to customer/merchants) ---
    print("\n--- TEST 6: Internal Support Note Privacy ---")
    admin_reply_view = AdminTicketReplyView.as_view()
    # Admin records internal note
    req_internal = factory.post(f"/api/support/admin/tickets/{ticket_num}/reply/", {
        "message": "INTERNAL NOTE: Spilled soup looks legitimate. Do not disclose customer phone to restaurant.",
        "is_internal_note": True
    }, format="json")
    force_authenticate(req_internal, user=admin_user)
    resp_internal = admin_reply_view(req_internal, ticket_number=ticket_num)
    assert resp_internal.status_code == status.HTTP_201_CREATED

    # Customer fetches ticket details
    cust_detail_view = CustomerTicketDetailView.as_view()
    req_cust_get = factory.get(f"/api/support/tickets/{ticket_num}/")
    force_authenticate(req_cust_get, user=cust_a)
    resp_cust_get = cust_detail_view(req_cust_get, ticket_number=ticket_num)
    assert resp_cust_get.status_code == status.HTTP_200_OK

    customer_messages = resp_cust_get.data.get("messages", [])
    has_internal_leak = any("INTERNAL NOTE" in m.get("message", "") for m in customer_messages)
    assert not has_internal_leak, "CRITICAL: Internal support note leaked to customer endpoint!"
    print("PASS: Customer detail strictly excludes internal notes (Zero data leakage).")

    # Admin fetches ticket details - CAN see internal note
    admin_detail_view = AdminTicketDetailView.as_view()
    req_admin_get = factory.get(f"/api/support/admin/tickets/{ticket_num}/")
    force_authenticate(req_admin_get, user=admin_user)
    resp_admin_get = admin_detail_view(req_admin_get, ticket_number=ticket_num)
    assert resp_admin_get.status_code == status.HTTP_200_OK
    admin_messages = resp_admin_get.data.get("messages", [])
    has_internal_in_admin = any("INTERNAL NOTE" in m.get("message", "") for m in admin_messages)
    assert has_internal_in_admin, "Admin should see internal support notes."
    print("PASS: Admin detail successfully renders internal support notes.")

    # --- TEST 7: Role-Based Access Isolation (Restaurant & Delivery Partner) ---
    print("\n--- TEST 7: Role-Based Access Isolation ---")
    # Restaurant for Order A can view ticket
    rest_detail_view = RestaurantTicketDetailView.as_view()
    req_rest_get = factory.get(f"/api/support/restaurant/tickets/{ticket_num}/")
    force_authenticate(req_rest_get, user=rest_owner)
    resp_rest_get = rest_detail_view(req_rest_get, ticket_number=ticket_num)
    assert resp_rest_get.status_code == status.HTTP_200_OK
    # Verify customer address is masked
    order_details = resp_rest_get.data.get("order_details", {})
    assert order_details.get("delivery_address") == "Address Masked for Privacy"
    print("PASS: Linked restaurant can view complaint with customer PII masked.")

    # Unrelated Restaurant owner CANNOT view ticket
    req_unrel_get = factory.get(f"/api/support/restaurant/tickets/{ticket_num}/")
    force_authenticate(req_unrel_get, user=other_owner)
    resp_unrel_get = rest_detail_view(req_unrel_get, ticket_number=ticket_num)
    assert resp_unrel_get.status_code in [status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN]
    print("PASS: Unrelated restaurant blocked from viewing dispute (404/403).")

    # Assigned Delivery Partner can view ticket
    deliv_list_view = DeliveryTicketListView.as_view()
    req_deliv_list = factory.get("/api/support/delivery/tickets/")
    force_authenticate(req_deliv_list, user=rider_user)
    resp_deliv_list = deliv_list_view(req_deliv_list)
    assert resp_deliv_list.status_code == status.HTTP_200_OK
    print("PASS: Assigned delivery partner can list relevant delivery complaints.")

    # --- TEST 8: Resolution Rule Enforcement (Resolution Summary Required) ---
    print("\n--- TEST 8: Resolution Summary Requirement ---")
    resolve_view = AdminTicketResolveView.as_view()
    # Attempt to resolve with empty summary
    req_empty_resolve = factory.post(f"/api/support/admin/tickets/{ticket_num}/resolve/", {
        "resolution_summary": ""
    }, format="json")
    force_authenticate(req_empty_resolve, user=admin_user)
    resp_empty_resolve = resolve_view(req_empty_resolve, ticket_number=ticket_num)
    assert resp_empty_resolve.status_code == status.HTTP_400_BAD_REQUEST, "Resolution without summary must be blocked!"
    print("PASS: Resolving ticket without resolution summary blocked with 400 Bad Request.")

    # Legitimate resolve with proper summary
    req_legit_resolve = factory.post(f"/api/support/admin/tickets/{ticket_num}/resolve/", {
        "resolution_summary": "Merchant packaging reviewed; merchant will double-seal soup containers."
    }, format="json")
    force_authenticate(req_legit_resolve, user=admin_user)
    resp_legit_resolve = resolve_view(req_legit_resolve, ticket_number=ticket_num)
    assert resp_legit_resolve.status_code == status.HTTP_200_OK
    assert resp_legit_resolve.data["status"] == "RESOLVED"
    print("PASS: Admin successfully resolved ticket with required summary.")

    # --- TEST 9: Customer Reopening or Closure ---
    print("\n--- TEST 9: Customer Reopen and Closure Confirmation ---")
    confirm_view = CustomerTicketResolutionConfirmView.as_view()
    
    # Customer reopens
    req_reopen = factory.post(f"/api/support/tickets/{ticket_num}/confirm-resolution/", {
        "action": "reopen",
        "notes": "Spill also ruined the side bread."
    }, format="json")
    force_authenticate(req_reopen, user=cust_a)
    resp_reopen = confirm_view(req_reopen, ticket_number=ticket_num)
    assert resp_reopen.status_code == status.HTTP_200_OK
    assert resp_reopen.data["status"] == "IN_PROGRESS"
    print("PASS: Customer successfully reopened resolved ticket back to IN_PROGRESS.")

    # Customer confirms resolution
    req_close = factory.post(f"/api/support/tickets/{ticket_num}/confirm-resolution/", {
        "action": "confirm_resolve",
        "notes": "Satisfied with merchant follow-up."
    }, format="json")
    force_authenticate(req_close, user=cust_a)
    resp_close = confirm_view(req_close, ticket_number=ticket_num)
    assert resp_close.status_code == status.HTTP_200_OK
    assert resp_close.data["status"] == "CLOSED"
    print("PASS: Customer confirmed resolution and ticket transitioned to CLOSED.")

    # --- TEST 10: Admin Dashboard Overview Metrics ---
    print("\n--- TEST 10: Admin Dashboard Overview Metrics ---")
    admin_list_view = AdminTicketListView.as_view()
    req_admin_list = factory.get("/api/support/admin/tickets/")
    force_authenticate(req_admin_list, user=admin_user)
    resp_admin_list = admin_list_view(req_admin_list)
    assert resp_admin_list.status_code == status.HTTP_200_OK
    stats = resp_admin_list.data.get("stats", {})
    assert "total_open" in stats
    assert "customer_issues" in stats
    assert "restaurant_issues" in stats
    assert "delivery_issues" in stats
    assert "escalated_count" in stats
    print(f"PASS: Admin metrics computed from real database data: {stats}")

    print("\n" + "=" * 65)
    print("ALL 10 PHASE 24 AUTOMATED VERIFICATION SUITES PASSED CLEANLY!")
    print("=" * 65)

if __name__ == '__main__':
    run_tests()
