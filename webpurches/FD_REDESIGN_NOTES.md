# FD Foods — Royal UI Refresh

This is the existing food delivery ecosystem project with a UI-only visual refresh. The four app entry points remain separate:

- Customer: `customer-app` (port 3000)
- Restaurant partner: `restaurant-app` (port 3001)
- Delivery partner: `delivery-partner-app` (port 3002)
- Admin: `admin-app` (port 3003)

## Run locally

Install dependencies from the project root, then run:

```bash
npm install
npm run dev:all
```

Build all four apps with:

```bash
npm run build
```

## UI changes

- Added a shared royal light-green, mint, and white motion system across all four app stylesheets and the legacy root UI.
- Refreshed FD Foods logo presentation with subtle 3D depth and hover treatment.
- Replaced legacy visual content from old WS logo components with FD Foods branding while preserving their import/export names for compatibility.
- Updated shared FD Foods intro/splash presentation with soft orbital decoration, emblem entrance motion, and reduced-motion support.
- Changed the existing Three.js FD intro palette from red/yellow to royal green/mint.
- Added responsive safeguards for small screens, form controls, focus states, and touch interactions.

## Validation

The frontend quality suite passed (27 tests). A production build could not be verified in this packaging environment because the supplied `node_modules` archive is missing the platform-specific Rolldown native binding; reinstall dependencies on your machine before building. No backend/API/database code was intentionally changed.
