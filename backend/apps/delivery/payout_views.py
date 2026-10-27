"""
Phase 3A: Rider payout ledger APIs (INTERNAL LEDGER only).

- Riders read ONLY their own earnings/payouts (user-scoped querysets).
- Admin batch/transition/adjust mirror payments.settlement_views conventions:
  IsAuthenticated + manual is_staff/ADMIN check, ValueError -> 400.
No real money movement; PAID requires verified provider UTR.
"""
from django.db.models import Sum
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response

from apps.accounts.models import User
from apps.delivery.models import RiderEarning, RiderPayout
from apps.delivery.payout_service import (
    create_rider_payout_batch,
    transition_rider_payout,
    add_rider_payout_adjustment,
)


def _is_admin(user):
    return bool(user and user.is_authenticated
                and (user.is_staff or getattr(user, 'role', '') == 'ADMIN'))


def _earning_dict(e):
    return {
        'id': e.id,
        'order_id': e.order_id,
        'order_number': e.order_number,
        'delivery_fee': str(e.delivery_fee_snapshot),
        'tip': str(e.tip_amount),
        'bonus': str(e.bonus_amount),
        'penalty': str(e.penalty_deduction),
        'net_amount': str(e.net_amount),
        'status': e.status,
        'payout_reference': e.payout.payout_reference if e.payout else None,
        'created_at': e.created_at.isoformat() if e.created_at else None,
    }


def _payout_dict(p):
    return {
        'id': p.id,
        'payout_reference': p.payout_reference,
        'rider_id': p.rider_id,
        'period_start': str(p.period_start),
        'period_end': str(p.period_end),
        'trip_count': p.trip_count,
        'gross_delivery_fees': str(p.gross_delivery_fees),
        'total_tips': str(p.total_tips),
        'total_bonuses': str(p.total_bonuses),
        'total_penalties': str(p.total_penalties),
        'total_adjustments': str(p.total_adjustments),
        'net_payout_amount': str(p.net_payout_amount),
        'status': p.status,
        'payout_provider': p.payout_provider,
        'provider_reference': p.provider_reference,
        'provider_utr_set': bool(p.provider_utr),
        'payout_initiated_at': p.payout_initiated_at.isoformat() if p.payout_initiated_at else None,
        'payout_completed_at': p.payout_completed_at.isoformat() if p.payout_completed_at else None,
        'created_at': p.created_at.isoformat() if p.created_at else None,
    }


class RiderPayoutListView(APIView):
    """GET /api/delivery/payouts/ — rider's own payout batches + ledger summary."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        payouts = RiderPayout.objects.filter(rider=request.user).order_by('-created_at')[:100]
        agg = RiderEarning.objects.filter(rider=request.user).aggregate(
            accrued=Sum('net_amount', filter=None),
        )
        accrued_sum = RiderEarning.objects.filter(
            rider=request.user, status='ACCRUED').aggregate(s=Sum('net_amount'))['s'] or 0
        settled_sum = RiderEarning.objects.filter(
            rider=request.user, status='SETTLED').aggregate(s=Sum('net_amount'))['s'] or 0
        return Response({
            'ledger_summary': {
                'accrued_total': str(accrued_sum),
                'settled_total': str(settled_sum),
                'currency': 'INR',
                'provider': 'INTERNAL_LEDGER',
            },
            'payouts': [_payout_dict(p) for p in payouts],
        }, status=status.HTTP_200_OK)


class RiderPayoutDetailView(APIView):
    """GET /api/delivery/payouts/<reference>/ — rider's own batch with entries."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, reference):
        payout = RiderPayout.objects.filter(
            payout_reference=reference, rider=request.user).first()
        if not payout:
            return Response({'error': 'Payout not found.'}, status=status.HTTP_404_NOT_FOUND)
        entries = RiderEarning.objects.filter(payout=payout).order_by('-created_at')[:500]
        data = _payout_dict(payout)
        data['entries'] = [_earning_dict(e) for e in entries]
        data['adjustments'] = [{
            'type': a.adjustment_type, 'amount': str(a.amount),
            'reason': a.reason,
            'created_at': a.created_at.isoformat() if a.created_at else None,
        } for a in payout.adjustments.all()[:100]]
        return Response(data, status=status.HTTP_200_OK)


