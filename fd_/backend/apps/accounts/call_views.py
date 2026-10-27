"""
Callback-request workflow (no telephony provider configured).

Users request a callback; staff/admins assign, progress, and record the
outcome. No real call is placed by the system. Phone numbers are returned
only to the requester and to staff/admins.
"""
from django.db import transaction
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response

from apps.accounts.models import User, CallRequest
from apps.orders.models import Order


def _is_staff(user):
    return bool(user and user.is_authenticated
                and (user.is_staff or getattr(user, 'role', '') == 'ADMIN'))


def _mask_phone(phone, visible):
    if visible or not phone:
        return phone or ''
    digits = ''.join(c for c in str(phone) if c.isdigit())
    if len(digits) <= 4:
        return '****'
    return '*' * (len(digits) - 4) + digits[-4:]


def _call_dict(call, show_phone=False):
    return {
        'id': call.id,
        'request_number': call.request_number,
        'topic': call.topic,
        'subject': call.subject,
        'phone': _mask_phone(call.phone, show_phone),
        'order_number': call.order.order_number if call.order else None,
        'priority': call.priority,
        'status': call.status,
        'agent': call.agent.username if call.agent else None,
        'outcome': call.outcome,
        'outcome_notes': call.outcome_notes,
        'scheduled_for': call.scheduled_for.isoformat() if call.scheduled_for else None,
        'created_at': call.created_at.isoformat() if call.created_at else None,
        'updated_at': call.updated_at.isoformat() if call.updated_at else None,
    }


def _audit(call, actor, action, frm='', to='', notes=''):
    try:
        from apps.adminpanel.permissions import create_admin_audit_log
        create_admin_audit_log(
            actor=actor, action='CALL_%s' % action, target_model='CallRequest',
            target_id=call.id,
            details={'call_request': call.request_number, 'from': frm, 'to': to},
            reason=notes or 'Callback workflow update.')
    except Exception:
        pass


def _resolve_order(user, order_number):
    if not order_number:
        return None, None
    order = Order.objects.filter(order_number=order_number).first()
    if not order:
        return None, Response({'error': 'Order not found.'},
                              status=status.HTTP_400_BAD_REQUEST)
    if not _is_staff(user) and order.customer_id != user.id:
        return None, Response({'error': 'You can only link your own orders.'},
                              status=status.HTTP_403_FORBIDDEN)
    return order, None


class CallRequestListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        calls = CallRequest.objects.filter(requester=request.user).order_by('-created_at')[:100]
        return Response({'calls': [_call_dict(c, show_phone=True) for c in calls]})

    def post(self, request):
        topic = (request.data.get('topic') or 'ORDER_HELP').upper()
        if topic not in dict(CallRequest.TOPIC_CHOICES):
            return Response({'error': 'Invalid topic.'}, status=status.HTTP_400_BAD_REQUEST)
        phone = (request.data.get('phone') or '').strip()
        if not phone:
            profile = getattr(request.user, 'profile', None)
            phone = (getattr(profile, 'phone', '') or getattr(request.user, 'phone', '') or '').strip()
        digits = ''.join(c for c in phone if c.isdigit())
        if len(digits) < 10 or len(digits) > 15:
            return Response({'error': 'A valid 10-15 digit callback number is required.'},
                            status=status.HTTP_400_BAD_REQUEST)
        order, err = _resolve_order(request.user, request.data.get('order_number'))
        if err:
            return err
        with transaction.atomic():
            count = CallRequest.objects.filter(requester=request.user).count()
            number = 'CALL-%s-%04d' % (timezone.now().strftime('%Y%m%d'), count + 1)
            call = CallRequest.objects.create(
                request_number=number, requester=request.user,
                requester_role=getattr(request.user, 'role', 'CUSTOMER'),
                order=order, topic=topic,
                subject=(request.data.get('subject') or '')[:200],
                phone=phone,
                priority=(request.data.get('priority') or 'NORMAL').upper()
                if (request.data.get('priority') or '').upper() in ('LOW', 'NORMAL', 'HIGH', 'URGENT') else 'NORMAL',
            )
        _audit(call, request.user, 'REQUESTED', to='REQUESTED')
        try:
            from apps.notifications.dispatcher import safe_dispatch_on_commit
            safe_dispatch_on_commit(
                request.user, 'system.alert',
                {'title': 'Callback requested',
                 'message': 'Request %s received. An agent will call you back.' % number},
                idempotency_key='call_requested_%d' % call.id)
        except Exception:
            pass
        return Response(_call_dict(call, show_phone=True), status=status.HTTP_201_CREATED)


