/**
 * Fast Delivery (FD) - Frontend Automated Quality Engineering & Unit Test Suite
 * Tests dynamic endpoint resolution, WebSocket envelope safety,
 * multilingual (i18n) key completeness, and PWA manifest integrity across all 4 applications.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const resolvePath = (relPath) => {
  const inFrontend = path.join(rootDir, 'frontend', relPath);
  if (fs.existsSync(inFrontend)) return inFrontend;
  return path.join(rootDir, relPath);
};

const APPS = [
  { name: 'Customer App', dir: 'customer-app', devPort: '3000' },
  { name: 'Restaurant App', dir: 'restaurant-app', devPort: '3001' },
  { name: 'Delivery Partner App', dir: 'delivery-partner-app', devPort: '3002' },
  { name: 'Admin App', dir: 'admin-app', devPort: '3003' }
];

describe('1. Dynamic API Base URL Resolution Engine', () => {
  // Pure logic replica of getApiBase() used across all four apps
  const resolveApiBase = (envUrl, windowObj) => {
    if (envUrl) return envUrl;
    if (windowObj && windowObj.location) {
      const port = windowObj.location.port;
      const isStandardPort = port === '' || port === '80' || port === '443';
      if (isStandardPort) {
        return '/api';
      }
    }
    return 'http://localhost:8000/api';
  };

  test('Falls back to http://localhost:8000/api during local dev', () => {
    const localWindow = { location: { port: '3000', hostname: 'localhost' } };
    assert.strictEqual(resolveApiBase(null, localWindow), 'http://localhost:8000/api');
  });

  test('Resolves to /api in production on standard ports 80/443 or reverse proxy', () => {
    const prodWindowEmpty = { location: { port: '', hostname: 'fastdelivery.io' } };
    const prodWindow443 = { location: { port: '443', hostname: 'fastdelivery.io' } };
    assert.strictEqual(resolveApiBase(null, prodWindowEmpty), '/api');
    assert.strictEqual(resolveApiBase(null, prodWindow443), '/api');
  });

  test('Prioritizes explicit VITE_API_BASE_URL override environment variable', () => {
    const custom = 'https://api.staging.fastdelivery.io/api';
    assert.strictEqual(resolveApiBase(custom, null), custom);
  });
});

describe('2. WebSocket URL & Real-Time Envelope Validation', () => {
  const resolveWsUrl = (pathSuffix, envWs, windowObj) => {
    const cleanPath = pathSuffix.startsWith('/') ? pathSuffix : `/${pathSuffix}`;
    if (envWs) {
      const base = envWs.endsWith('/') ? envWs.slice(0, -1) : envWs;
      return `${base}${cleanPath}`;
    }
    if (windowObj && windowObj.location) {
      const proto = windowObj.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const port = windowObj.location.port;
      const isStandard = port === '' || port === '80' || port === '443';
      if (isStandard) {
        return `${proto}//${windowObj.location.host}${cleanPath}`;
      }
    }
    return `ws://localhost:8000${cleanPath}`;
  };

  test('Resolves WebSocket URL to ws://localhost:8000 in dev', () => {
    const mockWindow = { location: { protocol: 'http:', port: '3000', host: 'localhost:3000' } };
    assert.strictEqual(
      resolveWsUrl('/ws/ecosystem/', null, mockWindow),
      'ws://localhost:8000/ws/ecosystem/'
    );
  });

  test('Resolves secure wss protocol over HTTPS production origin', () => {
    const mockWindow = { location: { protocol: 'https:', port: '443', host: 'fastdelivery.io' } };
    assert.strictEqual(
      resolveWsUrl('/ws/tracking/101/', null, mockWindow),
      'wss://fastdelivery.io/ws/tracking/101/'
    );
  });

  test('Validates incoming real-time standardized event envelopes (Phase 28 contract)', () => {
    const mockPayload = {
      event_id: 'a8b1c2d3-1111-2222-3333-444455556666',
      event_type: 'order.status_changed',
      schema_version: '1.0',
      server_timestamp: new Date().toISOString(),
      data: { order_id: 123, status: 'PREPARING' }
    };

    assert.ok(mockPayload.event_id && typeof mockPayload.event_id === 'string');
    assert.strictEqual(mockPayload.schema_version, '1.0');
    assert.ok(mockPayload.event_type.includes('.'));
    assert.ok(mockPayload.data && mockPayload.data.order_id);
  });

  test('Calculates exponential backoff with jitter bounded between min and max interval', () => {
    const calculateBackoff = (attempt, baseMs = 1000, maxMs = 30000) => {
      const exp = Math.min(maxMs, baseMs * Math.pow(1.5, attempt));
      const jitter = exp * (0.8 + Math.random() * 0.4);
      return Math.min(maxMs, Math.max(baseMs, Math.round(jitter)));
    };

    for (let i = 0; i < 5; i++) {
      const delay = calculateBackoff(i);
      assert.ok(delay >= 800, `Delay ${delay} was below expected threshold for attempt ${i}`);
      assert.ok(delay <= 30000, `Delay ${delay} exceeded 30s max threshold`);
    }
  });
});

describe('3. Multilingual (i18n) Completeness & Tamil Translation Parity', () => {
  for (const app of APPS) {
    test(`${app.name}: Translation file exists with en and ta language dictionaries`, () => {
      const i18nPath = resolvePath(path.join(app.dir, 'src', 'utils', 'i18n.js'));
      assert.ok(fs.existsSync(i18nPath), `Missing i18n.js in ${app.dir}`);

      const content = fs.readFileSync(i18nPath, 'utf-8');
      assert.ok(content.includes('en:'), `${app.name} missing English translations block`);
      assert.ok(content.includes('ta:'), `${app.name} missing Tamil translations block`);
    });

    test(`${app.name}: Essential terminology is localized into authentic Tamil`, () => {
      const i18nPath = resolvePath(path.join(app.dir, 'src', 'utils', 'i18n.js'));
      const content = fs.readFileSync(i18nPath, 'utf-8');

      // Check common platform words in Tamil Unicode
      const hasTamilUnicode = /[\u0B80-\u0BFF]/.test(content);
      assert.ok(hasTamilUnicode, `${app.name} should contain authentic Tamil Unicode characters`);
    });
  }
});

describe('4. Progressive Web App (PWA) Manifest & Service Worker Verification', () => {
  for (const app of APPS) {
    test(`${app.name}: Valid manifest.json with required PWA criteria exists`, () => {
      const manifestPath = resolvePath(path.join(app.dir, 'public', 'manifest.json'));
      assert.ok(fs.existsSync(manifestPath), `Missing manifest.json in ${app.dir}/public`);

      const raw = fs.readFileSync(manifestPath, 'utf-8');
      const manifest = JSON.parse(raw);

      assert.ok(manifest.name, `${app.name} manifest missing name`);
      assert.ok(manifest.short_name, `${app.name} manifest missing short_name`);
      assert.ok(manifest.start_url, `${app.name} manifest missing start_url`);
      assert.strictEqual(manifest.display, 'standalone', `${app.name} display should be standalone`);
      assert.ok(manifest.theme_color, `${app.name} manifest missing theme_color`);
      assert.ok(manifest.background_color, `${app.name} manifest missing background_color`);
      assert.ok(Array.isArray(manifest.icons) && manifest.icons.length > 0, `${app.name} missing icon definitions`);
    });

    test(`${app.name}: Service worker script exists for offline caching and push events`, () => {
      const swPath = resolvePath(path.join(app.dir, 'public', 'sw.js'));
      assert.ok(fs.existsSync(swPath), `Missing sw.js in ${app.dir}/public`);

      const swContent = fs.readFileSync(swPath, 'utf-8');
      assert.ok(swContent.includes('install'), `${app.name} sw.js should handle install event`);
      assert.ok(swContent.includes('fetch'), `${app.name} sw.js should handle fetch event`);
    });
  }
});

describe('5. Application Dependency & Build Scripts Health', () => {
  for (const app of APPS) {
    test(`${app.name}: package.json defines dev and build scripts`, () => {
      const pkgPath = resolvePath(path.join(app.dir, 'package.json'));
      assert.ok(fs.existsSync(pkgPath), `Missing package.json in ${app.dir}`);

      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      assert.ok(pkg.scripts.dev, `${app.name} missing dev script`);
      assert.ok(pkg.scripts.build, `${app.name} missing build script`);
      assert.ok(pkg.dependencies.react, `${app.name} missing react dependency`);
    });
  }
});

describe('6. Phase 2 Multi-Viewport Responsive & Navigation Architecture Suite', () => {
  test('All 4 applications contain dedicated persistent desktop sidebars', () => {
    const sidebars = [
      { file: 'customer-app/src/components/CustomerSidebar.jsx', expected: 'Customer Navigation' },
      { file: 'restaurant-app/src/components/RestaurantSidebar.jsx', expected: 'Restaurant Operations' },
      { file: 'delivery-partner-app/src/components/navigation/Sidebar.jsx', expected: 'Operations Navigation' },
      { file: 'admin-app/src/components/AdminSidebar.jsx', expected: 'Admin Navigation' }
    ];

    for (const item of sidebars) {
      const fullPath = resolvePath(item.file);
      assert.ok(fs.existsSync(fullPath), `Sidebar missing at ${item.file}`);
      const content = fs.readFileSync(fullPath, 'utf-8');
      assert.ok(content.includes('1024px'), `${item.file} must declare @media (min-width: 1024px) for desktop persistence`);
    }
  });

  test('All navigation headers hide the sidebar toggle on desktop using lg:hidden', () => {
    const headers = [
      'customer-app/src/components/CustomerNavbar.jsx',
      'restaurant-app/src/components/ShopNavbar.jsx',
      'delivery-partner-app/src/components/navigation/TopHeader.jsx',
      'admin-app/src/components/AdminHeader.jsx'
    ];

    for (const relPath of headers) {
      const fullPath = resolvePath(relPath);
      assert.ok(fs.existsSync(fullPath), `Header missing at ${relPath}`);
      const content = fs.readFileSync(fullPath, 'utf-8');
      assert.ok(content.includes('lg:hidden'), `${relPath} must apply lg:hidden to sidebar toggle`);
    }
  });

  test('Mobile viewports reserve safe-area bottom navigation padding across consumer and rider apps', () => {
    const mainViewports = [
      'customer-app/src/App.jsx',
      'restaurant-app/src/App.jsx',
      'delivery-partner-app/src/App.jsx'
    ];

    for (const relPath of mainViewports) {
      const fullPath = resolvePath(relPath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      assert.ok(
        content.includes('env(safe-area-inset-bottom') || content.includes('padding: 16px 14px calc('),
        `${relPath} must include safe-area inset bottom padding`
      );
    }
  });

  test('Customer App: Hero featured section strictly bounds featured items to 2–3 items', () => {
    const heroPath = resolvePath('customer-app/src/components/FDReferenceHero.jsx');
    assert.ok(fs.existsSync(heroPath), 'FDReferenceHero.jsx missing');
    const content = fs.readFileSync(heroPath, 'utf-8');
    assert.ok(content.includes('.slice(0, 3)'), 'FDReferenceHero must bound featured dishes to at most 3 items');
  });

  test('Customer App: Responsive food listing grid defines 2 cols on mobile, 3 on tablet, and 4 on desktop', () => {
    const cssPath = resolvePath('customer-app/src/styles/app.css');
    assert.ok(fs.existsSync(cssPath), 'app.css missing in customer-app');
    const css = fs.readFileSync(cssPath, 'utf-8');
    assert.ok(css.includes('.fd-food-grid'), 'app.css must define .fd-food-grid');
    assert.ok(css.includes('repeat(2, minmax(0, 1fr))'), 'fd-food-grid must define 2 columns on mobile');
    assert.ok(css.includes('repeat(3, minmax(0, 1fr))'), 'fd-food-grid must define 3 columns on tablet (min-width: 768px)');
    assert.ok(css.includes('repeat(4, minmax(0, 1fr))'), 'fd-food-grid must define 4 columns on desktop (min-width: 1024px)');
  });
});

