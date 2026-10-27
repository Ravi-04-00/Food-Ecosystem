# FD FOODS — PHASE 3 ARCHITECTURE, CODE QUALITY & PERFORMANCE REPORT

**Execution Date:** October 2026  
**Status:** COMPLETE & VERIFIED  
**Test Status:** 
- Frontend Unit & Quality Suites: **57/57 Passed** (11/11 Suites)
- Backend Django + PostgreSQL Regression Suite: **76/76 Passed** (100% Passed)
- Production Build Suites: **4/4 Compilations Successful**

---

## 1. System Architecture Overview

The FD Foods platform is a multi-tier, full-stack food delivery ecosystem structured around a unified Django backend, PostgreSQL persistence engine, and four React 19 / Vite client frontends.

```
                      +---------------------------------------+
                      |       FD FOODS ECOSYSTEM ENGINE       |
                      |   Django 6.1.1 + DRF + PostgreSQL     |
                      +---------------------------------------+
                                          |
        +------------------+--------------+---------------+------------------+
        |                  |                              |                  |
+---------------+  +-----------------+          +--------------------+  +----------------+
|  Customer App |  | Restaurant App  |          | Delivery Partner   |  |   Admin App    |
|   Port 3000   |  |    Port 3001    |          |    Port 3002       |  |   Port 3003    |
|  (Exploration |  |  (Live Orders,  |          |  (Live Dispatch,   |  |  (Ecosystem    |
|  & Checkout)  |  |  KDS & Menu)    |          |   Batch Delivery)  |  |   Governance)  |
+---------------+  +-----------------+          +--------------------+  +----------------+
```

### Layered Separation of Responsibilities

Each frontend application adheres to a strict layered structure:
1. **Pages / Screens (`src/pages/`)**: Top-level route views that coordinate business workflows and layout orchestration.
2. **Reusable UI Components (`src/components/`)**: Atomic, theme-driven components following the FD Foods design tokens (Cosmic Latte, Soft Milk-Green, Royal White, Emerald Green).
3. **API / Transport Layer (`src/services/api.js`, `src/services/apiErrors.js`)**: Encapsulates dynamic base URL resolution, token renewal mutex, safe idempotent retry logic, and DRF error extraction.
4. **State & Context (`src/context/`)**: Domain context providers (`CustomerContext`, `ShopContext`, `DeliveryContext`, `AdminContext`) managing synchronized local and WebSocket state.
5. **Shared Utilities (`src/utils/`, `src/hooks/`)**: Internationalization (`i18n.js` supporting authentic Tamil and English), WebSocket clients (`realtime.js`), and PWA lifecycle handlers (`usePWA.js`).

---

## 2. Dead Code Eradication & Pruned Files

Every file was rigorously audited using cross-project static reference scanning, dynamic `import()` detection, route map analysis, service worker manifest inspection, and automated test runners. 

Only files with **proven 0 references** outside themselves across all 4 apps, public assets, and test runners were removed.

