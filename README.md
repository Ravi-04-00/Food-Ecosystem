# FD Foods — Food Delivery Ecosystem

> **Fresh Choices. Royal Experiences.**  
> Multi-tier, production-oriented food delivery ecosystem powering customers, kitchen partners, delivery fleet, and platform administration.

---

## 1. System Architecture

The project consists of **four independent React 19 micro-frontends** and a **unified Django 5/6 ASGI REST & WebSocket backend** backed by PostgreSQL.

| Application | Path | Dev Port | Key Responsibilities |
| :--- | :--- | :--- | :--- |
| **FD Foods Customer** | `webpurches/customer-app` | `3000` | Menu discovery, cart, saved addresses with map pin picker, 1-tap checkout, live order tracking with OTP |
| **FD Foods Restaurant** | `webpurches/restaurant-app` | `3001` | Live KDS queue (4-stage status machine), dispatch alerts, menu/category creation, operating hours |
| **FD Foods Delivery** | `webpurches/delivery-partner-app` | `3002` | Live dispatch offers, turn-by-turn routing, GPS telemetry ingestion, pickup & customer OTP verification, shifts |
| **FD Foods Admin** | `webpurches/admin-app` | `3003` | Platform command center, fleet telemetry, manual rider reassignment, partner KYC reviews, call queue |
| **Backend REST & WS** | `webpurches/backend` | `8000` | Django REST Framework, SimpleJWT, Channels/Redis, PostgreSQL persistence, Swagger at `/api/docs/` |

---

## 2. Quick Start (1-Click Launcher)

To launch the backend and all 4 frontends concurrently:

```powershell
.\start_all.ps1
```

Or on command line:

```powershell
cd webpurches

# 1. Install dependencies
npm install

# 2. Run all frontends concurrently
npm run dev:all

# 3. In another terminal, start Django backend:
python backend/manage.py runserver 127.0.0.1:8000
```

### Demo Accounts
- **Password**: `wsfood123` | **OTP**: `8492`
- **Customer**: `customer@wsfood.io`
- **Restaurant**: `shop@wsfood.io`
- **Delivery Partner**: `rider@wsfood.io`
- **Admin**: `admin@wsfood.io`

---

## 3. Database Configuration (PostgreSQL)

The ecosystem is configured for PostgreSQL (`fdfood_db` dev, `test_fdfood_db_fresh` test suite).

- Configure database variables in your environment or local `.env` (refer to `.env.example`).
- Never commit active `.env` files with production secrets.

```bash
# Verify migrations
python backend/manage.py showmigrations

# Apply migrations
python backend/manage.py migrate
```

---

## 4. Quality Assurance & Test Suites

```powershell
cd webpurches

# Run frontend quality & responsive viewport test suite (75 tests)
npm run test:frontend

# Run Django backend regression test suite (76 tests)
python backend/manage.py test apps.core_tests --keepdb

# Run production build compilation across all 4 apps
npm run build:all
```

---

## 5. Directory Layout

```
Fd_foods/
├── start_all.ps1                # Unified ecosystem launcher
├── RESPONSIVE_ARCHITECTURE_TA.md # Architecture notes in Tamil
└── webpurches/
    ├── customer-app/            # Customer Portal (Port 3000)
    ├── restaurant-app/          # Restaurant Kitchen Hub (Port 3001)
    ├── delivery-partner-app/    # Fleet & Dispatch App (Port 3002)
    ├── admin-app/               # Admin Command Center (Port 3003)
    ├── backend/                 # Django ASGI Application (Port 8000)
    │   ├── apps/                # 20 modular domain applications
    │   ├── config/              # ASGI, WSGI, URLs, Settings
    │   └── core_tests/          # Verified test regression suites
    └── tests/                   # Automated Node.js quality test suites
```
