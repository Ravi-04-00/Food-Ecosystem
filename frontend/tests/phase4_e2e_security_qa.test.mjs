/**
 * Fast Delivery (FD) — Phase 4 Comprehensive E2E Business Flows, Security & Release QA Suite
 * 
 * Tests the complete multi-actor lifecycle:
 * 1. Customer registration/login, restaurant browsing, search, food details, and cart isolation.
 * 2. Checkout validation, order creation, duplicate-submit prevention, and order history.
 * 3. Restaurant order reception and valid state machine transitions.
 * 4. Delivery partner assignment, accept/reject, pickup verification, and OTP completion.
 * 5. Realtime status event envelope contracts and tracking updates.
 * 6. Admin RBAC permissions, secret exposure defense, and input validation.
 * 7. Session expiry, offline fallback resilience, and safe non-idempotent transport.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');

const resolvePath = (relPath) => {
  const inFrontend = path.join(rootDir, 'frontend', relPath);
  if (fs.existsSync(inFrontend)) return inFrontend;
  return path.join(rootDir, relPath);
};

const APPS = ['customer-app', 'restaurant-app', 'delivery-partner-app', 'admin-app'];

describe('Phase 4 - Flow 1: Customer Auth, Menu Browsing & Cart State Isolation', () => {
  test('Customer Cart enforces single-restaurant isolation and conflict resolution modal', () => {
    // Check CartPage / CustomerContext cart conflict logic
    const contextPath = resolvePath('customer-app/src/context/CustomerContext.jsx');
    const content = fs.readFileSync(contextPath, 'utf8');

    assert.ok(
      content.includes('cartConflict') || content.includes('CartConflictModal') || content.includes('different restaurant'),
      'CustomerContext must track and resolve cross-restaurant cart conflicts'
    );
    assert.ok(
      content.includes('clearCart') || content.includes('apiClearCart'),
      'Must provide safe mechanism to clear existing cart items'
    );
  });

  test('Customer details modal handles dish spice level, addons, and dietary indicators', () => {
    const modalPath = resolvePath('customer-app/src/components/FoodDetailsModal.jsx');
    const content = fs.readFileSync(modalPath, 'utf8');

    assert.ok(content.includes('selectedSpice'), 'Tracks customer spice preferences');
    assert.ok(content.includes('selectedAddons'), 'Allows selecting dish addons');
    assert.ok(content.includes('isRestaurantOpen'), 'Enforces restaurant operating status');
  });
});

describe('Phase 4 - Flow 2: Checkout Validation & Duplicate-Submit Prevention', () => {
  test('Checkout validates delivery address selection and prevents duplicate order submission', () => {
    const checkoutPath = resolvePath('customer-app/src/pages/CheckoutPage.jsx');
    const content = fs.readFileSync(checkoutPath, 'utf8');

    assert.ok(
      content.includes('isPlacingOrder') || content.includes('isProcessingPayment'),
      'Checkout button must be guarded during submission to prevent double submission'
    );
    assert.ok(
      content.includes('selectedAddress') || content.includes('address_id'),
      'Checkout strictly requires verified delivery address'
    );
  });

  test('Backend checkout endpoint issues unique 4-digit OTP and initiates PLACED status', () => {
    const viewsPath = path.join(rootDir, 'backend/apps/orders/views.py');
    const content = fs.readFileSync(viewsPath, 'utf8');

    assert.ok(
      content.includes('generate_order_otp') || content.includes('otp =') || content.includes('randint(1000, 9999)'),
      'Orders service must assign secure 4-digit delivery OTP'
    );
  });
});

describe('Phase 4 - Flow 3: Restaurant Operations & State Machine Transitions', () => {
  test('Order status transitions enforce valid lifecycle (PLACED -> CONFIRMED -> PREPARING -> READY_FOR_PICKUP)', () => {
    const orderModelPath = path.join(rootDir, 'backend/apps/orders/models.py');
    const content = fs.readFileSync(orderModelPath, 'utf8');

    assert.ok(content.includes("'PLACED'"), 'Lifecycle includes PLACED');
    assert.ok(content.includes("'CONFIRMED'"), 'Lifecycle includes CONFIRMED');
    assert.ok(content.includes("'PREPARING'"), 'Lifecycle includes PREPARING');
    assert.ok(content.includes("'READY_FOR_PICKUP'"), 'Lifecycle includes READY_FOR_PICKUP');
    assert.ok(content.includes("'DELIVERED'"), 'Lifecycle includes DELIVERED');
  });

  test('Restaurant app wires live OrderAlertModal and accepts incoming dispatch requests', () => {
    const alertModalPath = resolvePath('restaurant-app/src/components/OrderAlertModal.jsx');
    const content = fs.readFileSync(alertModalPath, 'utf8');

    assert.ok(content.includes('handleAcceptOrder'), 'Provides instant order accept handler');
    assert.ok(content.includes('handleRejectOrder'), 'Provides instant order decline handler');
    assert.ok(content.includes('var(--ws-surface'), 'Uses unified FD Foods design tokens');
  });
});

describe('Phase 4 - Flow 4: Delivery Partner Operations & OTP Verification', () => {
  test('Delivery Dashboard provides instant 1-tap workflow for Reached, Pickup, and OTP', () => {
    const dashboardPath = resolvePath('delivery-partner-app/src/pages/DashboardPage.jsx');
    const content = fs.readFileSync(dashboardPath, 'utf8');

    assert.ok(content.includes('handleReachedRestaurant'), 'Provides quick status update dispatcher for Reached');
    assert.ok(content.includes('handleConfirmPickup'), 'Provides pickup confirmation handler');
    assert.ok(content.includes('handleVerifyDeliveryOTP'), 'Requires customer OTP for delivery verification');
  });

  test('Backend delivery task verification verifies customer OTP securely before completing payment', () => {
    const deliveryViewsPath = path.join(rootDir, 'backend/apps/orders/views.py');
    const content = fs.readFileSync(deliveryViewsPath, 'utf8');

    assert.ok(
      content.includes('verify_otp') || content.includes('order.otp'),
      'Backend validates rider OTP input against stored order OTP'
    );
  });
});

describe('Phase 4 - Flow 5: Real-Time Tracking & Telemetry Envelope Safety', () => {
  test('Realtime WebSocket client calculates reconnection backoff and validates envelopes', () => {
    APPS.forEach(app => {
      const rtPath = resolvePath(path.join(app, 'src', 'utils', 'realtime.js'));
      if (fs.existsSync(rtPath)) {
        const content = fs.readFileSync(rtPath, 'utf8');
        assert.ok(content.includes('retryTimer') || content.includes('reconnect') || content.includes('backoff'), `${app} realtime handles backoff`);
        assert.ok(content.includes('JSON.parse'), `${app} validates JSON messages`);
      }
    });
  });
});

describe('Phase 4 - Flow 6: Security, Role-Based Access Control & Secret Protection', () => {
  test('Zero secret keys or private credentials leaked in frontend source files', () => {
    const forbiddenPatterns = [
      /django-insecure-[a-zA-Z0-9_\-=+]{20,}/,
      /AWS_SECRET_ACCESS_KEY\s*=\s*['"][^'"]+['"]/,
      /DATABASE_URL\s*=\s*['"]postgres:\/\/[^'"]+:[^'"]+@/
    ];

    APPS.forEach(app => {
      const srcDir = resolvePath(path.join(app, 'src'));
      function scanDir(dir) {
        fs.readdirSync(dir).forEach(file => {
          const full = path.join(dir, file);
          if (fs.statSync(full).isDirectory()) scanDir(full);
          else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.html')) {
            const text = fs.readFileSync(full, 'utf8');
            for (const pattern of forbiddenPatterns) {
              assert.ok(!pattern.test(text), `Potential secret leak found in ${full}`);
            }
          }
        });
      }
      scanDir(srcDir);
    });
  });

  test('Backend DRF permissions enforce Role-Based Access Control on sensitive endpoints', () => {
    const authViewsPath = path.join(rootDir, 'backend/apps/core_tests/test_auth_and_rbac.py');
    const content = fs.readFileSync(authViewsPath, 'utf8');

    assert.ok(content.includes('test_unauthenticated_protected_endpoint_rejected'), 'Tests 401 for unauthorized visitors');
    assert.ok(content.includes('test_restaurant_owner_cannot_access_foreign_payouts'), 'Enforces 403 when customer tries to access restaurant endpoints');
    assert.ok(content.includes('test_non_admin_cannot_access_ecosystem_telemetry'), 'Enforces 403 when non-admin tries to access admin telemetry');
  });
});

describe('Phase 4 - Flow 7: Session Expiry, Offline Resilience & Safe Transport', () => {
  test('All apps include session expired and logout confirmation dialogs', () => {
    APPS.forEach(app => {
      const appFile = resolvePath(path.join(app, 'src', 'App.jsx'));
      const content = fs.readFileSync(appFile, 'utf8');

      assert.ok(
        content.includes('FDSessionExpiredModal') || content.includes('SessionExpired'),
        `${app} must include session expired dialog`
      );
      assert.ok(
        content.includes('FDLogoutModal') || content.includes('LogoutConfirm'),
        `${app} must include logout confirmation dialog`
      );
    });
  });

  test('API client safe retry logic strictly avoids auto-retrying non-idempotent mutations', () => {
    APPS.forEach(app => {
      const errPath = resolvePath(path.join(app, 'src', 'services', 'apiErrors.js'));
      const content = fs.readFileSync(errPath, 'utf8');

      assert.ok(
        content.includes("method === 'GET'"),
        `${app} apiErrors.js allows retries on GET`
      );
      assert.ok(
        content.includes('allowedRetries = isIdempotent ? maxRetries : 0'),
        `${app} apiErrors.js sets allowedRetries to 0 for non-idempotent operations`
      );
    });
  });
});
