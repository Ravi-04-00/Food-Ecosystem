"""
Support-agent queue (Phase 11). Agents are Users with is_support_agent=True:
ticket/call queue access ONLY — never superuser, never admin APIs.

- Queue: tickets assigned to me + unassigned OPEN pool (others' assignments hidden).
- Claim: take an unassigned ticket (→ IN_PROGRESS, assigned to me).
- Reply: only on tickets assigned to me.
- Calls: requests assigned to me or unassigned REQUESTED; progress + outcome.
"""
from django.db import transaction
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response

from apps.accounts.models import User, SupportTicket, TicketMessage, CallRequest
from apps.accounts.support_serializers import SupportTicketDetailSerializer


def _is_agent(user):
    return bool(user and user.is_authenticated
                and (user.is_staff or getattr(user, 'role', '') == 'ADMIN'
                     or getattr(user, 'is_support_agent', False)))


def _ticket_dict(t):
    return {
        'id': t.id,
        'ticket_number': t.ticket_number,
        'subject': t.subject,
        'category': t.category,
        'priority': t.priority,
        'status': t.status,
        'agent': t.assigned_agent.username if t.assigned_agent else None,
        'created_at': t.created_at.isoformat() if t.created_at else None,
        'updated_at': t.updated_at.isoformat() if t.updated_at else None,
    }


class AgentQueueView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not _is_agent(request.user):
            return Response({'error': 'Support-agent privileges required.'},
                            status=status.HTTP_403_FORBIDDEN)
        mine = SupportTicket.objects.filter(assigned_agent=request.user).order_by('-updated_at')
        pool = SupportTicket.objects.filter(
            assigned_agent__isnull=True, status__in=('OPEN', 'ESCALATED')).order_by('-created_at')
        status_f = (request.query_params.get('status') or '').upper()
        if status_f:
            mine = mine.filter(status=status_f)
            pool = pool.filter(status=status_f)
        return Response({
            'assigned_to_me': [_ticket_dict(t) for t in mine[:100]],
            'unassigned_pool': [_ticket_dict(t) for t in pool[:100]],
        })


class AgentTicketDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def _get(self, request, ticket_number):
        t = SupportTicket.objects.filter(ticket_number=ticket_number).first()
        if not t:
            return None, Response({'error': 'Ticket not found.'},
                                  status=status.HTTP_404_NOT_FOUND)
        if not (t.assigned_agent_id == request.user.id
                or (t.assigned_agent_id is None and t.status in ('OPEN', 'ESCALATED'))
                or request.user.is_staff or getattr(request.user, 'role', '') == 'ADMIN'):
            return None, Response({'error': 'Not assigned to you.'},
                                  status=status.HTTP_403_FORBIDDEN)
        return t, None

    def get(self, request, ticket_number):
        if not _is_agent(request.user):
            return Response({'error': 'Support-agent privileges required.'},
                            status=status.HTTP_403_FORBIDDEN)
        t, err = self._get(request, ticket_number)
        if err:
            return err
        data = SupportTicketDetailSerializer(t).data
        data['messages'] = [{
            'id': m.id, 'sender': m.sender.username if m.sender else '',
            'sender_role': m.sender_role, 'message': m.message,
            'is_internal_note': m.is_internal_note,
            'created_at': m.created_at.isoformat() if m.created_at else None,
        } for m in t.messages.order_by('created_at')[:200]]
        return Response(data)


class AgentTicketClaimView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, ticket_number):
        if not _is_agent(request.user):
            return Response({'error': 'Support-agent privileges required.'},
                            status=status.HTTP_403_FORBIDDEN)
        with transaction.atomic():
            t = SupportTicket.objects.select_for_update().filter(
                ticket_number=ticket_number).first()
            if not t:
                return Response({'error': 'Ticket not found.'},
                                status=status.HTTP_404_NOT_FOUND)
            if t.assigned_agent_id and t.assigned_agent_id != request.user.id:
                return Response({'error': 'Already assigned to another agent.'},
                                status=status.HTTP_409_CONFLICT)
            t.assigned_agent = request.user
            if t.status == 'OPEN':
                t.status = 'IN_PROGRESS'
            t.save()
        from apps.adminpanel.permissions import create_admin_audit_log
        try:
            create_admin_audit_log(
                actor=request.user, action='TICKET_CLAIMED', target_model='SupportTicket',
                target_id=t.id, details={'ticket_number': t.ticket_number},
                reason='Agent self-assignment from queue.')
        except Exception:
            pass
        return Response(_ticket_dict(t))


class AgentTicketReplyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, ticket_number):
        if not _is_agent(request.user):
            return Response({'error': 'Support-agent privileges required.'},
                            status=status.HTTP_403_FORBIDDEN)
        t = SupportTicket.objects.filter(ticket_number=ticket_number).first()
        if not t:
            return Response({'error': 'Ticket not found.'},
                            status=status.HTTP_404_NOT_FOUND)
        if t.assigned_agent_id != request.user.id and not (
                request.user.is_staff or getattr(request.user, 'role', '') == 'ADMIN'):
            return Response({'error': 'Claim the ticket before replying.'},
                            status=status.HTTP_403_FORBIDDEN)
        message = (request.data.get('message') or '').strip()
        if not message:
            return Response({'error': 'Message is required.'},
                            status=status.HTTP_400_BAD_REQUEST)
        internal = bool(request.data.get('is_internal_note'))
        msg = TicketMessage.objects.create(
            ticket=t, sender=request.user, sender_role='SUPPORT_AGENT',
            is_internal_note=internal, message=message[:5000])
        if not internal and t.status in ('OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER'):
            t.status = 'WAITING_CUSTOMER'
            t.save(update_fields=['status', 'updated_at'])
        if not internal:
            try:
                from apps.notifications.dispatcher import safe_dispatch_on_commit
                safe_dispatch_on_commit(
                    t.user, 'system.alert',
                    {'title': 'Support reply',
                     'message': 'Agent replied to ticket %s.' % t.ticket_number},
                    idempotency_key='agent_reply_%d' % msg.id)
            except Exception:
                pass
        return Response({'id': msg.id, 'status': t.status}, status=status.HTTP_201_CREATED)


class AgentCallQueueView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not _is_agent(request.user):
            return Response({'error': 'Support-agent privileges required.'},
                            status=status.HTTP_403_FORBIDDEN)
        mine = CallRequest.objects.filter(agent=request.user).order_by('-updated_at')[:100]
        pool = CallRequest.objects.filter(
            agent__isnull=True, status='REQUESTED').order_by('created_at')[:100]
        from apps.accounts.call_views import _call_dict
        return Response({
            'assigned_to_me': [_call_dict(c, show_phone=True) for c in mine],
            'unassigned_pool': [_call_dict(c, show_phone=True) for c in pool],
        })
