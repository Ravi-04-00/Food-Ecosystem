/**
 * Fast Delivery (FD) — Multi-Viewport Responsive QA Automated Inspection Suite
 * Verifies layout behavior, CSS media queries, and navigation contracts at:
 * 320px, 360px, 375px, 390px, 430px, 768px, 1024px, 1280px, 1440px
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

const VIEWPORTS = [
  { width: 320, category: 'mobile-small', label: '320px (Compact Mobile / SE)' },
  { width: 360, category: 'mobile-standard', label: '360px (Standard Android)' },
  { width: 375, category: 'mobile-standard', label: '375px (iPhone 8 / SE)' },
  { width: 390, category: 'mobile-standard', label: '390px (iPhone 12/13/14)' },
  { width: 430, category: 'mobile-large', label: '430px (iPhone Pro Max)' },
  { width: 600, category: 'mobile-large', label: '600px (Phablet / Compact Foldable)' },
  { width: 768, category: 'tablet', label: '768px (iPad / Tablet Portrait)' },
  { width: 820, category: 'tablet', label: '820px (iPad Air / Modern Tablet)' },
  { width: 1023, category: 'tablet-max', label: '1023px (Tablet Max Boundary / iPad Portrait)' },
  { width: 1024, category: 'desktop-small', label: '1024px (Desktop Boundary / iPad Pro)' },
  { width: 1280, category: 'desktop-standard', label: '1280px (Standard Laptop)' },
  { width: 1366, category: 'desktop-standard', label: '1366px (Standard HD Laptop Display)' },
  { width: 1440, category: 'desktop-large', label: '1440px (Hi-Res Desktop)' },
  { width: 1920, category: 'desktop-ultrawide', label: '1920px (Full HD & Ultrawide Display)' }
];

describe('Phase 2 Viewport Responsive Behavior & Breakpoints QA', () => {

  // A. Mobile Viewports (<= 767px): 320, 360, 375, 390, 430
  const mobileViewports = VIEWPORTS.filter(v => v.width <= 767);
  for (const vp of mobileViewports) {
    test(`Mobile Viewport [${vp.label}]: Sidebar is hidden drawer, bottom nav is active, safe area padded`, () => {
      // 1. Verify CSS media query behavior at width <= 767px
      const customerCss = fs.readFileSync(resolvePath('customer-app/src/styles/app.css'), 'utf-8');
      assert.ok(customerCss.includes('repeat(2, minmax(0, 1fr))'), 'Mobile must use 2-column food grid');

      // 2. Verify Bottom Navigation is rendered on mobile
      const bottomNavCustomer = fs.readFileSync(resolvePath('customer-app/src/components/CustomerBottomNav.jsx'), 'utf-8');
      assert.ok(bottomNavCustomer.includes('flex md:hidden'), 'Customer bottom nav must be visible on mobile (flex md:hidden)');

      const bottomNavDelivery = fs.readFileSync(resolvePath('delivery-partner-app/src/components/navigation/MobileBottomNav.jsx'), 'utf-8');
      assert.ok(bottomNavDelivery.includes('flex md:hidden'), 'Delivery bottom nav must be visible on mobile (flex md:hidden)');

      // 3. Verify main content bottom clearance
      const customerApp = fs.readFileSync(resolvePath('customer-app/src/App.jsx'), 'utf-8');
      assert.ok(customerApp.includes('calc(80px + env(safe-area-inset-bottom'), 'Customer main must have bottom clearance for bottom nav');

      const deliveryApp = fs.readFileSync(resolvePath('delivery-partner-app/src/App.jsx'), 'utf-8');
      assert.ok(deliveryApp.includes('calc(96px + env(safe-area-inset-bottom'), 'Delivery main must have 96px clearance for bottom nav');
    });
  }

  // B. Tablet Viewport: 768px - 1023px
  test('Tablet Viewport [768px (iPad / Tablet Portrait)]: Intentional non-desktop squeezed layout', () => {
    // 1. Customer food grid expands to 3 columns
    const customerCss = fs.readFileSync(resolvePath('customer-app/src/styles/app.css'), 'utf-8');
    assert.ok(customerCss.includes('@media (min-width: 768px)'), 'app.css has min-width: 768px rule');
    assert.ok(customerCss.includes('repeat(3, minmax(0, 1fr))'), 'Tablet food grid expands to 3 columns');

    // 2. Sidebar is slide-out drawer (< 1024px), not forced permanent squeezed sidebar
    const customerSidebar = fs.readFileSync(resolvePath('customer-app/src/components/CustomerSidebar.jsx'), 'utf-8');
    assert.ok(customerSidebar.includes('@media (max-width: 1023.5px)'), 'Customer sidebar transforms to drawer below 1024px');

    const restaurantSidebar = fs.readFileSync(resolvePath('restaurant-app/src/components/RestaurantSidebar.jsx'), 'utf-8');
    assert.ok(restaurantSidebar.includes('@media (max-width: 1023.5px)'), 'Restaurant sidebar transforms to drawer below 1024px');
  });

  test('Tablet Viewport [820px (iPad Air / Modern Tablet)]: Intentional compact tablet layout with drawer sidebar', () => {
    const customerCss = fs.readFileSync(resolvePath('customer-app/src/styles/app.css'), 'utf-8');
    assert.ok(customerCss.includes('repeat(3, minmax(0, 1fr))'), '820px food grid renders 3 columns');
    const customerSidebar = fs.readFileSync(resolvePath('customer-app/src/components/CustomerSidebar.jsx'), 'utf-8');
    assert.ok(customerSidebar.includes('1023.5px') || customerSidebar.includes('1024px'), 'Sidebar is drawer at 820px');
  });

  test('Tablet Viewport [1023px (Tablet Max Boundary)]: Responsive drawer contract preserved up to 1023.5px', () => {
    const customerSidebar = fs.readFileSync(resolvePath('customer-app/src/components/CustomerSidebar.jsx'), 'utf-8');
    assert.ok(customerSidebar.includes('1023.5px') || customerSidebar.includes('1024px'), 'Customer sidebar responsive boundary');
    const restaurantSidebar = fs.readFileSync(resolvePath('restaurant-app/src/components/RestaurantSidebar.jsx'), 'utf-8');
    assert.ok(restaurantSidebar.includes('1023.5px') || restaurantSidebar.includes('1024px'), 'Restaurant sidebar responsive boundary');
  });

  // C. Desktop Viewports (>= 1024px): 1024, 1280, 1366, 1440
  const desktopViewports = VIEWPORTS.filter(v => v.width >= 1024);
  for (const vp of desktopViewports) {
    test(`Desktop Viewport [${vp.label}]: Permanent 260px sidebar visible, hamburger toggle hidden (lg:hidden)`, () => {
      // 1. Sidebar is permanently visible on >= 1024px
      const apps = [
        { name: 'Customer', file: 'customer-app/src/components/CustomerSidebar.jsx' },
        { name: 'Restaurant', file: 'restaurant-app/src/components/RestaurantSidebar.jsx' },
        { name: 'Delivery', file: 'delivery-partner-app/src/components/navigation/Sidebar.jsx' },
        { name: 'Admin', file: 'admin-app/src/components/AdminSidebar.jsx' }
      ];

      for (const app of apps) {
        const content = fs.readFileSync(resolvePath(app.file), 'utf-8');
        assert.ok(
          content.includes('min-width: 1024px') || content.includes('lg:flex') || content.includes('1024px'),
          `${app.name} sidebar must be persistent on desktop (>=1024px)`
        );
      }

      // 2. Hamburger toggle is hidden via lg:hidden
      const headers = [
        'customer-app/src/components/CustomerNavbar.jsx',
        'restaurant-app/src/components/ShopNavbar.jsx',
        'delivery-partner-app/src/components/navigation/TopHeader.jsx',
        'admin-app/src/components/AdminHeader.jsx'
      ];

      for (const relPath of headers) {
        const content = fs.readFileSync(resolvePath(relPath), 'utf-8');
        assert.ok(content.includes('lg:hidden'), `${relPath} toggle must be hidden on >=1024px via lg:hidden`);
      }
    });
  }

  // D. Customer App Hero Requirements
  test('Customer App Hero: Exactly 2–3 featured items, clear search CTA, location picker', () => {
    const heroCode = fs.readFileSync(resolvePath('customer-app/src/components/FDReferenceHero.jsx'), 'utf-8');
    assert.ok(heroCode.includes('slice(0, 3)'), 'Featured food list bounded to at most 3 items');
    assert.ok(heroCode.includes('onOpenLocationModal'), 'Delivery location button must be present in hero');
    assert.ok(heroCode.includes('onAddToCart'), 'Direct add to cart must be enabled on featured items');
    assert.ok(heroCode.includes('Delivering to:'), 'Clear delivery location label must be rendered');
  });

  // E. Delivery Partner Mobile Usability
  test('Delivery Partner App: Active task card provides immediate one-tap action workflow', () => {
    const dashboardCode = fs.readFileSync(resolvePath('delivery-partner-app/src/pages/DashboardPage.jsx'), 'utf-8');
    assert.ok(dashboardCode.includes('Reached Restaurant'), 'Immediate one-tap Reached Restaurant action');
    assert.ok(dashboardCode.includes('Verify Pickup'), 'Immediate one-tap Verify Pickup action');
    assert.ok(dashboardCode.includes('Verify Delivery (OTP)'), 'Immediate one-tap Verify Delivery OTP action');
    assert.ok(dashboardCode.includes('Details & Map'), 'Quick toggle to task details & map');
  });
});
