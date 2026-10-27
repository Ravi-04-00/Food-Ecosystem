from django.utils import timezone
from django.db.models import Q
from rest_framework import views, permissions, status
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from .models import Notification, NotificationPreference
from .serializers import NotificationSerializer, NotificationPreferenceSerializer


class NotificationPagination(PageNumberPagination):
    page_size = 15
    page_size_query_param = 'page_size'
    max_page_size = 50


class NotificationListView(views.APIView):
    """
    GET /api/notifications/
    Returns paginated notifications belonging to the authenticated user.
    Supports filters:
    - unread_only=true or unread=true
    - event_type=...
    - notification_type=...
    - date_from=YYYY-MM-DD
    - date_to=YYYY-MM-DD
    """
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = NotificationPagination

    def get(self, request):
        user = request.user
        queryset = Notification.objects.filter(user=user, is_dismissed=False).prefetch_related('delivery_attempts').order_by('-created_at')

        # Filter by read status
        unread_param = request.query_params.get('unread') or request.query_params.get('unread_only')
        if unread_param in ['true', '1', 'True']:
            queryset = queryset.filter(is_read=False)

        # Filter by event_type
        event_type = request.query_params.get('event_type')
        if event_type:
            queryset = queryset.filter(event_type=event_type)

        # Filter by notification_type (e.g. ORDER, PAYMENT, DELIVERY, SYSTEM)
        notif_type = request.query_params.get('notification_type') or request.query_params.get('type')
        if notif_type:
            queryset = queryset.filter(notification_type=notif_type.upper())

        # Filter by date range
        date_from = request.query_params.get('date_from')
        if date_from:
            queryset = queryset.filter(created_at__date__gte=date_from)

        date_to = request.query_params.get('date_to')
        if date_to:
            queryset = queryset.filter(created_at__date__lte=date_to)

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        serializer = NotificationSerializer(page, many=True)

        unread_count = Notification.objects.filter(user=user, is_read=False, is_dismissed=False).count()
        response = paginator.get_paginated_response(serializer.data)
        response.data['unread_count'] = unread_count
        return response


class NotificationUnreadCountView(views.APIView):
    """
    GET /api/notifications/unread-count/
    Returns current count of unread notifications for authenticated user.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        unread_count = Notification.objects.filter(
            user=request.user,
            is_read=False,
            is_dismissed=False
        ).count()
        return Response({
            'unread_count': unread_count
        }, status=status.HTTP_200_OK)


class NotificationMarkReadView(views.APIView):
    """
    PATCH /api/notifications/<pk>/read/
    Marks a single notification as read.
    Enforces strict recipient ownership.
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        notification = Notification.objects.filter(id=pk, user=request.user).first()
        if not notification:
            return Response({
                'error': 'Notification not found or access denied.'
            }, status=status.HTTP_404_NOT_FOUND)

        if not notification.is_read:
            notification.is_read = True
            notification.save(update_fields=['is_read'])

        return Response({
            'success': True,
            'id': notification.id,
            'is_read': notification.is_read
        }, status=status.HTTP_200_OK)

    def post(self, request, pk):
        return self.patch(request, pk)


class NotificationMarkAllReadView(views.APIView):
    """
    POST or PATCH /api/notifications/mark-all-read/
    Marks all unread, eligible notifications for the authenticated user as read.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        return self._mark_all(request)

    def patch(self, request):
        return self._mark_all(request)

    def _mark_all(self, request):
        updated_count = Notification.objects.filter(
            user=request.user,
            is_read=False,
            is_dismissed=False
        ).update(is_read=True)

        return Response({
            'success': True,
            'message': f"{updated_count} notification(s) marked as read.",
            'updated_count': updated_count,
            'marked_count': updated_count,
            'unread_count': 0
        }, status=status.HTTP_200_OK)


class NotificationDismissView(views.APIView):
    """
    DELETE /api/notifications/<pk>/
    Dismisses/deletes a notification for the authenticated user.
    Enforces strict recipient ownership.
    """
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        notification = Notification.objects.filter(id=pk, user=request.user).first()
        if not notification:
            return Response({
                'error': 'Notification not found or access denied.'
            }, status=status.HTTP_404_NOT_FOUND)

        notification.is_dismissed = True
        notification.save(update_fields=['is_dismissed'])

        return Response({
            'success': True,
            'message': 'Notification dismissed successfully.'
        }, status=status.HTTP_200_OK)


class NotificationPreferenceView(views.APIView):
    """
    GET /api/notifications/preferences/
    PATCH /api/notifications/preferences/
    View and update notification channel, content type, and language preferences.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        pref, _ = NotificationPreference.objects.get_or_create(user=request.user)
        return Response(NotificationPreferenceSerializer(pref).data)

    def patch(self, request):
        pref, _ = NotificationPreference.objects.get_or_create(user=request.user)
        serializer = NotificationPreferenceSerializer(pref, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
