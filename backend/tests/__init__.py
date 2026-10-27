"""
FD Foods — Backend Test Suite Gateway.
Exposes domain & core automated tests under backend/tests.
"""

from apps.core_tests.test_health import *
from apps.core_tests.test_auth_and_rbac import *
from apps.core_tests.test_orders_and_inventory import *
from apps.core_tests.test_payments_and_webhooks import *
from apps.core_tests.test_delivery_and_dispatch import *
from apps.core_tests.test_pickup_and_delivery_verification import *
from apps.core_tests.test_restaurant_availability_and_cart import *
from apps.core_tests.test_variant_validation_and_cart import *
from apps.core_tests.test_realtime_and_channels import *
from apps.core_tests.test_shifts_regression import *
from apps.core_tests.test_support_and_audit import *
from apps.core_tests.test_e2e_workflows import *
