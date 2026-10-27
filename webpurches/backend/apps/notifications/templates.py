"""
Multilingual Notification Templates Module for FD Food Delivery Platform.
Provides localized templates for English ('en') and Tamil ('ta').
"""

TEMPLATES = {
    'order.created': {
        'en': {
            'title': "Order Placed Successfully",
            'message': "Your order #{order_number} for ₹{amount} has been placed with {restaurant_name}.",
            'notification_type': 'ORDER'
        },
        'ta': {
            'title': "ஆர்டர் வெற்றிகரமாக பதிவு செய்யப்பட்டது",
            'message': "{restaurant_name} உணவகத்தில் ₹{amount} மதிப்புள்ள உங்கள் ஆர்டர் #{order_number} பதிவு செய்யப்பட்டது.",
            'notification_type': 'ORDER'
        }
    },
    'order.new_for_restaurant': {
        'en': {
            'title': "New Order Received",
            'message': "New order #{order_number} for ₹{amount} received from {customer_name}.",
            'notification_type': 'ORDER'
        },
        'ta': {
            'title': "புதிய ஆர்டர் வந்துள்ளது",
            'message': "₹{amount} மதிப்புள்ள புதிய ஆர்டர் #{order_number} உங்கள் உணவகத்திற்கு வந்துள்ளது.",
            'notification_type': 'ORDER'
        }
    },
    'order.accepted': {
        'en': {
            'title': "Order Confirmed by Kitchen",
            'message': "Great news! {restaurant_name} has accepted and confirmed your order #{order_number}.",
            'notification_type': 'ORDER'
        },
        'ta': {
            'title': "ஆர்டர் உறுதி செய்யப்பட்டது",
            'message': "{restaurant_name} உங்கள் ஆர்டர் #{order_number}-ஐ ஏற்றுக்கொண்டு உறுதி செய்துள்ளது.",
            'notification_type': 'ORDER'
        }
    },
    'order.rejected': {
        'en': {
            'title': "Order Declined",
            'message': "Order #{order_number} was declined by {restaurant_name}. Reason: {reason}.",
            'notification_type': 'ORDER'
        },
        'ta': {
            'title': "ஆர்டர் நிராகரிக்கப்பட்டது",
            'message': "{restaurant_name} உங்கள் ஆர்டர் #{order_number}-ஐ நிராகரித்துள்ளது. காரணம்: {reason}.",
            'notification_type': 'ORDER'
        }
    },
    'order.preparing': {
        'en': {
            'title': "Food is Being Prepared",
            'message': "The kitchen at {restaurant_name} has started preparing your order #{order_number}.",
            'notification_type': 'ORDER'
        },
        'ta': {
            'title': "உணவு தயாரிக்கப்படுகிறது",
            'message': "{restaurant_name} உணவகம் உங்கள் ஆர்டர் #{order_number}-க்கான உணவை தயாரித்து வருகிறது.",
            'notification_type': 'ORDER'
        }
    },
    'order.ready_for_pickup': {
        'en': {
            'title': "Order Ready for Pickup",
            'message': "Order #{order_number} at {restaurant_name} is packed and awaiting courier pickup.",
            'notification_type': 'ORDER'
        },
        'ta': {
            'title': "ஆர்டர் எடுக்க தயாராக உள்ளது",
            'message': "உங்கள் ஆர்டர் #{order_number} பேக் செய்யப்பட்டு எடுக்க தயாராக உள்ளது.",
            'notification_type': 'ORDER'
        }
    },
    'order.cancelled': {
        'en': {
            'title': "Order Cancelled",
            'message': "Order #{order_number} has been cancelled. Reason: {reason}.",
            'notification_type': 'ORDER'
        },
        'ta': {
            'title': "ஆர்டர் ரத்து செய்யப்பட்டது",
            'message': "ஆர்டர் #{order_number} ரத்து செய்யப்பட்டுள்ளது. காரணம்: {reason}.",
            'notification_type': 'ORDER'
        }
    },
    'delivery.assigned': {
        'en': {
            'title': "Delivery Partner Assigned",
            'message': "Courier {rider_name} has been assigned to deliver order #{order_number}.",
            'notification_type': 'DELIVERY'
        },
        'ta': {
            'title': "டெலிவரி பார்ட்னர் ஒதுக்கப்பட்டார்",
            'message': "உங்கள் ஆர்டர் #{order_number}-ஐ டெலிவரி செய்ய {rider_name} நியமிக்கப்பட்டுள்ளார்.",
            'notification_type': 'DELIVERY'
        }
    },
    'delivery.new_job_available': {
        'en': {
            'title': "New Delivery Job Available",
            'message': "Order #{order_number} from {restaurant_name} is ready for delivery dispatch.",
            'notification_type': 'DELIVERY'
        },
        'ta': {
            'title': "புதிய டெலிவரி பணி உள்ளது",
            'message': "{restaurant_name} உணவகத்திலிருந்து புதிய ஆர்டர் #{order_number} டெலிவரிக்கு தயாராக உள்ளது.",
            'notification_type': 'DELIVERY'
        }
    },
    'delivery.picked_up': {
        'en': {
            'title': "Order Picked Up & On the Way",
            'message': "Courier {rider_name} has picked up order #{order_number} and is on the way.",
            'notification_type': 'DELIVERY'
        },
        'ta': {
            'title': "ஆர்டர் எடுக்கப்பட்டு வழியில் உள்ளது",
            'message': "உங்கள் ஆர்டர் #{order_number} எடுக்கப்பட்டு உங்களை நோக்கி வந்து கொண்டிருக்கிறது.",
            'notification_type': 'DELIVERY'
        }
    },
    'delivery.completed': {
        'en': {
            'title': "Order Delivered Successfully",
            'message': "Order #{order_number} has been delivered. Enjoy your meal!",
            'notification_type': 'DELIVERY'
        },
        'ta': {
            'title': "ஆர்டர் வெற்றிகரமாக டெலிவரி செய்யப்பட்டது",
            'message': "உங்கள் ஆர்டர் #{order_number} டெலிவரி செய்யப்பட்டது. உணவை மகிழ்ந்து உண்ணுங்கள்!",
            'notification_type': 'DELIVERY'
        }
    },
    'delivery.job_offered': {
        'en': {
            'title': "New Delivery Job Offer",
            'message': "New job offer for Order #{order_number} from {restaurant_name}. Est. payout ₹{payout} ({distance_km} km).",
            'notification_type': 'DELIVERY'
        },
        'ta': {
            'title': "புதிய டெலிவரி வாய்ப்பு",
            'message': "{restaurant_name} உணவகத்திலிருந்து ஆர்டர் #{order_number}-க்கான டெலிவரி வாய்ப்பு. எதிர்பார்க்கப்படும் வருவாய் ₹{payout}.",
            'notification_type': 'DELIVERY'
        }
    },
    'delivery.offer_expired': {
        'en': {
            'title': "Job Offer Timed Out",
            'message': "Job offer for Order #{order_number} has timed out and re-routed.",
            'notification_type': 'DELIVERY'
        },
        'ta': {
            'title': "டெலிவரி வாய்ப்பு காலாவதியானது",
            'message': "ஆர்டர் #{order_number}-க்கான டெலிவரி வாய்ப்பு நேரம் முடிந்து அடுத்த பார்ட்னருக்கு மாற்றப்பட்டது.",
            'notification_type': 'DELIVERY'
        }
    },
    'delivery.reassigned': {
        'en': {
            'title': "Delivery Order Reassigned",
            'message': "Order #{order_number} has been reassigned to delivery partner {partner_name}.",
            'notification_type': 'DELIVERY'
        },
        'ta': {
            'title': "டெலிவரி மறுஒதுக்கீடு செய்யப்பட்டது",
            'message': "ஆர்டர் #{order_number} டெலிவரி செய்ய {partner_name} என்பவருக்கு மறுஒதுக்கீடு செய்யப்பட்டது.",
            'notification_type': 'DELIVERY'
        }
    },
    'payment.succeeded': {
        'en': {
            'title': "Payment Verified",
            'message': "Payment of ₹{amount} for order #{order_number} was verified successfully.",
            'notification_type': 'PAYMENT'
        },
        'ta': {
            'title': "பணம் செலுத்துதல் உறுதிசெய்யப்பட்டது",
            'message': "ஆர்டர் #{order_number}-க்கான ₹{amount} கட்டணம் வெற்றிகரமாக உறுதிசெய்யப்பட்டது.",
            'notification_type': 'PAYMENT'
        }
    },
    'payment.failed': {
        'en': {
            'title': "Payment Failed",
            'message': "Payment for order #{order_number} could not be completed. Please retry.",
            'notification_type': 'PAYMENT'
        },
        'ta': {
            'title': "பணம் செலுத்துதல் தோல்வியடைந்தது",
            'message': "ஆர்டர் #{order_number}-க்கான கட்டணம் தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்.",
            'notification_type': 'PAYMENT'
        }
    },
    'admin.restaurant_pending': {
        'en': {
            'title': "Restaurant Awaiting Verification",
            'message': "Restaurant '{restaurant_name}' submitted onboarding documentation for approval.",
            'notification_type': 'SYSTEM'
        },
        'ta': {
            'title': "உணவக சரிபார்ப்பு நிலுவையில் உள்ளது",
            'message': "'{restaurant_name}' உணவகம் சரிபார்ப்பு ஆவணங்களை சமர்ப்பித்துள்ளது.",
            'notification_type': 'SYSTEM'
        }
    },
    'admin.delivery_issue': {
        'en': {
            'title': "Delivery Incident Reported",
            'message': "Courier {rider_name} reported an issue on order #{order_number}: {issue_type}.",
            'notification_type': 'DELIVERY'
        },
        'ta': {
            'title': "டெலிவரி பிரச்சனை பதிவு செய்யப்பட்டது",
            'message': "ஆர்டர் #{order_number}-ல் ரைடர் {rider_name} ஒரு பிரச்சனையை பதிவு செய்துள்ளார்: {issue_type}.",
            'notification_type': 'DELIVERY'
        }
    },
    'system.alert': {
        'en': {
            'title': "System Operational Alert",
            'message': "{message}",
            'notification_type': 'SYSTEM'
        },
        'ta': {
            'title': "கணினி விழிப்பூட்டல்",
            'message': "{message}",
            'notification_type': 'SYSTEM'
        }
    },
    'support.ticket_created': {
        'en': {
            'title': "Support Ticket Created #{ticket_number}",
            'message': "Your support ticket #{ticket_number} for '{subject}' has been submitted.",
            'notification_type': 'SUPPORT'
        },
        'ta': {
            'title': "ஆதரவு டிக்கெட் உருவாக்கப்பட்டது #{ticket_number}",
            'message': "'{subject}' தொடர்பான உங்கள் உதவி டிக்கெட் #{ticket_number} சமர்ப்பிக்கப்பட்டது.",
            'notification_type': 'SUPPORT'
        }
    },
    'support.ticket_replied': {
        'en': {
            'title': "New Response on Ticket #{ticket_number}",
            'message': "New reply received on ticket #{ticket_number} from {sender_name}.",
            'notification_type': 'SUPPORT'
        },
        'ta': {
            'title': "டிக்கெட் #{ticket_number}-ல் புதிய பதில்",
            'message': "டிக்கெட் #{ticket_number}-க்கு {sender_name}-இடமிருந்து புதிய பதில் வந்துள்ளது.",
            'notification_type': 'SUPPORT'
        }
    },
    'support.ticket_escalated': {
        'en': {
            'title': "Ticket Escalated #{ticket_number}",
            'message': "Ticket #{ticket_number} has been escalated for priority resolution: {reason}.",
            'notification_type': 'SUPPORT'
        },
        'ta': {
            'title': "டிக்கெட் தீவிரப்படுத்தப்பட்டது #{ticket_number}",
            'message': "டிக்கெட் #{ticket_number} முன்னுரிமை தீர்வுக்கு மாற்றப்பட்டுள்ளது: {reason}.",
            'notification_type': 'SUPPORT'
        }
    },
    'support.ticket_resolved': {
        'en': {
            'title': "Ticket Resolved #{ticket_number}",
            'message': "Your ticket #{ticket_number} has been resolved: {resolution_summary}",
            'notification_type': 'SUPPORT'
        },
        'ta': {
            'title': "டிக்கெட் தீர்க்கப்பட்டது #{ticket_number}",
            'message': "உங்கள் டிக்கெட் #{ticket_number} தீர்க்கப்பட்டது: {resolution_summary}",
            'notification_type': 'SUPPORT'
        }
    },
    'support.ticket_closed': {
        'en': {
            'title': "Ticket Closed #{ticket_number}",
            'message': "Support ticket #{ticket_number} has been marked as closed.",
            'notification_type': 'SUPPORT'
        },
        'ta': {
            'title': "டிக்கெட் மூடப்பட்டது #{ticket_number}",
            'message': "ஆதரவு டிக்கெட் #{ticket_number} மூடப்பட்டதாக குறிக்கப்பட்டுள்ளது.",
            'notification_type': 'SUPPORT'
        }
    }
}


def render_notification_template(event_type, lang='en', context=None):
    """
    Renders localized notification title, message, and type.
    Falls back gracefully to English if language is not 'ta' or if key is missing.
    """
    context = context or {}
    lang_code = 'ta' if str(lang).lower().startswith('ta') else 'en'
    
    event_templates = TEMPLATES.get(event_type, TEMPLATES['system.alert'])
    template = event_templates.get(lang_code, event_templates.get('en', TEMPLATES['system.alert']['en']))
    
    raw_title = template['title']
    raw_message = template['message']
    notification_type = template['notification_type']

    # Safe formatting without raising KeyError
    def safe_format(template_str, ctx):
        formatted = template_str
        for k, v in ctx.items():
            formatted = formatted.replace(f"{{{k}}}", str(v) if v is not None else '')
        # Remove any lingering unreplaced {placeholder} tags
        import re
        formatted = re.sub(r'\{[a-zA-Z0-9_]+\}', '', formatted)
        return formatted.strip()

    title = safe_format(raw_title, context)
    message = safe_format(raw_message, context)
    
    return title, message, notification_type