class CallRequestCancelView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        call = CallRequest.objects.filter(id=pk, requester=request.user).first()
        if not call:
            return Response({'error': 'Call request not found.'},
                            status=status.HTTP_404_NOT_FOUND)
        if call.status in ('COMPLETED', 'CANCELLED'):
            return Response({'error': 'Already closed.'}, status=status.HTTP_400_BAD_REQUEST)
        prev = call.status
        call.status = 'CANCELLED'
        call.save(update_fields=['status', 'updated_at'])
        _audit(call, request.user, 'CANCELLED', frm=prev, to='CANCELLED')
        return Response(_call_dict(call, show_phone=True))


class AdminCallListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not _is_staff(request.user):
            return Response({'error': 'Administrative privileges required.'},
                            status=status.HTTP_403_FORBIDDEN)
        qs = CallRequest.objects.select_related('requester', 'agent', 'order').order_by('-created_at')
        for key in ('status', 'priority', 'topic'):
            val = (request.query_params.get(key) or '').upper()
            if val:
                qs = qs.filter(**{key: val})
        q = request.query_params.get('q', '').strip()
        if q:
            qs = qs.filter(request_number__icontains=q)
        out = []
        for c in qs[:200]:
            d = _call_dict(c, show_phone=True)
            d['requester_email'] = c.requester.email if c.requester else ''
            out.append(d)
        return Response({'calls': out})


class AdminCallTransitionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        if not _is_staff(request.user):
            return Response({'error': 'Administrative privileges required.'},
                            status=status.HTTP_403_FORBIDDEN)
        call = CallRequest.objects.filter(id=pk).first()
        if not call:
            return Response({'error': 'Call request not found.'},
                            status=status.HTTP_404_NOT_FOUND)
        target = (request.data.get('status') or '').upper()
        if target not in dict(CallRequest.STATUS_CHOICES):
            return Response({'error': 'Invalid status.'}, status=status.HTTP_400_BAD_REQUEST)
        if not call.can_transition_to(target):
            return Response(
                {'error': 'Cannot transition %s -> %s.' % (call.status, target)},
                status=status.HTTP_400_BAD_REQUEST)
        agent_id = request.data.get('agent_id')
        if agent_id and target in ('ASSIGNED', 'CALLING'):
            agent = User.objects.filter(id=agent_id).first()
            if not agent:
                return Response({'error': 'Agent not found.'}, status=status.HTTP_400_BAD_REQUEST)
            call.agent = agent
        outcome = (request.data.get('outcome') or '').upper()
        if target == 'COMPLETED':
            if outcome not in ('REACHED', 'NO_ANSWER', 'CALLBACK_LATER', 'RESOLVED', 'UNRESOLVABLE'):
                return Response({'error': 'A valid outcome is required to complete.'},
                                status=status.HTTP_400_BAD_REQUEST)
            call.outcome = outcome
            call.outcome_notes = (request.data.get('outcome_notes') or '')[:2000]
        prev = call.status
        call.status = target
        call.save()
        _audit(call, request.user, target, frm=prev, to=target,
               notes=(request.data.get('outcome_notes') or '')[:500])
        if target in ('ASSIGNED', 'COMPLETED', 'FAILED'):
            try:
                from apps.notifications.dispatcher import safe_dispatch_on_commit
                safe_dispatch_on_commit(
                    call.requester, 'system.alert',
                    {'title': 'Callback update',
                     'message': 'Request %s is now %s.' % (call.request_number, target)},
                    idempotency_key='call_%d_%s' % (call.id, target))
            except Exception:
                pass
        return Response(_call_dict(call, show_phone=True))
