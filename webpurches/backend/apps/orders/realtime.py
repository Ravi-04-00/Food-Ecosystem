import os
import uuid
import logging
from datetime import datetime, timezone
from django.db import transaction
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

logger = logging.getLogger(__name__)

EVENT_SCHEMA_VERSION = "1.0"


def build_event_envelope(
    event_type: str,
    entity_type: str,
    entity_id: str or int,
    data: dict,
    entity_version: int = None,
    idempotency_key: str = None
) -> dict:
    """
    Standardized, backward-compatible real-time event envelope.
    Includes:
      - event_id: Globally unique event identifier (UUID4)
      - event_type: Dotted event identifier, e.g. 'order.updated', 'delivery.job_offered'
      - schema_version: Contract version ("1.0")
      - entity_type: The root model/aggregate ("order", "notification", "delivery_offer")
      - entity_id: The ID of the primary entity
      - entity_version: Monotonically increasing sequence or epoch millisecond
      - server_timestamp: Trusted server-generated ISO-8601 UTC timestamp
      - idempotency_key: Optional caller-provided deduplication key
      - data: Minimal event payload (excluding credentials/tokens)
      - [legacy compatibility keys]: 'type', 'event', etc.
    """
    now_utc = datetime.now(timezone.utc)
    now_iso = now_utc.isoformat()
    now_ms = int(now_utc.timestamp() * 1000)

    event_id = str(uuid.uuid4())
    version = entity_version if entity_version is not None else now_ms

    envelope = {
        "event_id": event_id,
        "event_type": event_type,
        "schema_version": EVENT_SCHEMA_VERSION,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "entity_version": version,
        "server_timestamp": now_iso,
        "idempotency_key": idempotency_key or f"{event_type}_{entity_id}_{version}",
        "data": data or {},

        # Backward compatibility aliases for legacy frontend clients
        "type": "ecosystem_event",
        "event": event_type,
    }

    # If entity is order or notification, expose top-level legacy IDs
    if entity_type == 'order':
        envelope['order_id'] = entity_id
    elif entity_type == 'notification':
        envelope['notification_id'] = entity_id

    return envelope


def publish_realtime_event(group_name: str or list, envelope: dict):
    """
    Dispatches a standardized event envelope to one or more channel groups.
    Non-blocking / exception-tolerant.
    """
    try:
        channel_layer = get_channel_layer()
        if not channel_layer:
            logger.debug("No channel layer configured; skipping broadcast.")
            return

        groups = [group_name] if isinstance(group_name, str) else list(group_name)
        for grp in groups:
            async_to_sync(channel_layer.group_send)(
                grp,
                {
                    'type': 'ecosystem_event',
                    'payload': envelope
                }
            )
    except Exception as exc:
        logger.warning(f"Real-time event publication warning for {envelope.get('event_type')}: {exc}")


def safe_publish_on_commit(group_name: str or list, envelope: dict):
    """
    Ensures events are only dispatched AFTER the enclosing database transaction successfully commits.
    Prevents phantom event broadcasts on rolled-back transactions.
    """
    try:
        transaction.on_commit(lambda: publish_realtime_event(group_name, envelope))
    except Exception:
        # If not inside a managed transaction, dispatch immediately
        publish_realtime_event(group_name, envelope)


def broadcast_order_transition(order, event_type="order.updated", actor=None):
    """
    Broadcasts authoritative order transition to:
      - user_{order.customer_id} (Customer)
      - restaurant_{order.restaurant_id} (Restaurant)
      - delivery_partner_{order.rider_id} (Assigned Courier)
      - order_{order.id} (Subscribed clients)
      - wsfood_live_ecosystem (Ecosystem public stream)
      - admin_ecosystem (Admins)
    """
    try:
        history_count = order.status_history.count() if hasattr(order, 'status_history') else 1
    except Exception:
        history_count = 1

    updated_ms = int(order.updated_at.timestamp() * 1000) if getattr(order, 'updated_at', None) else int(datetime.now(timezone.utc).timestamp() * 1000)

    envelope = build_event_envelope(
        event_type=event_type,
        entity_type='order',
        entity_id=order.id,
        entity_version=history_count or updated_ms,
        idempotency_key=f"order_{order.id}_{order.status}_{history_count}",
        data={
            'order_id': order.id,
            'order_number': order.order_number,
            'status': order.status,
            'order_status': order.status,
            'customer_id': order.customer_id,
            'restaurant_id': order.restaurant_id,
            'restaurant_name': order.restaurant.name if order.restaurant else '',
            'rider_id': order.rider_id,
            'rider_name': (order.rider.get_full_name() or order.rider.username) if order.rider else None,
            'grand_total': float(order.grand_total or order.total or 0),
            'otp': order.otp,
            'eta_minutes': getattr(order, 'eta_minutes', 20),
            'updated_at': order.updated_at.isoformat() if getattr(order, 'updated_at', None) else datetime.now(timezone.utc).isoformat()
        }
    )
    # Legacy aliases
    envelope.update({
        'order_id': order.id,
        'order_number': order.order_number,
        'status': order.status,
        'order_status': order.status,
        'restaurant_id': order.restaurant_id,
        'customer_id': order.customer_id
    })

    target_groups = ['wsfood_live_ecosystem', 'admin_ecosystem']
    if order.customer_id:
        target_groups.append(f"user_{order.customer_id}")
    if order.restaurant_id:
        target_groups.append(f"restaurant_{order.restaurant_id}")
    if order.rider_id:
        target_groups.append(f"delivery_partner_{order.rider_id}")
    target_groups.append(f"order_{order.id}")

    safe_publish_on_commit(target_groups, envelope)
    return envelope
