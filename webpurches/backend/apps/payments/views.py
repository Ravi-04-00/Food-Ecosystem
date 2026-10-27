import json
import logging
import uuid
from decimal import Decimal

from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework import views, permissions, status
from rest_framework.response import Response

from apps.accounts.models import Wallet, WalletTransaction
from apps.orders.models import Order, OrderStatusHistory
from .models import Payment, Transaction as TxnModel, PaymentWebhook
from .serializers import (
    PaymentSerializer,
    TransactionSerializer,
    PaymentInitializeInputSerializer,
    PaymentVerifyInputSerializer,
    PaymentFailureInputSerializer,
)
from .razorpay_service import razorpay_service
from apps.notifications.dispatcher import safe_dispatch_on_commit
from apps.adminpanel.permissions import IsAdminUser, create_admin_audit_log

logger = logging.getLogger(__name__)


class PaymentInitializeView(views.APIView):
    """
    POST /api/payments/initialize/
    Initiate or reuse a payment order with Razorpay for an authenticated customer's order.
    Amount is strictly calculated server-side from PostgreSQL order records.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PaymentInitializeInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        order_identifier = str(serializer.validated_data['order_id']).strip()
        payment_method = serializer.validated_data.get('payment_method', 'UPI')

        # 1. Look up Order by PK or order_number
        order = None
        if order_identifier.isdigit():
            order = Order.objects.filter(pk=int(order_identifier)).first()
        if not order:
            order = Order.objects.filter(order_number=order_identifier).first()

        if not order:
            return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        # 2. Strict Customer Ownership Check
        if order.customer != request.user and not request.user.is_staff:
            return Response(
                {'error': 'Unauthorized: You cannot initialize payment for another customer’s order.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # 3. Order Eligibility Check
        if order.status == 'CANCELLED':
            return Response({'error': 'Cannot pay for a cancelled order.'}, status=status.HTTP_400_BAD_REQUEST)

        if order.payment_status in ['PAID', 'VERIFIED_PAID', 'COMPLETED']:
            existing_payment = order.payments.filter(status='PAID').first()
            return Response({
                'already_paid': True,
                'message': 'This order has already been paid.',
                'order_id': order.id,
                'order_number': order.order_number,
                'payment': PaymentSerializer(existing_payment).data if existing_payment else None
            }, status=status.HTTP_200_OK)

        # 4. Server-Side Calculated Amount (Never trust frontend amount)
        order_amount_decimal = Decimal(str(order.total or order.grand_total or '0.00'))
        if order_amount_decimal <= Decimal('0.00'):
            return Response({'error': 'Invalid order amount.'}, status=status.HTTP_400_BAD_REQUEST)

        amount_minor_units = int(order_amount_decimal * 100)

        with transaction.atomic():
            # 5. Check if an active, matching pending payment already exists to prevent duplicate order generation
            active_payment = order.payments.filter(
                status__in=['PAYMENT_PENDING', 'PAYMENT_PROCESSING'],
                amount_minor_units=amount_minor_units,
                currency='INR'
            ).exclude(provider_order_id='').first()

            if active_payment:
                payment = active_payment
                provider_order_id = payment.provider_order_id
            else:
                # Create a payment order via Razorpay service
                razorpay_res = razorpay_service.create_order(
                    amount_minor_units=amount_minor_units,
                    currency='INR',
                    receipt=order.order_number,
                    notes={
                        'order_id': str(order.id),
                        'order_number': order.order_number,
                        'customer_id': str(request.user.id),
                    }
                )
                provider_order_id = razorpay_res.get('order_id') or razorpay_res.get('id') or ''

                payment = Payment.objects.create(
                    order=order,
                    payment_provider='RAZORPAY',
                    provider_order_id=provider_order_id,
                    amount=order_amount_decimal,
                    amount_minor_units=amount_minor_units,
                    currency='INR',
                    status='PAYMENT_PENDING',
                    payment_method=payment_method,
                    idempotency_key=str(uuid.uuid4())
                )

                order.payment_status = 'PAYMENT_PENDING'
                order.payment_method = payment_method
                order.save(update_fields=['payment_status', 'payment_method', 'updated_at'])

        return Response({
            'success': True,
            'order_id': order.id,
            'order_number': order.order_number,
            'payment_id': payment.id,
            'provider_order_id': provider_order_id,
            'amount': str(order_amount_decimal),
            'amount_minor_units': amount_minor_units,
            'currency': 'INR',
            'key_id': razorpay_service.get_public_key(),
            'payment_status': payment.status,
            'customer': {
                'name': request.user.get_full_name() or request.user.username,
                'email': request.user.email,
                'phone': getattr(request.user, 'phone', '') or ''
            }
        }, status=status.HTTP_200_OK)


class PaymentVerifyView(views.APIView):
    """
    POST /api/payments/verify/
    Verify Razorpay checkout HMAC-SHA256 signature and atomically mark payment as PAID.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PaymentVerifyInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        provider_order_id = serializer.validated_data['razorpay_order_id']
        provider_payment_id = serializer.validated_data['razorpay_payment_id']
        provider_signature = serializer.validated_data['razorpay_signature']

        # 1. Locate Payment record
        payment = Payment.objects.filter(provider_order_id=provider_order_id).first()
        if not payment:
            return Response({'error': 'Payment record for the specified order was not found.'}, status=status.HTTP_404_NOT_FOUND)

        # 2. Customer ownership verification
        if payment.order.customer != request.user and not request.user.is_staff:
            return Response(
                {'error': 'Unauthorized: Payment does not belong to the current authenticated customer.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # 3. Idempotent check: if already settled, return success
        if payment.status == 'PAID':
            return Response({
                'success': True,
                'message': 'Payment already verified.',
                'payment': PaymentSerializer(payment).data
            }, status=status.HTTP_200_OK)

        # 4. Cryptographic Signature Verification
        is_signature_valid = razorpay_service.verify_checkout_signature(
            provider_order_id=provider_order_id,
            provider_payment_id=provider_payment_id,
            provider_signature=provider_signature
        )

        if not is_signature_valid:
            payment.status = 'FAILED'
            payment.failure_code = 'BAD_SIGNATURE'
            payment.failure_description = 'Cryptographic signature verification failed.'
            payment.save(update_fields=['status', 'failure_code', 'failure_description', 'updated_at'])
            if payment.order and payment.order.customer:
                safe_dispatch_on_commit(
                    user=payment.order.customer,
                    event_type='payment.failed',
                    context={
                        'order_number': payment.order.order_number,
                        'reason': 'Cryptographic signature verification failed.'
                    },
                    idempotency_key=f"payment_failed_{payment.id}",
                    related_resource_type='Payment',
                    related_resource_id=payment.id
                )
            return Response({
                'success': False,
                'error': 'Payment verification failed: invalid signature.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # 5. Atomic state update (re-verify inside the lock; concurrent
        # duplicate verifies converge to the idempotent success below
        # instead of crashing on the unique transaction_id).
        with transaction.atomic():
            payment = Payment.objects.select_for_update().get(pk=payment.pk)
            if payment.status == 'PAID':
                return Response({
                    'success': True,
                    'message': 'Payment already verified.',
                    'payment': PaymentSerializer(payment).data
                }, status=status.HTTP_200_OK)
            payment.status = 'PAID'
            payment.provider_payment_id = provider_payment_id
            payment.provider_signature = provider_signature
            payment.verified_at = timezone.now()
            payment.save(update_fields=['status', 'provider_payment_id', 'provider_signature', 'verified_at', 'updated_at'])

            # Record charge transaction
            try:
                TxnModel.objects.create(
                    payment=payment,
                    transaction_id=provider_payment_id,
                    transaction_type='CHARGE',
                    amount=payment.amount,
                    is_success=True,
                    raw_response={
                        'provider': 'RAZORPAY',
                        'order_id': provider_order_id,
                        'payment_id': provider_payment_id
                    }
                )
            except IntegrityError:
                # A concurrent verify already recorded this charge: treat as
                # the idempotent success case instead of a 500.
                pass

            # Update Order
            order = payment.order
            order.payment_status = 'PAID'
            order.payment_method = payment.payment_method or 'Razorpay Online'
            order.save(update_fields=['payment_status', 'payment_method', 'updated_at'])

            OrderStatusHistory.objects.create(
                order=order,
                from_status=order.status,
                to_status=order.status,
                actor=request.user,
                actor_role='CUSTOMER',
                reason='Payment verified online via Razorpay HMAC signature'
            )

            if payment.order and payment.order.customer:
                safe_dispatch_on_commit(
                    user=payment.order.customer,
                    event_type='payment.succeeded',
                    context={
                        'order_number': payment.order.order_number,
                        'amount': str(payment.amount),
                        'payment_id': payment.provider_payment_id or str(payment.id),
                    },
                    idempotency_key=f"payment_succeeded_{payment.id}",
                    related_resource_type='Payment',
                    related_resource_id=payment.id
                )

        return Response({
            'success': True,
            'message': 'Payment verified and settled successfully.',
            'payment': PaymentSerializer(payment).data
        }, status=status.HTTP_200_OK)


class PaymentFailureReportView(views.APIView):
    """
    POST /api/payments/failure/
    Safely record payment cancellation or provider checkout failure.
    Rule: Never overwrite an existing PAID payment!
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PaymentFailureInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        provider_order_id = serializer.validated_data['provider_order_id']
        error_code = serializer.validated_data.get('error_code') or 'CHECKOUT_CANCELLED'
        error_desc = serializer.validated_data.get('error_description') or serializer.validated_data.get('reason') or 'Customer cancelled payment checkout'

        payment = Payment.objects.filter(provider_order_id=provider_order_id).first()
        if not payment:
            return Response({'error': 'Payment record not found.'}, status=status.HTTP_404_NOT_FOUND)

        if payment.order.customer != request.user and not request.user.is_staff:
            return Response({'error': 'Unauthorized.'}, status=status.HTTP_403_FORBIDDEN)

        # Protection: Never let failure overwrite an already settled payment
        if payment.status == 'PAID':
            return Response({
                'status': 'PAID',
                'message': 'Payment is already settled as PAID. Failure report disregarded.'
            }, status=status.HTTP_200_OK)

        payment.status = 'FAILED' if error_code != 'CHECKOUT_CANCELLED' else 'CANCELLED'
        payment.failure_code = error_code
        payment.failure_description = error_desc
        payment.save(update_fields=['status', 'failure_code', 'failure_description', 'updated_at'])

        order = payment.order
        if order.payment_status != 'PAID':
            order.payment_status = payment.status
            order.save(update_fields=['payment_status', 'updated_at'])

        if payment.order and payment.order.customer:
            safe_dispatch_on_commit(
                user=payment.order.customer,
                event_type='payment.failed',
                context={
                    'order_number': payment.order.order_number,
                    'reason': error_desc
                },
                idempotency_key=f"payment_failed_{payment.id}_{payment.status}",
                related_resource_type='Payment',
                related_resource_id=payment.id
            )

        return Response({
            'success': True,
            'status': payment.status,
            'message': 'Payment failure / cancellation logged safely.'
        }, status=status.HTTP_200_OK)


class PaymentStatusView(views.APIView):
    """
    GET /api/payments/status/<order_id>/
    Customer-scoped payment status inquiry for an order.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, order_id):
        order = None
        if str(order_id).isdigit():
            order = Order.objects.filter(pk=int(order_id)).first()
        if not order:
            order = Order.objects.filter(order_number=order_id).first()

        if not order:
            return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        if order.customer != request.user and not request.user.is_staff:
            return Response({'error': 'Unauthorized.'}, status=status.HTTP_403_FORBIDDEN)

        latest_payment = order.payments.order_by('-created_at').first()

        return Response({
            'order_id': order.id,
            'order_number': order.order_number,
            'order_status': order.status,
            'order_payment_status': order.payment_status,
            'grand_total': str(order.grand_total or order.total),
            'payment': PaymentSerializer(latest_payment).data if latest_payment else None
        }, status=status.HTTP_200_OK)


class PaymentWebhookView(views.APIView):
    """
    POST /api/payments/webhook/
    Receive and verify Razorpay Webhooks.
    Requires no user JWT.
    Enforces exact raw body HMAC verification, replay deduplication, and transactional updates.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        signature = request.headers.get('X-Razorpay-Signature', '')
        raw_body = request.body

        # 1. Cryptographic Webhook Signature Check
        is_verified = razorpay_service.verify_webhook_signature(raw_body, signature)
        if not is_verified:
            logger.warning("Rejected webhook with invalid signature.")
            return Response({'error': 'Invalid webhook signature.'}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Parse payload safely
        try:
            payload = json.loads(raw_body.decode('utf-8'))
        except Exception:
            return Response({'error': 'Malformed JSON payload.'}, status=status.HTTP_400_BAD_REQUEST)

        event_id = payload.get('event_id') or payload.get('id')
        event_type = payload.get('event', '')

        # 3. Replay Deduplication
        if event_id:
            existing_event = PaymentWebhook.objects.filter(event_id=event_id).first()
            if existing_event and existing_event.is_processed:
                return Response({
                    'status': 'ok',
                    'message': 'Duplicate event acknowledged; already processed.'
                }, status=status.HTTP_200_OK)

        # 4. Safe Transactional Processing
        with transaction.atomic():
            webhook_entry, _ = PaymentWebhook.objects.get_or_create(
                event_id=event_id or f"sim_{uuid.uuid4().hex[:12]}",
                defaults={
                    'event_type': event_type,
                    'provider': 'RAZORPAY',
                    'signature': signature,
                    'payload': payload,
                    'is_verified': True,
                    'is_processed': False
                }
            )

            payment_entity = payload.get('payload', {}).get('payment', {}).get('entity', {})
            provider_order_id = payment_entity.get('order_id')
            provider_payment_id = payment_entity.get('id')
            webhook_amount = payment_entity.get('amount')
            webhook_currency = payment_entity.get('currency', 'INR')

            if provider_order_id:
                payment = Payment.objects.filter(provider_order_id=provider_order_id).first()
                if payment:
                    if event_type in ['payment.captured', 'order.paid']:
                        # Validate amount and currency match
                        if webhook_amount and int(payment.amount_minor_units) != int(webhook_amount):
                            logger.error(f"Amount mismatch in webhook for payment #{payment.id}: expected {payment.amount_minor_units}, got {webhook_amount}")
                            payment.failure_code = 'AMOUNT_MISMATCH'
                            payment.failure_description = f"Amount mismatch: expected {payment.amount_minor_units}, received {webhook_amount}"
                            payment.save(update_fields=['failure_code', 'failure_description', 'updated_at'])
                        elif webhook_currency and payment.currency != webhook_currency:
                            payment.failure_code = 'CURRENCY_MISMATCH'
                            payment.failure_description = f"Currency mismatch: expected {payment.currency}, received {webhook_currency}"
                            payment.save(update_fields=['failure_code', 'failure_description', 'updated_at'])
                        else:
                            payment.status = 'PAID'
                            if provider_payment_id:
                                payment.provider_payment_id = provider_payment_id
                            payment.verified_at = timezone.now()
                            payment.save(update_fields=['status', 'provider_payment_id', 'verified_at', 'updated_at'])

                            payment.order.payment_status = 'PAID'
                            payment.order.save(update_fields=['payment_status', 'updated_at'])

                            if payment.order and payment.order.customer:
                                safe_dispatch_on_commit(
                                    user=payment.order.customer,
                                    event_type='payment.succeeded',
                                    context={
                                        'order_number': payment.order.order_number,
                                        'amount': str(payment.amount),
                                        'payment_id': payment.provider_payment_id or str(payment.id),
                                    },
                                    idempotency_key=f"payment_succeeded_{payment.id}",
                                    related_resource_type='Payment',
                                    related_resource_id=payment.id
                                )

                    elif event_type in ['payment.failed']:
                        # Never overwrite a settled PAID payment
                        if payment.status != 'PAID':
                            payment.status = 'FAILED'
                            payment.failure_code = payment_entity.get('error_code', 'PAYMENT_FAILED')
                            payment.failure_description = payment_entity.get('error_description', 'Payment failed')
                            payment.save(update_fields=['status', 'failure_code', 'failure_description', 'updated_at'])

                            if payment.order.payment_status != 'PAID':
                                payment.order.payment_status = 'FAILED'
                                payment.order.save(update_fields=['payment_status', 'updated_at'])

                            if payment.order and payment.order.customer:
                                safe_dispatch_on_commit(
                                    user=payment.order.customer,
                                    event_type='payment.failed',
                                    context={
                                        'order_number': payment.order.order_number,
                                        'reason': payment.failure_description or 'Payment failed'
                                    },
                                    idempotency_key=f"payment_failed_{payment.id}",
                                    related_resource_type='Payment',
                                    related_resource_id=payment.id
                                )

            webhook_entry.is_processed = True
            webhook_entry.processed_at = timezone.now()
            webhook_entry.save(update_fields=['is_processed', 'processed_at'])

        return Response({'status': 'ok', 'event': event_type}, status=status.HTTP_200_OK)


# Backward Compatibility Views for existing phases & tests
class CreatePaymentSessionView(PaymentInitializeView):
    """Maintains backward compatibility with legacy /api/payments/create/ endpoint."""
    pass


class RefundPaymentView(views.APIView):
    """
    Representation endpoint for customer wallet refund simulation from previous phases.
    (Phase 14 notes: automatic gateway refund execution is excluded; representations are preserved).
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def post(self, request):
        order_number = request.data.get('order_number')
        order_id = request.data.get('order_id')
        refund_reason = request.data.get('reason', 'Customer requested cancellation')
        refund_amount = request.data.get('amount')

        order = None
        if order_number:
            order = Order.objects.filter(order_number=order_number).first()
        elif order_id:
            order = Order.objects.filter(id=order_id).first()

        if not order:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

        payment = order.payment
        if not payment:
            return Response({'error': 'No completed payment found for this order'}, status=status.HTTP_400_BAD_REQUEST)

        amount_to_refund = Decimal(str(refund_amount or payment.amount))

        with transaction.atomic():
            payment.status = 'REFUNDED'
            payment.refund_amount = amount_to_refund
            payment.refund_reason = refund_reason
            payment.refunded_at = timezone.now()
            payment.save()

            refund_txn_id = f"REFUND-{uuid.uuid4().hex[:10].upper()}"
            TxnModel.objects.create(
                payment=payment,
                transaction_id=refund_txn_id,
                transaction_type='REFUND',
                amount=amount_to_refund,
                is_success=True,
                raw_response={'reason': refund_reason, 'channel': 'AUTO_REFUND'}
            )

            # Credit customer wallet
            wallet, _ = Wallet.objects.get_or_create(user=order.customer)
            wallet.balance += Decimal(str(amount_to_refund))
            wallet.save()

            WalletTransaction.objects.create(
                wallet=wallet,
                transaction_type='REFUND',
                amount=amount_to_refund,
                description=f"Refund for order #{order.order_number}",
                reference_id=refund_txn_id
            )

            order.payment_status = 'REFUNDED'
            order.status = 'CANCELLED'
            order.save(update_fields=['payment_status', 'status', 'updated_at'])

            # Phase 29: Immutable audit logging of sensitive financial refund
            create_admin_audit_log(
                actor=request.user,
                action='PAYMENT_REFUND_PROCESSED',
                target_model='Payment',
                target_id=str(payment.id),
                details={
                    'order_number': order.order_number,
                    'order_id': order.id,
                    'refund_amount': str(amount_to_refund),
                    'refund_reason': refund_reason,
                    'refund_transaction_id': refund_txn_id
                },
                reason=refund_reason,
                request=request
            )

        return Response({
            'success': True,
            'refund_transaction_id': refund_txn_id,
            'refunded_amount': str(amount_to_refund),
            'wallet_new_balance': wallet.balance,
            'message': f'₹{amount_to_refund} refunded to customer wallet.'
        }, status=status.HTTP_200_OK)
