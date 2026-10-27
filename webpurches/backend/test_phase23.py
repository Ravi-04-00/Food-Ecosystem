import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from decimal import Decimal
from django.utils import timezone
from apps.accounts.models import User
from apps.products.models import Restaurant
from apps.orders.models import Order
from apps.delivery.models import (
    DeliveryPartner,
    DeliveryAssignment,
    DeliveryOffer,
    DeliveryAssignmentHistory
)
from apps.delivery.dispatch_service import (
    haversine_distance,
    find_best_partner_candidates,
    dispatch_order_offer,
    accept_offer_concurrency_safe,
    reject_offer_and_progress,
    expire_offer_and_progress,
    admin_manual_reassign
)

def run_tests():
    print("=" * 70)
    print("PHASE 23: SMART DELIVERY DISPATCH & PARTNER MATCHING TEST SUITE")
    print("=" * 70)

    # 1. Haversine Distance Calculation Test
    print("\n--- TEST 1: Haversine GPS Distance & Fallback Verification ---")
    # Distance between Indiranagar (12.9785, 77.6015) and MG Road (12.9750, 77.5980) is ~0.53 km
    dist = haversine_distance(12.9785, 77.6015, 12.9750, 77.5980)
    assert 0.3 <= dist <= 0.8, f"Expected ~0.5km, got {dist}"
    print(f"PASS: Distance calculation Indiranagar -> MG Road = {dist} km")

    # Fallback coordinates handling
    fallback_dist = haversine_distance("invalid", None, 12.9750, 77.5980)
    assert fallback_dist == 5.0, f"Expected 5.0 fallback, got {fallback_dist}"
    print(f"PASS: Invalid GPS coordinates handled gracefully with fallback = {fallback_dist} km")

    # 2. Setup Test Fixtures in PostgreSQL
    print("\n--- SETUP: Preparing Test Users & Restaurant in PostgreSQL ---")
    customer, _ = User.objects.get_or_create(
        username='test_p23_customer',
        defaults={'email': 'cust_p23@test.io', 'role': 'CUSTOMER'}
    )
    admin_user, _ = User.objects.get_or_create(
        username='test_p23_admin',
        defaults={'email': 'admin_p23@test.io', 'role': 'ADMIN', 'is_staff': True}
    )

    rest_owner, _ = User.objects.get_or_create(
        username='test_p23_rest_owner',
        defaults={'email': 'owner_p23@test.io', 'role': 'RESTAURANT'}
    )
    restaurant, _ = Restaurant.objects.get_or_create(
        name='Test P23 Cyber Bistro',
        defaults={
            'owner': rest_owner,
            'address': 'Indiranagar 100ft Road',
            'latitude': Decimal('12.978000'),
            'longitude': Decimal('77.601000'),
            'verification_status': 'APPROVED'
        }
    )

    # Create 3 Delivery Partners with different proximities & online states
    # Partner 1: Close (0.5 km), Online, Approved
    rider1_user, _ = User.objects.get_or_create(
        username='test_p23_rider_close',
        defaults={'email': 'rider_close@test.io', 'role': 'DELIVERY'}
    )
    partner1, _ = DeliveryPartner.objects.get_or_create(
        user=rider1_user,
        defaults={
            'vehicle_number': 'KA-03-P23-01',
            'verification_status': 'APPROVED',
            'is_verified': True,
            'is_online': True,
            'current_latitude': Decimal('12.975000'),
            'current_longitude': Decimal('77.598000'),
            'rating': Decimal('4.95'),
            'last_location_updated_at': timezone.now()
        }
    )
    partner1.vehicle_number = 'KA-03-P23-01'
    partner1.is_online = True
    partner1.is_verified = True
    partner1.verification_status = 'APPROVED'
    partner1.active_order = None
    partner1.current_latitude = Decimal('12.975000')
    partner1.current_longitude = Decimal('77.598000')
    partner1.last_location_updated_at = timezone.now()
    partner1.save()

    # Partner 2: Far (4.5 km), Online, Approved
    rider2_user, _ = User.objects.get_or_create(
        username='test_p23_rider_far',
        defaults={'email': 'rider_far@test.io', 'role': 'DELIVERY'}
    )
    partner2, _ = DeliveryPartner.objects.get_or_create(
        user=rider2_user,
        defaults={
            'vehicle_number': 'KA-03-P23-02',
            'verification_status': 'APPROVED',
            'is_verified': True,
            'is_online': True,
            'current_latitude': Decimal('12.940000'),
            'current_longitude': Decimal('77.620000'),
            'rating': Decimal('4.80'),
            'last_location_updated_at': timezone.now()
        }
    )
    partner2.vehicle_number = 'KA-03-P23-02'
    partner2.is_online = True
    partner2.is_verified = True
    partner2.verification_status = 'APPROVED'
    partner2.active_order = None
    partner2.current_latitude = Decimal('12.940000')
    partner2.current_longitude = Decimal('77.620000')
    partner2.last_location_updated_at = timezone.now()
    partner2.save()

    # Partner 3: Stale location (null), Online, Approved
    rider3_user, _ = User.objects.get_or_create(
        username='test_p23_rider_stale',
        defaults={'email': 'rider_stale@test.io', 'role': 'DELIVERY'}
    )
    partner3, _ = DeliveryPartner.objects.get_or_create(
        user=rider3_user,
        defaults={
            'vehicle_number': 'KA-03-P23-03',
            'verification_status': 'APPROVED',
            'is_verified': True,
            'is_online': True,
            'current_latitude': Decimal('0.000000'),
            'current_longitude': Decimal('0.000000'),
            'rating': Decimal('4.70'),
            'last_location_updated_at': None
        }
    )
    partner3.vehicle_number = 'KA-03-P23-03'
    partner3.is_online = True
    partner3.is_verified = True
    partner3.verification_status = 'APPROVED'
    partner3.active_order = None
    partner3.last_location_updated_at = None
    partner3.save()

    # Clean up previous assignments for test partners
    DeliveryAssignment.objects.filter(delivery_partner__in=[rider1_user, rider2_user, rider3_user]).delete()
    print("PASS: Fixtures ready in PostgreSQL wsfood_db.")

    # 3. Test Ineligible Order Dispatch
    print("\n--- TEST 2: Order Eligibility Validation ---")
    ineligible_order = Order.objects.create(
        order_number=f"TEST-P23-INELIGIBLE-{int(timezone.now().timestamp())}",
        customer=customer,
        restaurant=restaurant,
        status='PREPARING',  # Ineligible: Not ready yet
        payment_status='PAID',
        delivery_fee=Decimal('35.00')
    )
    res_ineligible = dispatch_order_offer(ineligible_order)
    assert res_ineligible['status'] == 'ineligible_order_status', f"Expected ineligible_order_status, got {res_ineligible}"
    print(f"PASS: Ineligible order in PREPARING correctly rejected with: {res_ineligible['status']}")

    unpaid_order = Order.objects.create(
        order_number=f"TEST-P23-UNPAID-{int(timezone.now().timestamp())}",
        customer=customer,
        restaurant=restaurant,
        status='READY_FOR_PICKUP',
        payment_status='FAILED',  # Ineligible: payment failed
        delivery_fee=Decimal('35.00')
    )
    res_unpaid = dispatch_order_offer(unpaid_order)
    assert res_unpaid['status'] == 'unverified_payment', f"Expected unverified_payment, got {res_unpaid}"
    print(f"PASS: Order with FAILED payment status correctly rejected with: {res_unpaid['status']}")

    # 4. Partner Candidate Ranking & Distance Scoring
    print("\n--- TEST 3: Candidate Ranking by Proximity & Score ---")
    ready_order = Order.objects.create(
        order_number=f"TEST-P23-READY-{int(timezone.now().timestamp())}",
        customer=customer,
        restaurant=restaurant,
        status='READY_FOR_PICKUP',
        payment_status='PAID',
        delivery_fee=Decimal('45.00'),
        restaurant_lat=Decimal('12.978000'),
        restaurant_lng=Decimal('77.601000')
    )
    candidates = find_best_partner_candidates(ready_order)
    assert len(candidates) >= 2, f"Expected >= 2 candidates, got {len(candidates)}"
    best_candidate, best_dist, best_score = candidates[0]
    print(f"Rank 1: {best_candidate.user.username} (dist: {best_dist}km, score: {best_score})")
    assert best_candidate.user == rider1_user, f"Expected closest rider1_user to rank #1, got {best_candidate.user.username}"
    print("PASS: Proximity ranking selected closest partner as Rank 1.")

    # 5. Sequential Offer Dispatch & Idempotency
    print("\n--- TEST 4: Sequential Offer Dispatch & Idempotency ---")
    dispatch_res1 = dispatch_order_offer(ready_order)
    assert dispatch_res1['status'] == 'offered', f"Expected offered, got {dispatch_res1}"
    assert dispatch_res1['partner'] == rider1_user.username, f"Expected {rider1_user.username}, got {dispatch_res1['partner']}"
    assert dispatch_res1['attempt_number'] == 1, f"Expected attempt 1, got {dispatch_res1['attempt_number']}"
    offer1_id = dispatch_res1['offer_id']
    print(f"PASS: Offer #1 dispatched to {rider1_user.username} (Offer ID: {offer1_id})")

    # Immediate duplicate trigger should be idempotent
    dispatch_res_dup = dispatch_order_offer(ready_order)
    assert dispatch_res_dup['status'] == 'offer_pending', f"Expected offer_pending, got {dispatch_res_dup}"
    print("PASS: Duplicate dispatch trigger is idempotent; returned offer_pending.")

    # 6. Offer Expiration & Auto-progression to Next Partner
    print("\n--- TEST 5: Expiration Handling & Progression to Next Candidate ---")
    offer1 = DeliveryOffer.objects.get(pk=offer1_id)
    # Simulate timeout by moving expires_at into the past
    offer1.expires_at = timezone.now() - timezone.timedelta(seconds=10)
    offer1.save(update_fields=['expires_at'])

    # Expire and auto-progress
    expire_offer_and_progress(offer1_id)
    offer1.refresh_from_db()
    assert offer1.status == 'EXPIRED', f"Expected EXPIRED, got {offer1.status}"
    print(f"PASS: Offer #1 transitioned to EXPIRED.")

    # Verify assignment has now progressed to Attempt #2 with the next candidate (rider2_user or rider3_user)
    assignment = DeliveryAssignment.objects.get(order=ready_order)
    assert assignment.status == 'OFFERED', f"Expected assignment OFFERED, got {assignment.status}"
    assert assignment.attempt_count == 2, f"Expected attempt 2, got {assignment.attempt_count}"
    offer2 = DeliveryOffer.objects.filter(assignment=assignment, status='OFFERED').first()
    assert offer2 is not None, "Expected new active offer for attempt #2"
    assert offer2.delivery_partner != rider1_user, f"Expected different candidate for attempt 2, got {offer2.delivery_partner.username}"
    assert offer2.attempt_number == 2, f"Expected attempt_number == 2, got {offer2.attempt_number}"
    print(f"PASS: Automated progression created Offer #2 for {offer2.delivery_partner.username} (Attempt #{offer2.attempt_number})")

    # 7. Offer Rejection & Progression to Candidate #3
    print("\n--- TEST 6: Rejection Handling & Next Candidate Dispatch ---")
    succ_rej, res_rej, code_rej = reject_offer_and_progress(offer2.id, offer2.delivery_partner, reason="Too far away from current zone")
    assert succ_rej is True, f"Rejection failed: {res_rej}"
    assert code_rej == 200
    offer2.refresh_from_db()
    assert offer2.status == 'REJECTED'
    print(f"PASS: Offer #2 successfully rejected with reason '{offer2.rejection_reason}'.")

    # Verify assignment progressed to Attempt #3
    assignment.refresh_from_db()
    assert assignment.attempt_count == 3, f"Expected attempt 3, got {assignment.attempt_count}"
    offer3 = DeliveryOffer.objects.filter(assignment=assignment, status='OFFERED').first()
    assert offer3 is not None, "Expected new offer for attempt #3"
    assert offer3.delivery_partner not in [rider1_user, offer2.delivery_partner], f"Candidate must be different from previous attempts"
    assert offer3.attempt_number == 3
    print(f"PASS: Automated progression created Offer #3 for {offer3.delivery_partner.username} (Attempt #{offer3.attempt_number})")

    # 8. Max Retries Limit Protection
    print("\n--- TEST 7: Max Retries Exhaustion Protection ---")
    # Simulate candidate 3 rejecting as well
    reject_offer_and_progress(offer3.id, offer3.delivery_partner, reason="Shift ending")
    assignment.refresh_from_db()
    # Since 3 retries (max_retries) were exhausted, assignment status should be AWAITING_PARTNER without infinite loop
    assert assignment.status == 'AWAITING_PARTNER', f"Expected AWAITING_PARTNER, got {assignment.status}"
    print(f"PASS: Retries capped at max_retries ({assignment.attempt_count}); status is AWAITING_PARTNER.")

    # 9. Concurrency-Safe Partner Acceptance & Double-Claim Protection
    print("\n--- TEST 8: Concurrency Protection (select_for_update) & Double-Claim Block ---")
    order_concur = Order.objects.create(
        order_number=f"TEST-P23-CONCUR-{int(timezone.now().timestamp())}",
        customer=customer,
        restaurant=restaurant,
        status='READY_FOR_PICKUP',
        payment_status='PAID',
        delivery_fee=Decimal('40.00'),
        restaurant_lat=Decimal('12.978000'),
        restaurant_lng=Decimal('77.601000')
    )
    # Clear active orders on partner1 and partner2
    partner1.active_order = None
    partner1.save()
    partner2.active_order = None
    partner2.save()

    dispatch_res = dispatch_order_offer(order_concur)
    offer_concur_id = dispatch_res['offer_id']
    offer_concur = DeliveryOffer.objects.get(pk=offer_concur_id)

    # 1st Partner accepts legitimately
    succ1, res1, code1 = accept_offer_concurrency_safe(offer_concur_id, offer_concur.delivery_partner)
    assert succ1 is True, f"Legitimate accept failed: {res1}"
    assert code1 == 200
    print(f"PASS: Legitimate acceptance by {offer_concur.delivery_partner.username} succeeded.")

    # Another partner tries to accept the same order
    succ2, res2, code2 = accept_offer_concurrency_safe(offer_concur_id, rider2_user)
    assert succ2 is False, f"Unauthorized accept should fail"
    assert code2 == 403, f"Expected 403 Forbidden, got {code2}"
    print("PASS: Unauthorized partner acceptance blocked (403 Forbidden).")

    # Check order is locked and rider bound
    order_concur.refresh_from_db()
    assert order_concur.rider == offer_concur.delivery_partner
    print("PASS: Order rider locked to winning partner.")

    # 10. Expired Offer Acceptance Rejection
    print("\n--- TEST 9: Expired Offer Acceptance Rejection ---")
    order_exp = Order.objects.create(
        order_number=f"TEST-P23-EXPIRED-{int(timezone.now().timestamp())}",
        customer=customer,
        restaurant=restaurant,
        status='READY_FOR_PICKUP',
        payment_status='PAID',
        delivery_fee=Decimal('40.00')
    )
    # Clear partner2 active order
    partner2.active_order = None
    partner2.save()

    assign_exp = DeliveryAssignment.objects.create(order=order_exp, status='OFFERED')
    offer_exp = DeliveryOffer.objects.create(
        assignment=assign_exp,
        delivery_partner=rider2_user,
        status='OFFERED',
        attempt_number=1,
        distance_km=Decimal('2.0'),
        matching_score=Decimal('45.0'),
        estimated_payout=Decimal('75.0'),
        expires_at=timezone.now() - timezone.timedelta(seconds=20)  # already expired
    )
    succ_exp, res_exp, code_exp = accept_offer_concurrency_safe(offer_exp.id, rider2_user)
    assert succ_exp is False, "Expired offer acceptance should be rejected"
    assert code_exp == 400
    assert "expired" in str(res_exp).lower()
    print("PASS: Expired offer acceptance correctly rejected with 400 Bad Request.")

    # 11. Admin Manual Reassignment with Strict Validation
    print("\n--- TEST 10: Admin Manual Reassignment ---")
    order_reassign = Order.objects.create(
        order_number=f"TEST-P23-REASSIGN-{int(timezone.now().timestamp())}",
        customer=customer,
        restaurant=restaurant,
        status='READY_FOR_PICKUP',
        payment_status='PAID',
        delivery_fee=Decimal('50.00')
    )
    assign_reassign = DeliveryAssignment.objects.create(
        order=order_reassign,
        status='AWAITING_PARTNER'
    )
    partner2.active_order = None
    partner2.save()

    # Admin reassigns to partner 2
    succ_admin, res_admin, code_admin = admin_manual_reassign(
        assignment_id=assign_reassign.id,
        target_user_id=rider2_user.id,
        admin_user=admin_user,
        reason="Manual priority VIP dispatch"
    )
    assert succ_admin is True, f"Admin reassignment failed: {res_admin}"
    assert code_admin == 200

    assign_reassign.refresh_from_db()
    order_reassign.refresh_from_db()
    assert assign_reassign.status == 'ACCEPTED'
    assert assign_reassign.delivery_partner == rider2_user
    assert order_reassign.rider == rider2_user
    print(f"PASS: Admin successfully manually reassigned Order #{order_reassign.order_number} to {rider2_user.username}.")

    # Non-admin attempt should be rejected
    succ_non_admin, res_non_admin, code_non_admin = admin_manual_reassign(
        assignment_id=assign_reassign.id,
        target_user_id=rider1_user.id,
        admin_user=customer,  # Customer is not admin
        reason="Unauthorized attempt"
    )
    assert succ_non_admin is False
    assert code_non_admin == 403
    print("PASS: Non-admin manual reassignment rejected with 403 Forbidden.")

    print("\n" + "=" * 70)
    print("ALL 10 TEST SUITES PASSED CLEANLY AGAINST POSTGRESQL!")
    print("=" * 70)

if __name__ == '__main__':
    run_tests()
