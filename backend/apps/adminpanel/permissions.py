from rest_framework import permissions
from apps.accounts.models import AuditLog

class IsAdminUser(permissions.BasePermission):
    """
    Strict server-side permission: allows access ONLY to authenticated users
    with role == 'ADMIN', is_staff == True, or is_superuser == True.
    """
    message = "Administrative access required. You do not have permission to perform this action."

    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return False
        return bool(user.role == 'ADMIN' or user.is_staff or user.is_superuser)


def get_client_ip(request):
    """Safely extracts client IP address from standard and forwarded headers."""
    if not request:
        return '127.0.0.1'
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
    return ip[:64]


def sanitize_audit_details(details):
    """
    Strips passwords, secrets, tokens, and payment card hashes from audit details.
    """
    if not isinstance(details, dict):
        return details

    sensitive_keys = {
        'password', 'password_hash', 'access_token', 'refresh_token',
        'token', 'key_secret', 'secret', 'provider_signature', 'cvv', 'card_number'
    }

    sanitized = {}
    for k, v in details.items():
        if str(k).lower() in sensitive_keys:
            sanitized[k] = '[REDACTED]'
        elif isinstance(v, dict):
            sanitized[k] = sanitize_audit_details(v)
        else:
            sanitized[k] = v
    return sanitized


def create_admin_audit_log(actor, action, target_model, target_id, details=None, reason='', request=None):
    """
    Creates an immutable AuditLog entry for administrative tracking.
    """
    details_dict = details or {}
    if reason:
        details_dict['reason'] = str(reason).strip()

    clean_details = sanitize_audit_details(details_dict)
    ip = get_client_ip(request)

    return AuditLog.objects.create(
        actor=actor if actor and getattr(actor, 'is_authenticated', False) else None,
        action=str(action)[:120],
        target_model=str(target_model)[:100],
        target_id=str(target_id)[:100],
        details=clean_details,
        ip_address=ip
    )
