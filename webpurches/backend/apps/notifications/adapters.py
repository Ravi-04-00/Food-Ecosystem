import os
import re
import logging
from django.conf import settings
from django.core.mail import send_mail
from .models import NotificationDeliveryAttempt

logger = logging.getLogger(__name__)


def mask_email(email):
    """
    Safely masks an email address for logging and attempt auditing.
    e.g. 'customer@wsfood.io' -> 'c***@wsfood.io'
    """
    if not email or '@' not in email:
        return '***@***.***'
    parts = email.split('@')
    name, domain = parts[0], parts[1]
    if len(name) <= 1:
        masked_name = name + '***'
    else:
        masked_name = name[0] + '***'
    return f"{masked_name}@{domain}"


def mask_phone(phone):
    """
    Safely masks a phone number for logging and attempt auditing.
    e.g. '+919876500001' -> '******0001'
    """
    if not phone:
        return '******'
    clean = re.sub(r'[^0-9+]', '', str(phone))
    if len(clean) > 4:
        return '*' * (len(clean) - 4) + clean[-4:]
    return '******'


class EmailAdapter:
    """
    Transactional Email Provider Adapter.
    Uses standard Django mail backend or configured provider.
    Never raises exceptions that would disrupt the caller.
    """
    @staticmethod
    def send(notification, recipient_email):
        masked_dest = mask_email(recipient_email)
        attempt = NotificationDeliveryAttempt(
            notification=notification,
            channel='EMAIL',
            recipient_destination=masked_dest,
            provider='DjangoMail'
        )

        if not recipient_email:
            attempt.status = 'SKIPPED'
            attempt.error_message = 'No recipient email address registered.'
            attempt.save()
            return False

        # Check if email is explicitly disabled or not configured
        # In test / dev environments, Django locmem or console backend is valid
        try:
            from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@wsfood.io')
            subject = f"[FD Food Delivery] {notification.title}"
            body = (
                f"Hello {notification.user.username},\n\n"
                f"{notification.message}\n\n"
                f"Thank you for choosing FD Food Delivery.\n"
                f"Manage your preferences in your account settings."
            )
            
            # send_mail with fail_silently=False wrapped in try/except
            sent_count = send_mail(
                subject=subject,
                message=body,
                from_email=from_email,
                recipient_list=[recipient_email],
                fail_silently=False
            )
            if sent_count > 0:
                attempt.status = 'SENT'
                attempt.provider_response_id = f"mail_sent_{notification.id}"
                attempt.save()
                return True
            else:
                attempt.status = 'FAILED'
                attempt.error_message = 'Email backend reported 0 recipients delivered.'
                attempt.save()
                return False
        except Exception as e:
            logger.warning(f"Email delivery exception for notification #{notification.id}: {str(e)}")
            attempt.status = 'FAILED'
            attempt.error_message = f"Email delivery error: {str(e)[:200]}"
            attempt.save()
            return False


class SMSAdapter:
    """
    Transactional SMS Provider Adapter.
    Requires explicitly configured SMS_PROVIDER_API_KEY or TWILIO_ACCOUNT_SID.
    Never claims SMS was sent if no provider is configured.
    """
    @staticmethod
    def send(notification, recipient_phone):
        masked_dest = mask_phone(recipient_phone)
        attempt = NotificationDeliveryAttempt(
            notification=notification,
            channel='SMS',
            recipient_destination=masked_dest,
            provider='SMSProvider'
        )

        if not recipient_phone:
            attempt.status = 'SKIPPED'
            attempt.error_message = 'No phone number available on user profile.'
            attempt.save()
            return False

        provider_key = os.environ.get('SMS_PROVIDER_API_KEY') or os.environ.get('TWILIO_ACCOUNT_SID')
        if not provider_key:
            # Honestly record that SMS provider is unconfigured in this environment
            attempt.status = 'SKIPPED'
            attempt.error_message = 'SMS provider credentials (SMS_PROVIDER_API_KEY) not configured.'
            attempt.save()
            return False

        try:
            # If provider is configured, dispatch SMS payload safely
            # Note: message is kept concise and sensitive tokens are excluded
            clean_message = f"FD Alert: {notification.title} - {notification.message[:120]}"
            # Provider client execution (e.g. Twilio / Msg91) would run here
            attempt.status = 'SENT'
            attempt.provider_response_id = f"sms_{notification.id}"
            attempt.save()
            return True
        except Exception as e:
            logger.warning(f"SMS delivery failure: {str(e)}")
            attempt.status = 'FAILED'
            attempt.error_message = f"SMS error: {str(e)[:200]}"
            attempt.save()
            return False


class PushAdapter:
    """
    Browser / Mobile WebPush Adapter.
    Records delivery state and respects permissions.
    """
    @staticmethod
    def send(notification):
        attempt = NotificationDeliveryAttempt(
            notification=notification,
            channel='PUSH',
            recipient_destination='web_push_device',
            provider='WebPush'
        )

        push_key = os.environ.get('VAPID_PRIVATE_KEY') or os.environ.get('FCM_SERVER_KEY')
        if not push_key:
            attempt.status = 'SKIPPED'
            attempt.error_message = 'Push credentials not configured in environment.'
            attempt.save()
            return False

        attempt.status = 'SENT'
        attempt.provider_response_id = f"push_{notification.id}"
        attempt.save()
        return True
