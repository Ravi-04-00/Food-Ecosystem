"""
Django settings for FD FOOD - Next-Generation Food Delivery Ecosystem.
Cyberpunk × Kinetic × 3D Food Technology
"""

from pathlib import Path
from datetime import timedelta
import os
from django.core.exceptions import ImproperlyConfigured

BASE_DIR = Path(__file__).resolve().parent.parent

DEBUG = os.environ.get('DJANGO_DEBUG', 'True').lower() in ('true', '1')

_env_secret = os.environ.get('DJANGO_SECRET_KEY')
if not _env_secret:
    if not DEBUG:
        raise ImproperlyConfigured("CRITICAL SECURITY VIOLATION: DJANGO_SECRET_KEY environment variable is mandatory when DJANGO_DEBUG=False.")
    SECRET_KEY = 'django-insecure-FDfood-cyberpunk-ecosystem-2026-key'
else:
    SECRET_KEY = _env_secret

allowed_hosts_raw = os.environ.get('DJANGO_ALLOWED_HOSTS') or os.environ.get('ALLOWED_HOSTS')
if allowed_hosts_raw:
    ALLOWED_HOSTS = [h.strip() for h in allowed_hosts_raw.split(',') if h.strip()]
elif not DEBUG:
    ALLOWED_HOSTS = ['localhost', '127.0.0.1', 'fastdelivery.com', '*.fastdelivery.com']
else:
    ALLOWED_HOSTS = ['*']

# Application definition
INSTALLED_APPS = [
    'daphne',  # ASGI WebSocket support
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'channels',

    # FD FOOD modular apps
    'apps.accounts',
    'apps.categories',
    'apps.products',
    'apps.orders',
    'apps.payments',
    'apps.reviews',
    'apps.seller',
    'apps.chat',
    'apps.notifications',
    'apps.wishlist',
    'apps.delivery',
    'apps.coupons',
    'apps.shifts',
    'apps.social',
    'apps.adminpanel',
    'apps.restaurants',
    'apps.menu',
    'apps.cart',
    'apps.discovery',
    'apps.analytics',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

# Database configuration: PostgreSQL ONLY (Phase 2 Requirement)
pg_db = os.environ.get('POSTGRES_DB', 'fdfood_db')
pg_user = os.environ.get('POSTGRES_USER', 'postgres')
pg_password = os.environ.get('POSTGRES_PASSWORD', 'root')
pg_host = os.environ.get('POSTGRES_HOST', 'localhost')
pg_port = os.environ.get('POSTGRES_PORT', '5432')

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': pg_db,
        'USER': pg_user,
        'PASSWORD': pg_password,
        'HOST': pg_host,
        'PORT': pg_port,
        'CONN_MAX_AGE': int(os.environ.get('DB_CONN_MAX_AGE', '60')),
        # Dedicated test database: defaults to test_fdfood_db, but that name
        # collides with a pre-existing leftover database, so use a fresh,
        # separate name. Reversible: remove this TEST block to restore default.
        # Never points at fdfood_db (dev data stays untouched).
        'TEST': {
            'NAME': os.environ.get('POSTGRES_TEST_DB', 'test_fdfood_db_fresh'),
        },
    }
}

# REST Framework Configuration (Phase 29 Hardened)
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 25,
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
        'rest_framework.throttling.ScopedRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '200/minute',
        'user': '1000/minute',
        'auth': '20/minute',
        'register': '15/minute',
        'otp': '10/minute',
        'support': '30/minute',
    },
}

# JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# CORS & CSRF Configuration (Phase 29 Hardened: Explicit origins per browser standards)
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://localhost:3002',
    'http://127.0.0.1:3002',
    'http://localhost:3003',
    'http://127.0.0.1:3003',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
]
cors_extra = os.environ.get('CORS_ALLOWED_ORIGINS')
if cors_extra:
    CORS_ALLOWED_ORIGINS.extend([origin.strip() for origin in cors_extra.split(',') if origin.strip()])

CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://localhost:3002',
    'http://127.0.0.1:3002',
    'http://localhost:3003',
    'http://127.0.0.1:3003',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
]
csrf_extra = os.environ.get('CSRF_TRUSTED_ORIGINS')
if csrf_extra:
    CSRF_TRUSTED_ORIGINS.extend([origin.strip() for origin in csrf_extra.split(',') if origin.strip()])

# Security Headers (Phase 29 & 30 Hardened)
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'

# Phase 30: Production SSL, Cookies & Reverse Proxy Configuration
SECURE_SSL_REDIRECT = os.environ.get('SECURE_SSL_REDIRECT', 'False').lower() in ('true', '1')
SESSION_COOKIE_SECURE = os.environ.get('SESSION_COOKIE_SECURE', 'False').lower() in ('true', '1')
CSRF_COOKIE_SECURE = os.environ.get('CSRF_COOKIE_SECURE', 'False').lower() in ('true', '1')
SECURE_HSTS_SECONDS = int(os.environ.get('SECURE_HSTS_SECONDS', '0'))
SECURE_HSTS_INCLUDE_SUBDOMAINS = os.environ.get('SECURE_HSTS_INCLUDE_SUBDOMAINS', 'False').lower() in ('true', '1')
SECURE_HSTS_PRELOAD = os.environ.get('SECURE_HSTS_PRELOAD', 'False').lower() in ('true', '1')

if os.environ.get('USE_X_FORWARDED_PROTO', 'True').lower() in ('true', '1'):
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Password Validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 8},
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static & Media
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
AUTH_USER_MODEL = 'accounts.User'

# Phase 28: Channels Layer Configuration (InMemory for dev, Redis for multi-process production)
REDIS_URL = os.environ.get('REDIS_URL') or os.environ.get('CHANNEL_LAYER_REDIS_URL')
if REDIS_URL:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels_redis.core.RedisChannelLayer",
            "CONFIG": {
                "hosts": [REDIS_URL],
            },
        }
    }
else:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels.layers.InMemoryChannelLayer"
        }
    }

# Payment Gateway Configuration (Phase 14: Razorpay)
RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID', os.environ.get('PAYMENT_GATEWAY_KEY', 'rzp_test_wsfood12345678'))
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', os.environ.get('PAYMENT_GATEWAY_SECRET', 'secret_wsfood_test_key_84920'))
RAZORPAY_WEBHOOK_SECRET = os.environ.get('RAZORPAY_WEBHOOK_SECRET', os.environ.get('WEBHOOK_SECRET', 'whsec_wsfood_webhook_secret_key'))

# Google Maps API Configuration (Phase 15: Live GPS & Routing)
GOOGLE_MAPS_API_KEY = os.environ.get('GOOGLE_MAPS_API_KEY', os.environ.get('VITE_GOOGLE_MAPS_API_KEY', ''))

# Phase 30: Structured Logging for Production & DevOps
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{asctime}] {levelname} [{name}:{lineno}] {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': os.environ.get('LOG_LEVEL', 'INFO'),
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': os.environ.get('DJANGO_LOG_LEVEL', 'INFO'),
            'propagate': False,
        },
        'django.security': {
            'handlers': ['console'],
            'level': 'WARNING',
            'propagate': False,
        },
        'apps': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}