| # | Removed File | Category | Rationale & Evidence of Zero Usage |
|---|---|---|---|
| 1 | `customer-app/src/components/FDIntroAnimation.jsx` | Obsolete Prototype | Unused 3D intro animation prototype that forced Three.js imports. Fully superseded by `FDCommonBrandIntro.jsx`. Zero imports in app or routes. |
| 2 | `customer-app/src/components/FoodCard3D.jsx` | Obsolete Prototype | Legacy experimental 3D food card. Superseded by `FoodCardRetro.jsx` and `FDRestaurantCard.jsx`. Zero references across repository. |
| 3 | `customer-app/src/components/Hero3DUniverse.jsx` | Obsolete Prototype | Early hero component prototype. Superseded by `FDReferenceHero.jsx` (which contains the verified 2–3 bounded dishes and location selector). Zero references. |
| 4 | `restaurant-app/src/pages/ShopChatPage.jsx` | Dead Mock Page | Standalone mock chat prototype with hardcoded `'customer1'` stub data. Never registered in `RestaurantSidebar.jsx` or `App.jsx`. Zero references. |
| 5 | `restaurant-app/src/pages/SocialPublisherPage.jsx` | Dead Mock Page | Unfinished mock social publisher screen with dummy uploads. Never routed or imported. Zero references. |
| 6 | `delivery-partner-app/src/components/DeliveryHUDNavbar.jsx` | Obsolete Header | Early navbar iteration superseded by `TopHeader.jsx` with mobile toggle and online status badge. Zero references. |
| 7 | `delivery-partner-app/src/components/IncomingRequestModal.jsx` | Obsolete Modal | Mock request modal superseded by `LiveOrderRequestModal.jsx` which connects directly to PostgreSQL dispatch assignments. Zero references. |
| 8 | `delivery-partner-app/src/components/modals/ReportIssueModal.jsx` | Obsolete Modal | Unused issue dialog superseded by `HelpBottomSheet.jsx` and `SupportPage.jsx`. Zero references. |
| 9 | `delivery-partner-app/src/components/OTPVerificationModal.jsx` | Redundant Prototype | Standalone mock modal. Delivery OTP verification is built directly into active order workflow cards in `OrdersPage.jsx` and `DashboardPage.jsx`. Zero references. |
| 10 | `delivery-partner-app/src/components/StartupCinematicIntro.jsx` | Obsolete Intro | Legacy splash flow superseded by `FDOpeningFlow.jsx`. Zero references. |
| 11 | `delivery-partner-app/src/pages/CourierChatPage.jsx` | Dead Mock Page | Hardcoded mock courier chat prototype. Zero references across repository. |
| 12 | `delivery-partner-app/src/pages/DeliveryDashboardPage.jsx` | Legacy Duplicate | Early mobile dashboard duplicate superseded by `DashboardPage.jsx` (which contains live shifts, stats, orders, and responsive layout). Zero references. |
| 13 | `delivery-partner-app/src/pages/DeliveryPartnerRegistrationPage.jsx` | Legacy Duplicate | Duplicate registration page. Partner onboarding is managed via modal `FDPartnerRegistrationModal.jsx` inside `FDOpeningFlow.jsx`. Zero references. |
| 14 | `delivery-partner-app/src/pages/EarningsDashboardPage.jsx` | Legacy Duplicate | Hardcoded mock earnings page (`today: 1280`) with `alert()` stubs. Superseded by production `EarningsPage.jsx` wired to backend DRF ledger endpoints. Zero references. |
| 15 | `delivery-partner-app/src/pages/TripHistoryPage.jsx` | Legacy Duplicate | Mock trip history page (`WS-8801`). Superseded by active PostgreSQL `OrdersPage.jsx`. Zero references. |

---

## 3. Retained Core Files & Justifications

In accordance with strict safety requirements, all core logic, configuration, migrations, and active components were retained:

| Retained File / Module | App / Path | Justification |
|---|---|---|
| `backend/apps/orders/migrations/0001_initial.py` | Django Backend | Core database schema defining Order, OrderItem, and status constraints. Essential for test database creation and DB integrity. |
| `backend/apps/shifts/models.py` | Django Backend | Restored in Phase 1; provides `Shift` and `CheckIn` models verified by `apps.core_tests.test_shifts_regression`. |
| `customer-app/src/components/Interactive3DFoodViewer.jsx` | Customer App | Active 3D food model viewer in `FoodDetailsModal.jsx`. Retained and optimized via lazy-loading (`React.lazy`) to prevent bundling Three.js into the main bundle. |
| `restaurant-app/src/components/OrderAlertModal.jsx` | Restaurant App | Retained, modernized with FD Foods design tokens, and wired into `App.jsx` to receive real-time incoming orders from `ShopContext.jsx`. |
| `delivery-partner-app/src/pages/DashboardPage.jsx` | Delivery App | Primary rider dashboard optimized in Phase 2 with one-tap action buttons and responsive layout. |
| `delivery-partner-app/src/components/FDOpeningFlow.jsx` | Delivery App | Onboarding and registration gateway managing new rider authentication and profile submission. |
| `*App/src/utils/i18n.js` | All 4 Apps | Multilingual dictionaries supporting English and authentic Tamil localization across all four ecosystem apps. |

---

## 4. Standardized API Contracts & Safe Transport Architecture

We introduced `src/services/apiErrors.js` across all 4 frontend applications, providing a consistent error envelope and transport layer:

### Error Envelope
```typescript
interface ApiErrorEnvelope {
  message: string;          // User-friendly, sanitized message
  status: number;           // HTTP status code (or 0 for network/offline)
  code: string;             // Error code (e.g., 'UNAUTHORIZED', 'NOT_FOUND', 'TIMEOUT')
  details: unknown | null;  // Raw technical error details for console/logs
  isNetworkError: boolean;  // True if fetch failed or connection severed
  isOffline: boolean;       // True if browser is offline
}
```