class AdminRiderPayoutListView(APIView):
    """GET /api/delivery/admin/payouts/ — all batches (admin)."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not _is_admin(request.user):
            return Response({'error': 'Administrative privileges required.'},
                            status=status.HTTP_403_FORBIDDEN)
        qs = RiderPayout.objects.select_related('rider').order_by('-created_at')
        status_filter = (request.query_params.get('status') or '').upper()
        if status_filter:
            qs = qs.filter(status=status_filter)
        rider_id = request.query_params.get('rider_id')
        if rider_id:
            qs = qs.filter(rider_id=rider_id)
        payouts = qs[:200]
        out = [_payout_dict(p) for p in payouts]
        for d, p in zip(out, payouts):
            d['rider_username'] = p.rider.username if p.rider else ''
        return Response({'payouts': out}, status=status.HTTP_200_OK)


class AdminRiderPayoutCreateBatchView(APIView):
    """POST /api/delivery/admin/payouts/create-batch/ — batch eligible entries (admin)."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if not _is_admin(request.user):
            return Response({'error': 'Administrative privileges required.'},
                            status=status.HTTP_403_FORBIDDEN)
        rider = User.objects.filter(id=request.data.get('rider_id')).first()
        if not rider:
            return Response({'error': 'Valid rider_id is required.'},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            payout = create_rider_payout_batch(
                rider=rider,
                period_start=request.data.get('period_start') or timezone.localdate(),
                period_end=request.data.get('period_end') or timezone.localdate(),
                created_by=request.user,
                notes=request.data.get('notes', ''),
            )
        except ValueError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'payout': _payout_dict(payout)}, status=status.HTTP_201_CREATED)


class AdminRiderPayoutTransitionView(APIView):
    """POST /api/delivery/admin/payouts/<reference>/status/ — validated transition (admin)."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, reference):
        if not _is_admin(request.user):
            return Response({'error': 'Administrative privileges required.'},
                            status=status.HTTP_403_FORBIDDEN)
        payout = RiderPayout.objects.filter(payout_reference=reference).first()
        if not payout:
            return Response({'error': 'Payout not found.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            payout = transition_rider_payout(
                payout,
                target_status=request.data.get('status', ''),
                actor=request.user,
                reason=request.data.get('reason', ''),
                provider_reference=request.data.get('provider_reference', ''),
                provider_utr=request.data.get('provider_utr', ''),
            )
        except ValueError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'payout': _payout_dict(payout)}, status=status.HTTP_200_OK)


class AdminRiderPayoutAdjustmentView(APIView):
    """POST /api/delivery/admin/payouts/<reference>/adjustments/ — manual correction (admin)."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, reference):
        if not _is_admin(request.user):
            return Response({'error': 'Administrative privileges required.'},
                            status=status.HTTP_403_FORBIDDEN)
        payout = RiderPayout.objects.filter(payout_reference=reference).first()
        if not payout:
            return Response({'error': 'Payout not found.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            adj = add_rider_payout_adjustment(
                payout,
                adjustment_type=(request.data.get('adjustment_type') or 'MANUAL_CORRECTION').upper(),
                amount=request.data.get('amount', 0),
                reason=request.data.get('reason', ''),
                actor=request.user,
            )
        except ValueError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        payout.refresh_from_db()
        return Response({
            'adjustment': {'type': adj.adjustment_type, 'amount': str(adj.amount)},
            'payout': _payout_dict(payout),
        }, status=status.HTTP_201_CREATED)
