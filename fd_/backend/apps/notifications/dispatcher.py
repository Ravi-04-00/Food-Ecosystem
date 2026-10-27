import logging
from django.db import transaction
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import Notification, NotificationPreference, NotificationDeliveryAttempt
from .templates import render_notification_template
from .adapters import EmailAdapter, SMSAdapter, PushAdapter
from apps.accounts.models import UserSettings

logger = logging.getLogger(__name__)


def get_user_language_preference(user, pref=None, request=None):
    """
    Resolves the user's preferred language ('en' or 'ta').
    Checks UserSettings from Phase 6 first, then NotificationPreference, then Accept-Language header.
    """
    if user and user.is_authenticated:
        user_settings = UserSettings.objects.filter(user=user).first()
        if user_settings and user_settings.language in ['en', 'ta']:
            return user_settings.language
    if pref and pref.language in ['en', 'ta']:
        return pref.language
    if request:
        accept_lang = request.META.get('HTTP_ACCEPT_LANGUAGE', '')
        if 'ta' in accept_lang.lower():
            return 'ta'
        if 'en' in accept_lang.lower():
            return 'en'
    return 'en'


def dispatch_notification(
    user,
    event_type,
    context=None,
    idempotency_key=None,
    related_resource_type='',
    related_resource_id='',
    force_channels=None,
    is_promotional=False,
    lang=None,
    request=None
):
    """
    Core event-driven notification dispatcher.
    Persists to PostgreSQL, broadcasts over WebSockets (Channels), and executes channel adapters.
    """
    if not user or not user.is_authenticated:
        return None

    context = context or {}

    # 1. Idempotency Check: Prevent duplicate notifications
    if idempotency_key:
        existing = Notification.objects.filter(idempotency_key=idempotency_key).first()
        if existing:
            logger.info(f"Notification with idempotency_key '{idempotency_key}' already exists (#{existing.id}). Skipping duplicate.")
            return existing

    # 2. Preference & Consent Resolution
    pref, _ = NotificationPreference.objects.get_or_create(user=user)

    # Respect opt-out for optional promotional messages
    if is_promotional and not pref.promotional_updates:
        logger.info(f"Promotional notification '{event_type}' suppressed by user preference for {user.username}.")
        return None

    # Resolve language (Tamil or English)
    resolved_lang = lang or get_user_language_preference(user, pref, request=request)

    # 3. Localized Template Rendering
    title, message, notif_type = render_notification_template(event_type, lang=resolved_lang, context=context)

    # 4. PostgreSQL Persistence
    notification = Notification.objects.create(
        user=user,
        title=title,
        message=message,
        notification_type=notif_type,
        event_type=event_type,
        related_resource_type=related_resource_type,
        related_resource_id=str(related_resource_id) if related_resource_id else '',
        idempotency_key=idempotency_key,
        data=context,
        is_read=False,
        is_dismissed=False
    )

    # 5. In-App Real-Time WebSocket Delivery (Channels)
    try:
        from apps.orders.realtime import build_event_envelope
        channel_layer = get_channel_layer()
        if channel_layer:
            payload = build_event_envelope(
                event_type='notification.created',
                entity_type='notification',
                entity_id=notification.id,
                entity_version=int(notification.created_at.timestamp() * 1000),
                idempotency_key=notification.idempotency_key,
                data={
                    'notification_id': notification.id,
                    'user_id': user.id,
                    'title': notification.title,
                    'message': notification.message,
                    'event_type': event_type,
                    'notification_type': notif_type,
                    'related_resource_type': related_resource_type,
                    'related_resource_id': str(related_resource_id),
                    'created_at': notification.created_at.isoformat()
                }
            )
            # Add top-level fields for legacy consumers
            payload.update({
                'title': notification.title,
                'message': notification.message,
                'user_id': user.id,
                'event_type': event_type,
                'notification_type': notif_type,
                'related_resource_type': related_resource_type,
                'related_resource_id': str(related_resource_id),
                'created_at': notification.created_at.isoformat()
            })

            # Broadcast to targeted user channel and ecosystem group
            for target_group in [f"user_{user.id}", 'wsfood_live_ecosystem']:
                try:
                    async_to_sync(channel_layer.group_send)(
                        target_group,
                        {
                            'type': 'ecosystem_event',
                            'payload': payload
                        }
                    )
                except Exception as send_err:
                    logger.debug(f"Group send to {target_group} skipped: {send_err}")

            # Record In-App attempt
            NotificationDeliveryAttempt.objects.create(
                notification=notification,
                channel='IN_APP',
                status='DELIVERED',
                recipient_destination=f"user_{user.id}",
                provider='DjangoChannels'
            )
    except Exception as ws_err:
        logger.warning(f"WebSocket notification broadcast warning: {str(ws_err)}")
        # In-app record remains available in DB via REST fallback
        NotificationDeliveryAttempt.objects.create(
            notification=notification,
            channel='IN_APP',
            status='SENT',
            recipient_destination=f"user_{user.id}",
            provider='DatabaseFallback',
            error_message=str(ws_err)[:200]
        )

    # 6. External Channel Adapters (Email, SMS, Push)
    # Check preferences or explicit channel overrides
    channels_to_run = force_channels or []
    if not force_channels:
        if pref.email_enabled:
            channels_to_run.append('EMAIL')
        if pref.sms_enabled:
            channels_to_run.append('SMS')
        if pref.push_enabled:
            channels_to_run.append('PUSH')

    if 'EMAIL' in channels_to_run:
        EmailAdapter.send(notification, user.email)

    if 'SMS' in channels_to_run:
        user_phone = getattr(user, 'phone', '')
        SMSAdapter.send(notification, user_phone)

    if 'PUSH' in channels_to_run:
        PushAdapter.send(notification)

    return notification


def safe_dispatch_on_commit(
    user,
    event_type,
    context=None,
    idempotency_key=None,
    related_resource_type='',
    related_resource_id='',
    force_channels=None,
    is_promotional=False
):
    """
    Safely schedules notification dispatch on database transaction commit.
    Guarantees that rolled-back transactions never produce misleading notifications.
    """
    # If currently inside a transaction, use on_commit
    connection = transaction.get_connection()
    if connection.in_atomic_block:
        transaction.on_commit(
            lambda: dispatch_notification(
                user=user,
                event_type=event_type,
                context=context,
                idempotency_key=idempotency_key,
                related_resource_type=related_resource_type,
                related_resource_id=related_resource_id,
                force_channels=force_channels,
                is_promotional=is_promotional
            )
        )
    else:
        return dispatch_notification(
            user=user,
            event_type=event_type,
            context=context,
            idempotency_key=idempotency_key,
            related_resource_type=related_resource_type,
            related_resource_id=related_resource_id,
            force_channels=force_channels,
            is_promotional=is_promotional
        )
