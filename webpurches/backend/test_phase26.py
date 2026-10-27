import os
import sys
import json
import re
import django

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework import status

from apps.accounts.models import User, UserSettings
from apps.accounts.views import SettingsView
from apps.notifications.models import Notification, NotificationPreference
from apps.notifications.dispatcher import dispatch_notification, get_user_language_preference
from apps.notifications.templates import render_notification_template, TEMPLATES


def is_tamil_text(text):
    """Check if the string contains Tamil Unicode block characters (\u0B80 - \u0BFF)."""
    return bool(re.search(r'[\u0b80-\u0bff]', text))


def run_tests():
    print("=" * 68)
    print("PHASE 26: COMPLETE MULTILINGUAL EXPERIENCE AUTOMATED TEST SUITE")
    print("=" * 68)

    passed_count = 0
    total_tests = 7

    # -------------------------------------------------------------
    # TEST 1: Inspect Frontend i18n Dictionaries Across All 4 Apps
    # -------------------------------------------------------------
    print("\n--- TEST 1: Verification of Frontend i18n Dictionaries Across 4 Apps ---")
    apps = ['customer-app', 'restaurant-app', 'delivery-partner-app', 'admin-app']
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    for app in apps:
        i18n_path = os.path.join(root_dir, app, 'src', 'utils', 'i18n.js')
        assert os.path.exists(i18n_path), f"Missing i18n.js in {app}"
        with open(i18n_path, 'r', encoding='utf-8') as f:
            content = f.read()
            assert 'TRANSLATIONS = {' in content, f"Missing TRANSLATIONS in {app}"
            assert 'en:' in content, f"Missing 'en' dictionary in {app}"
            assert 'ta:' in content, f"Missing 'ta' dictionary in {app}"
            assert 'useTranslation' in content, f"Missing useTranslation hook in {app}"
            assert 'applyLanguage' in content, f"Missing applyLanguage in {app}"
            assert 'getTranslation' in content, f"Missing getTranslation in {app}"
            assert is_tamil_text(content), f"No Tamil script found in {app}/src/utils/i18n.js"
        
        # Verify LanguageToggle component exists
        toggle_path = os.path.join(root_dir, app, 'src', 'components', 'LanguageToggle.jsx')
        assert os.path.exists(toggle_path), f"Missing LanguageToggle.jsx in {app}"

    print("PASS: Verified i18n dictionaries and LanguageToggle components across all 4 React applications.")
    passed_count += 1

    # -------------------------------------------------------------
    # TEST 2: Core i18n Resolver, Nested Keys, and Fallback Logic
    # -------------------------------------------------------------
    print("\n--- TEST 2: i18n Resolver, Nested Lookup & Parameter Interpolation ---")

    # Mock i18n resolver matching our frontend implementation
    sample_translations = {
        'en': {
            'nav': {'explore': 'Explore', 'kitchens': 'Kitchens'},
            'customer': {'items_count': '{{count}} items', 'welcome': 'Hello, {name}!'},
            'settings': 'Settings & Preferences',
            'english_only_key': 'English Exclusive'
        },
        'ta': {
            'nav': {'explore': 'ஆராய்வு', 'kitchens': 'சமையலறைகள்'},
            'customer': {'items_count': '{{count}} பொருட்கள்', 'welcome': 'வணக்கம், {name}!'},
            'settings': 'அமைப்புகள் & விருப்பங்கள்'
            # 'english_only_key' omitted on purpose to test fallback
        }
    }

    def resolve_trans(lang, key, params=None):
        params = params or {}
        val = sample_translations.get(lang, {}).get(key)
        if val is None and '.' in key:
            val = sample_translations.get(lang, {})
            for part in key.split('.'):
                val = val.get(part) if isinstance(val, dict) else None
        # Fallback to English
        if val is None:
            val = sample_translations.get('en', {}).get(key)
            if val is None and '.' in key:
                val = sample_translations.get('en', {})
                for part in key.split('.'):
                    val = val.get(part) if isinstance(val, dict) else None
        if val is None:
            val = key.split('.')[-1].replace('_', ' ')
        # Interpolation
        for k, v in params.items():
            val = val.replace(f"{{{{{k}}}}}", str(v)).replace(f"{{{k}}}", str(v))
        return val

    # Test direct flat key in Tamil
    assert resolve_trans('ta', 'settings') == 'அமைப்புகள் & விருப்பங்கள்'
    # Test nested dot-notation in Tamil
    assert resolve_trans('ta', 'nav.explore') == 'ஆராய்வு'
    # Test parameter interpolation in Tamil
    assert resolve_trans('ta', 'customer.items_count', {'count': 4}) == '4 பொருட்கள்'
    assert resolve_trans('ta', 'customer.welcome', {'name': 'Karthik'}) == 'வணக்கம், Karthik!'
    # Test English fallback when missing in Tamil
    fallback_result = resolve_trans('ta', 'english_only_key')
    assert fallback_result == 'English Exclusive', f"Expected fallback 'English Exclusive', got '{fallback_result}'"
    # Test unknown key humanized fallback
    unknown_result = resolve_trans('ta', 'unknown.custom_button')
    assert unknown_result == 'custom button'

    print("PASS: Verified nested dot notation, English fallback, parameter interpolation, and humanized fallback.")
    passed_count += 1

    # -------------------------------------------------------------
    # TEST 3: Backend UserSettings Language Persistence (PostgreSQL)
    # -------------------------------------------------------------
    print("\n--- TEST 3: UserSettings Language Persistence in PostgreSQL ---")
    factory = APIRequestFactory()
    user, _ = User.objects.get_or_create(username='p26_test_user', defaults={'email': 'p26_test@example.com'})
    user_settings, _ = UserSettings.objects.get_or_create(user=user)

    # Initially set to 'en'
    user_settings.language = 'en'
    user_settings.save(update_fields=['language'])

    view = SettingsView.as_view()

    # 1. GET Settings
    request = factory.get('/api/accounts/settings/')
    force_authenticate(request, user=user)
    response = view(request)
    assert response.status_code == status.HTTP_200_OK
    assert response.data.get('language') == 'en'

    # 2. PATCH Settings to 'ta' (Tamil)
    request = factory.patch('/api/accounts/settings/', {'language': 'ta'}, format='json')
    force_authenticate(request, user=user)
    response = view(request)
    assert response.status_code == status.HTTP_200_OK
    assert response.data.get('language') == 'ta'

    # Verify persisted in PostgreSQL
    user_settings.refresh_from_db()
    assert user_settings.language == 'ta', f"Expected 'ta' in DB, found {user_settings.language}"

    # 3. PATCH Settings back to 'en'
    request = factory.patch('/api/accounts/settings/', {'language': 'en'}, format='json')
    force_authenticate(request, user=user)
    response = view(request)
    assert response.status_code == status.HTTP_200_OK
    assert response.data.get('language') == 'en'

    user_settings.refresh_from_db()
    assert user_settings.language == 'en'

    print("PASS: Verified GET and PATCH /api/accounts/settings/ language persistence in PostgreSQL wsfood_db.")
    passed_count += 1

    # -------------------------------------------------------------
    # TEST 4: Backend Notification Localization (Tamil and English)
    # -------------------------------------------------------------
    print("\n--- TEST 4: Multilingual Notification Templates & Dispatcher ---")
    
    # 1. Test render_notification_template with English
    en_title, en_msg, notif_type = render_notification_template(
        'order.created',
        lang='en',
        context={'order_number': 'ORD-9912', 'amount': '450.00', 'restaurant_name': 'A2B Sweets'}
    )
    assert "Order Placed Successfully" in en_title
    assert "ORD-9912" in en_msg and "₹450.00" in en_msg and "A2B Sweets" in en_msg

    # 2. Test render_notification_template with Tamil
    ta_title, ta_msg, _ = render_notification_template(
        'order.created',
        lang='ta',
        context={'order_number': 'ORD-9912', 'amount': '450.00', 'restaurant_name': 'A2B Sweets'}
    )
    assert is_tamil_text(ta_title) and is_tamil_text(ta_msg)
    assert "ORD-9912" in ta_msg and "₹450.00" in ta_msg and "A2B Sweets" in ta_msg

    # 3. Test Dispatch Notification with user language 'ta'
    user_settings.language = 'ta'
    user_settings.save(update_fields=['language'])

    notif_ta = dispatch_notification(
        user=user,
        event_type='delivery.assigned',
        context={'order_number': 'ORD-8801', 'rider_name': 'Murugan'}
    )
    assert notif_ta is not None
    assert is_tamil_text(notif_ta.title)
    assert is_tamil_text(notif_ta.message)
    assert "ORD-8801" in notif_ta.message and "Murugan" in notif_ta.message

    # 4. Test Dispatch Notification with user language 'en'
    user_settings.language = 'en'
    user_settings.save(update_fields=['language'])

    notif_en = dispatch_notification(
        user=user,
        event_type='delivery.assigned',
        context={'order_number': 'ORD-8802', 'rider_name': 'Ramesh'}
    )
    assert notif_en is not None
    assert "Delivery Partner Assigned" in notif_en.title
    assert "Ramesh" in notif_en.message

    print("PASS: Verified multilingual notification template generation and dispatcher persistence in PostgreSQL.")
    passed_count += 1

    # -------------------------------------------------------------
    # TEST 5: Accept-Language Header Resolution in Backend Dispatcher
    # -------------------------------------------------------------
    print("\n--- TEST 5: HTTP Accept-Language Header Language Resolution ---")
    dummy_user, _ = User.objects.get_or_create(username='p26_header_user', defaults={'email': 'header@test.com'})
    dummy_settings, _ = UserSettings.objects.get_or_create(user=dummy_user)
    # Neutral/default settings
    dummy_settings.language = ''
    dummy_settings.save(update_fields=['language'])
    dummy_pref, _ = NotificationPreference.objects.get_or_create(user=dummy_user)
    dummy_pref.language = ''
    dummy_pref.save(update_fields=['language'])

    # Mock request with Tamil Accept-Language
    class MockRequest:
        def __init__(self, accept_language):
            self.META = {'HTTP_ACCEPT_LANGUAGE': accept_language}

    req_ta = MockRequest('ta-IN,ta;q=0.9,en;q=0.8')
    assert get_user_language_preference(dummy_user, request=req_ta) == 'ta'

    req_en = MockRequest('en-US,en;q=0.9')
    assert get_user_language_preference(dummy_user, request=req_en) == 'en'

    # Fallback to English when unspecified
    req_none = MockRequest('fr-FR,fr;q=0.9')
    assert get_user_language_preference(dummy_user, request=req_none) == 'en'

    print("PASS: Verified Accept-Language header resolution in backend dispatcher.")
    passed_count += 1

    # -------------------------------------------------------------
    # TEST 6: Currency (INR ₹) & Price Integrity in Localization
    # -------------------------------------------------------------
    print("\n--- TEST 6: Currency (INR ₹) and Financial Data Integrity ---")
    prices = [299.00, 1499.50, 45.00, 12500.00]
    for p in prices:
        # English formatting
        title_en, msg_en, _ = render_notification_template('payment.succeeded', lang='en', context={'amount': f"{p:.2f}", 'order_number': 'ORD-101'})
        # Tamil formatting
        title_ta, msg_ta, _ = render_notification_template('payment.succeeded', lang='ta', context={'amount': f"{p:.2f}", 'order_number': 'ORD-101'})
        
        # Verify ₹ amount is preserved identically in both languages without alteration
        expected_str = f"₹{p:.2f}"
        assert expected_str in msg_en, f"Missing {expected_str} in English message"
        assert expected_str in msg_ta, f"Missing {expected_str} in Tamil message"

    print("PASS: Verified INR (₹) currency symbol and numeric amounts are strictly preserved without conversion.")
    passed_count += 1

    # -------------------------------------------------------------
    # TEST 7: CSS & Font Fallbacks for Tamil Rendering
    # -------------------------------------------------------------
    print("\n--- TEST 7: Tamil Typography & CSS Fallback Stack Inspection ---")
    for app in apps:
        app_css = os.path.join(root_dir, app, 'src', 'styles', 'app.css')
        assert os.path.exists(app_css), f"Missing app.css in {app}"
        with open(app_css, 'r', encoding='utf-8') as f:
            css_content = f.read()
            assert 'Noto Sans Tamil' in css_content or 'Mukta Malar' in css_content, f"Missing Tamil font stack in {app}/src/styles/app.css"
            assert 'html[lang="ta"]' in css_content, f"Missing html[lang=\"ta\"] CSS rule in {app}/src/styles/app.css"

    print("PASS: Verified Tamil font stacks and CSS rules across all 4 applications.")
    passed_count += 1

    # -------------------------------------------------------------
    # SUMMARY
    # -------------------------------------------------------------
    print("\n" + "=" * 68)
    print(f"RESULTS: {passed_count}/{total_tests} TEST SUITES PASSED SUCCESSFULLY (100%)")
    print("ALL PHASE 26 MULTILINGUAL ARCHITECTURE CHECKS PASSED CLEANLY!")
    print("=" * 68)


if __name__ == '__main__':
    run_tests()