### Django DRF Error Parsing Rules
The `extractErrorMessage(data, status, fallbackMessage)` function inspects incoming JSON payloads:
1. **DRF Standard Detail**: `data.detail` is extracted directly.
2. **Custom Message**: `data.error` or `data.message` is extracted.
3. **Non-Field Errors**: `data.non_field_errors[0]` is extracted.
4. **Field-Level Validation Errors**: Converts `{ email: ["Enter a valid email address."] }` into clean user-facing strings: `"Email: Enter a valid email address."`.
5. **HTTP Status Fallbacks**: Returns friendly guidance on `401` (session expired), `403` (permission denied), `404` (resource not found), `429` (rate limited), and `500+` (server load).

### Safe Idempotent Retry Policy
`safeFetchWithRetry(url, options, config)` enforces strict safety invariants:
- **Idempotent Methods (`GET`, `HEAD`, `OPTIONS`)**: Automatically retried up to 2 times on transient network failures or `502/503/504` errors with backoff.
- **Mutations (`POST`, `PATCH`, `DELETE`, `PUT`)**: **Strictly NEVER auto-retried** without an explicit `isIdempotent: true` parameter or idempotency key header, eliminating the risk of double orders, duplicate payments, or repeated state transitions.
- **Timeout Protection**: Enforces a 15-second `AbortController` timeout on all network calls.

---

## 5. Performance Benchmarks

### Bundle Size Comparison Before & After Phase 3

| Application | Initial JS Before | Initial JS After | Delta JS | CSS Before | CSS After | Delta CSS |
|---|---|---|---|---|---|---|
| **Customer App** | 1,581.22 kB | **1,040.90 kB** | **-540.32 kB (-34.2%)** | 83.62 kB | **70.35 kB** | **-13.27 kB (-15.9%)** |
| **Restaurant App** | 693.38 kB | **697.47 kB** | +4.09 kB (wired live OrderAlert) | 56.79 kB | **48.80 kB** | **-7.99 kB (-14.1%)** |
| **Delivery Partner App** | 732.94 kB | **732.94 kB** | 0.00 kB (pruned dead unreferenced files) | 70.93 kB | **66.84 kB** | **-4.09 kB (-5.8%)** |
| **Admin App** | 807.11 kB | **807.11 kB** | 0.00 kB | 59.05 kB | **59.05 kB** | 0.00 kB |

### Code Splitting Achievement in Customer App
By converting `Interactive3DFoodViewer` from a synchronous static import to `React.lazy()` with `<React.Suspense>` fallback in `FoodDetailsModal.jsx`:
- **Main Chunk Reduction**: Cut by **540.32 kB** (from 1,581.22 kB down to 1,040.90 kB, gzip: 258.60 kB).
- **Isolated 3D Chunk**: Created asynchronous chunk `dist/assets/Interactive3DFoodViewer-*.js` (541.86 kB, gzip: 135.76 kB).
- **Result**: The customer landing experience and initial food exploration load 34% faster, with Three.js loaded strictly on-demand if the user toggles 3D dish viewing.

---

## 6. Remaining Technical Debt & Risk Assessment

| Item | Risk Level | Description & Current Mitigation | Recommended Next Action |
|---|---|---|---|
| **Icons Chunk Size** | Low | `lucide-react` is used extensively across screens, resulting in ~200 kB of icon SVGs per app. Treeshaking is functioning, but granular icon imports or SVG sprites could further shave 80-100 kB. | Consider consolidating icons into a centralized icon set or dynamic sprite bundle in future sprints. |
| **PWA Service Worker Offline Strategy** | Low | Service worker currently handles asset caching and push notifications. Dynamic API response caching for offline viewing is stubbed. | Implement IndexedDB-backed offline caching for customer menus and rider delivery instructions. |
| **Backend DB Connection Pooling** | Low | Current Django DB settings connect directly to PostgreSQL. Suitable for standard development and staging loads. | Enable `pgbouncer` or Django persistent database connections (`CONN_MAX_AGE = 60`) for high-traffic production workloads. |

---

## 7. Verification & Test Execution Summary

### Automated Test Runs
1. **Frontend Quality & Viewport QA (`npm run test:frontend`)**:
   - Total Tests: **57**
   - Total Suites: **11**
   - Result: **57 Passed, 0 Failed, 0 Skipped** (Duration: ~260ms)
2. **Django Backend Regression Suite (`py backend/manage.py test apps.core_tests --keepdb`)**:
   - Total Tests: **76**
   - Result: **76 Passed, 0 Failed, 0 Errors** (`Ran 76 tests in 162.436s. OK.`)
3. **Multi-App Production Builds (`npm run build:all`)**:
   - Result: **All 4 Vite builds compiled successfully with zero syntax, import, or bundle errors.**
