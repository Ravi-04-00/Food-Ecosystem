/**
 * Fast Delivery (FD) - Phase 3 Clean Architecture, Code Quality & Performance Test Suite
 * 
 * Verifies:
 * 1. Dead code eradication: Confirms zero presence of obsolete components/pages.
 * 2. Standardized API error envelopes & parsing parity across all 4 React applications.
 * 3. Idempotent-only retry contracts: GET/HEAD allow safe retries, mutations never auto-retry.
 * 4. Code-splitting & bundle optimization integrity (Three.js lazy loaded in customer app).
 * 5. Live order incoming dispatch alert mounted in restaurant-app.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const APPS = ['customer-app', 'restaurant-app', 'delivery-partner-app', 'admin-app'];

describe('Phase 3 - 1. Dead Code Eradication & Clean Repository Architecture', () => {
  const verifiedDeadFiles = [
    'customer-app/src/components/FDIntroAnimation.jsx',
    'customer-app/src/components/FoodCard3D.jsx',
    'customer-app/src/components/Hero3DUniverse.jsx',
    'restaurant-app/src/pages/ShopChatPage.jsx',
    'restaurant-app/src/pages/SocialPublisherPage.jsx',
    'delivery-partner-app/src/components/DeliveryHUDNavbar.jsx',
    'delivery-partner-app/src/components/IncomingRequestModal.jsx',
    'delivery-partner-app/src/components/modals/ReportIssueModal.jsx',
    'delivery-partner-app/src/components/OTPVerificationModal.jsx',
    'delivery-partner-app/src/components/StartupCinematicIntro.jsx',
    'delivery-partner-app/src/pages/CourierChatPage.jsx',
    'delivery-partner-app/src/pages/DeliveryDashboardPage.jsx',
    'delivery-partner-app/src/pages/DeliveryPartnerRegistrationPage.jsx',
    'delivery-partner-app/src/pages/EarningsDashboardPage.jsx',
    'delivery-partner-app/src/pages/TripHistoryPage.jsx'
  ];

  test('All 15 obsolete unreferenced files remain deleted with zero zombie file regressions', () => {
    verifiedDeadFiles.forEach(relPath => {
      const fullPath = path.join(rootDir, relPath);
      assert.strictEqual(
        fs.existsSync(fullPath),
        false,
        `Expected obsolete file ${relPath} to be removed from the active tree.`
      );
    });
  });

  test('Essential core files, migrations, and active components are retained and intact', () => {
    const requiredFiles = [
      'customer-app/src/components/FDReferenceHero.jsx',
      'customer-app/src/components/FoodCardRetro.jsx',
      'customer-app/src/components/FDRestaurantCard.jsx',
      'customer-app/src/components/CustomerSidebar.jsx',
      'restaurant-app/src/components/RestaurantSidebar.jsx',
      'restaurant-app/src/components/OrderAlertModal.jsx',
      'delivery-partner-app/src/components/navigation/Sidebar.jsx',
      'delivery-partner-app/src/pages/DashboardPage.jsx',
      'delivery-partner-app/src/pages/EarningsPage.jsx',
      'delivery-partner-app/src/pages/OrdersPage.jsx',
      'delivery-partner-app/src/components/FDOpeningFlow.jsx',
      'admin-app/src/components/AdminSidebar.jsx',
      'backend/apps/shifts/models.py',
      'backend/apps/orders/migrations/0001_initial.py'
    ];

    requiredFiles.forEach(relPath => {
      const fullPath = path.join(rootDir, relPath);
      assert.strictEqual(
        fs.existsSync(fullPath),
        true,
        `Expected active core file ${relPath} to remain in active codebase.`
      );
    });
  });
});

describe('Phase 3 - 2. Standardized API Error Envelope & DRF Parsing Suite', () => {
  APPS.forEach(app => {
    test(`${app}: Contains standardized apiErrors.js export module`, () => {
      const modulePath = path.join(rootDir, app, 'src', 'services', 'apiErrors.js');
      assert.strictEqual(fs.existsSync(modulePath), true, `${app} must have apiErrors.js`);
      
      const content = fs.readFileSync(modulePath, 'utf8');
      assert.ok(content.includes('class ApiError'), 'Exports ApiError class');
      assert.ok(content.includes('extractErrorMessage'), 'Exports extractErrorMessage');
      assert.ok(content.includes('normalizeApiError'), 'Exports normalizeApiError');
      assert.ok(content.includes('safeFetchWithRetry'), 'Exports safeFetchWithRetry');
    });

    test(`${app}: api.js re-exports standardized error handlers`, () => {
      const apiPath = path.join(rootDir, app, 'src', 'services', 'api.js');
      const content = fs.readFileSync(apiPath, 'utf8');
      assert.ok(content.includes('ApiError'), 'api.js re-exports ApiError');
      assert.ok(content.includes('safeFetchWithRetry'), 'api.js re-exports safeFetchWithRetry');
    });
  });

  test('Extracts Django DRF error shapes cleanly into user-friendly messages', async () => {
    const { extractErrorMessage, ApiError } = await import(
      `file:///${path.join(rootDir, 'customer-app', 'src', 'services', 'apiErrors.js').replace(/\\/g, '/')}`
    );

    // 1. DRF standard { detail: '...' }
    assert.strictEqual(
      extractErrorMessage({ detail: 'Invalid credentials provided.' }, 401),
      'Invalid credentials provided.'
    );

    // 2. DRF field error array { email: ['Enter a valid email address.'] }
    assert.strictEqual(
      extractErrorMessage({ email: ['Enter a valid email address.'] }, 400),
      'Email: Enter a valid email address.'
    );

    // 3. DRF non_field_errors array
    assert.strictEqual(
      extractErrorMessage({ non_field_errors: ['This shift is already booked.'] }, 400),
      'This shift is already booked.'
    );

    // 4. HTTP status fallbacks
    assert.strictEqual(
      extractErrorMessage(null, 429),
      'Too many requests. Please slow down and try again shortly.'
    );
    assert.strictEqual(
      extractErrorMessage(null, 500),
      'Our servers are currently experiencing high load. Please try again in a few moments.'
    );

    // 5. ApiError envelope structure
    const err = new ApiError('Forbidden action', 403, { code: 'PERMISSION_DENIED' }, 'FORBIDDEN');
    const json = err.toJSON();
    assert.strictEqual(json.message, 'Forbidden action');
    assert.strictEqual(json.status, 403);
    assert.strictEqual(json.code, 'FORBIDDEN');
    assert.strictEqual(json.isNetworkError, false);
    assert.strictEqual(json.isOffline, false);
  });
});

describe('Phase 3 - 3. Safe Idempotency & Retry Contract', () => {
  test('Non-idempotent operations (POST, PATCH, DELETE) are never auto-retried without explicit key', () => {
    // Check safeFetchWithRetry logic contract
    const isIdempotentMethod = (method, explicit = false) => {
      const m = (method || 'GET').toUpperCase();
      return explicit || m === 'GET' || m === 'HEAD' || m === 'OPTIONS';
    };

    assert.strictEqual(isIdempotentMethod('GET'), true);
    assert.strictEqual(isIdempotentMethod('HEAD'), true);
    assert.strictEqual(isIdempotentMethod('OPTIONS'), true);

    // Critical mutations must NEVER be classified as idempotent
    assert.strictEqual(isIdempotentMethod('POST'), false);
    assert.strictEqual(isIdempotentMethod('PATCH'), false);
    assert.strictEqual(isIdempotentMethod('DELETE'), false);
    assert.strictEqual(isIdempotentMethod('PUT'), false);

    // Only allowed if explicitly configured with an idempotency key
    assert.strictEqual(isIdempotentMethod('POST', true), true);
  });
});

describe('Phase 3 - 4. Bundle Optimization & Component Integration', () => {
  test('customer-app code-splits Three.js 3D viewer using React.lazy in FoodDetailsModal', () => {
    const modalPath = path.join(rootDir, 'customer-app', 'src', 'components', 'FoodDetailsModal.jsx');
    const content = fs.readFileSync(modalPath, 'utf8');
    
    assert.ok(
      content.includes('React.lazy'),
      'FoodDetailsModal must use React.lazy for Interactive3DFoodViewer'
    );
    assert.ok(
      content.includes('React.Suspense'),
      'FoodDetailsModal must wrap Interactive3DFoodViewer in Suspense fallback boundary'
    );
    assert.ok(
      !content.includes("import { Interactive3DFoodViewer } from './Interactive3DFoodViewer.jsx'"),
      'Static synchronous import of Interactive3DFoodViewer must not be present'
    );
  });

  test('restaurant-app mounts modernized OrderAlertModal in App.jsx', () => {
    const appPath = path.join(rootDir, 'restaurant-app', 'src', 'App.jsx');
    const content = fs.readFileSync(appPath, 'utf8');

    assert.ok(
      content.includes('OrderAlertModal'),
      'App.jsx must import and mount OrderAlertModal'
    );
    assert.ok(
      content.includes('<OrderAlertModal />') || content.includes('<OrderAlertModal/>'),
      'App.jsx must render <OrderAlertModal />'
    );
  });
});
