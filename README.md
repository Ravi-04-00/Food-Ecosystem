# FD Foods — Food Delivery Ecosystem

<div align="center">

**Fresh Choices. Royal Experiences.**<br>
*A modern, multi-tier food delivery ecosystem featuring four independent React 19 micro-frontends and a hardened Django Channels/PostgreSQL ASGI backend.*

[![CI/CD](https://github.com/Ravi-04-00/Food-Ecosystem/actions/workflows/ci.yml/badge.svg)](https://github.com/Ravi-04-00/Food-Ecosystem/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF.svg)](https://vitejs.dev/)
[![Django](https://img.shields.io/badge/Django-5.x-092E20.svg)](https://www.djangoproject.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-336791.svg)](https://www.postgresql.org/)

</div>

---

## 1. Problem Statement & Project Goals

Modern on-demand food delivery platforms require seamless coordination across distinct user personas: consumers, kitchen staff, couriers, and administrators. Monolithic single-page architectures often suffer from permission leakage, bloated bundles, and fragile state synchronization.

**FD Foods** solves this with an isolated **micro-frontend architecture** and an event-driven **ASGI backend**:
- **Role Isolation**: 4 dedicated client applications operate with isolated ports, strict authentication boundaries, and bespoke user experiences.
- **Real-Time Telemetry**: Real-time order dispatch, driver waypoints, and customer order tracking via Django Channels and WebSockets.
- **Tamper-Proof Handover**: Cryptographic 4-digit OTP required before completing order handover.
- **Resilient Fallback**: Zero blank canvases — dual-engine interactive maps automatically switch to vector SVG mode when offline or without API keys.

---

## 2. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Micro-Frontends** | React 19, Vite 8.3, Tailwind CSS v4, Lucide Icons, Three.js 3D Viewer (Lazy Loaded) |
| **Backend API** | Python 3.12–3.14, Django 5.x, Django REST Framework (DRF), SimpleJWT |
| **Real-Time & Concurrency** | Daphne (ASGI), Django Channels 4.x, Redis 7+ |
| **Database & ORM** | PostgreSQL 16+ with persistent connection pooling (`CONN_MAX_AGE=60`) |
| **Mapping & Geolocation** | Google Maps JavaScript API (with offline SVG vector fallback) |
| **Payment Gateway** | Razorpay Test Mode with HMAC-SHA256 signature verification |
| **DevOps & Tooling** | Docker, Docker Compose, Nginx, GitHub Actions, Node.js Test Runner |

---

## 3. Architecture & Ecosystem Flow

```mermaid
flowchart TD
    subgraph MicroFrontends["Micro-Frontend Portals"]
        Customer["Customer App\n:3000\n(Ordering, Wallet, Tracking)"]
        Restaurant["Restaurant App\n:3001\n(Kitchen KDS, Prep, Analytics)"]
        Delivery["Delivery Partner App\n:3002\n(GPS Waypoints, OTP Handover)"]
        Admin["Admin Mission Control\n:3003\n(Fleet Radar, KYC Approvals)"]
    end

    subgraph Gateway["API Gateway & Reverse Proxy"]
        Daphne["Daphne ASGI Server / Nginx\n:8000"]
    end

    subgraph Backend["Django REST & Channels Core"]
        Auth["SimpleJWT Auth & RBAC"]
        REST["DRF ViewSets (/api/)"]
        Consumers["WebSocket Channels (/ws/)"]
    end

    subgraph Data["Persistence & Cache"]
        Postgres[("PostgreSQL 16+\nfdfood_db")]
        Redis[("Redis 7+\nChannels Layer")]
    end

    Customer -->|HTTP / WS| Daphne
    Restaurant -->|HTTP / WS| Daphne
    Delivery -->|HTTP / WS| Daphne
    Admin -->|HTTP / WS| Daphne

    Daphne --> Auth
    Daphne --> REST
    Daphne --> Consumers
    REST --> Postgres
    Consumers --> Redis
    Consumers --> Postgres
```

---

## 4. Repository Structure

```
Food-Ecosystem/
├── .github/                                # GitHub Actions CI & Issue Templates
│   ├── workflows/ci.yml                    # Automated tests & multi-app build pipeline
│   ├── ISSUE_TEMPLATE/                     # Bug & Feature issue templates
│   └── PULL_REQUEST_TEMPLATE.md            # PR checklist and guidelines
├── docs/                                   # In-depth architectural & API specifications
│   ├── architecture.md                     # Deep technical architecture
│   └── PHASE_1_GITHUB_AUDIT_REPORT.md      # Comprehensive audit report
├── scripts/                                # Database backup and restore scripts
├── fd_/                                    # Active Application Workspace
│   ├── customer-app/                       # Port 3000: Consumer ordering & tracking portal
│   ├── restaurant-app/                     # Port 3001: Kitchen operations & SVG analytics
│   ├── delivery-partner-app/               # Port 3002: Courier dispatch & GPS telemetry
│   ├── admin-app/                          # Port 3003: Mission control & ecosystem radar
│   ├── backend/                            # Port 8000: Django 5.x REST API & Channels
│   │   ├── apps/                           # 21 modular domain apps (accounts, orders, etc.)
│   │   │   └── core_tests/                 # 76 automated Django tests
│   │   ├── config/                         # settings.py, asgi.py, wsgi.py, urls.py
│   │   ├── media/                          # Mock catalog logos and food images
│   │   ├── requirements.txt                # 12 pinned Python dependencies
│   │   └── simulate_e2e_order_journey.py   # Multi-actor order simulation utility
│   ├── src/                                # Unified Dev Launcher Preview Hub
│   ├── tests/                              # 75 automated frontend unit & QA tests
│   ├── package.json                        # Root workspace orchestration
│   └── package-lock.json                   # Verified package lockfile
├── .env.example                            # Clean, sanitized environment template
├── .gitignore                              # Comprehensive protection (secrets, SQL, media)
├── CONTRIBUTING.md                         # Contribution and development guidelines
├── LICENSE                                 # Proprietary & Confidential license notice
├── README.md                               # Project documentation (this file)
├── SECURITY.md                             # Vulnerability disclosure & secrets policy
└── start_all.ps1                           # Port-conflict-safe ecosystem launcher
```

---

## 5. Prerequisites & Quick Start

### System Requirements
- **Node.js**: `v18.0.0+` (v20+ LTS recommended)
- **Python**: `3.12` to `3.14`
- **PostgreSQL**: `16+` running on localhost:5432
- **Git**: Recent version

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Ravi-04-00/Food-Ecosystem.git
   cd Food-Ecosystem
   ```

2. **Configure Environment Variables:**
   ```bash
   # Copy the sanitized template
   cp .env.example .env
   ```
   *(Update `.env` with your local PostgreSQL password if different from `root`)*

3. **Install Dependencies:**
   ```bash
   # Install all frontend packages
   cd fd_
   npm install

   # Install backend Python requirements
   cd backend
   pip install -r requirements.txt
   cd ../..
   ```

4. **Launch All Services (1-Click Orchestrator):**
   ```powershell
   # Windows PowerShell
   .\start_all.ps1
   ```
   *The launcher starts the Django ASGI server and all 4 React applications concurrently.*

---

## 6. Applications & Demo Credentials

| Application | Local URL | Role / Purpose | Default Demo Account |
| :--- | :--- | :--- | :--- |
| **Customer App** | [http://localhost:3000](http://localhost:3000) | Food ordering, real-time tracking, customer wallet, loyalty tiers | `customer@wsfood.io` / `wsfood123` |
| **Restaurant Partner** | [http://localhost:3001](http://localhost:3001) | Kitchen KDS, live dispatch, menu items, SVG analytics | `shop@wsfood.io` / `wsfood123` |
| **Delivery Partner** | [http://localhost:3002](http://localhost:3002) | Turn-by-turn routing, GPS telemetry, OTP verification | `rider@wsfood.io` / `wsfood123` |
| **Admin Command Center**| [http://localhost:3003](http://localhost:3003) | Fleet live radar, partner KYC approvals, dispute mediation | `admin@wsfood.io` / `wsfood123` |
| **Backend REST & WS** | [http://127.0.0.1:8000/api/](http://127.0.0.1:8000/api/) | Central REST API & Channels WebSocket consumers | Superuser: `admin` |

---

## 7. Automated Testing & Verification

Every component is validated by automated test suites:

```bash
# 1. Frontend Test Suite (75 Tests: auth, cart isolation, error handling, PWA, 14 viewports)
cd fd_
npm run test:frontend

# 2. Production Vite Build (Verifies zero bundle or module syntax errors across all 4 apps)
npm run build:all

# 3. Backend Test Suite (76 Tests: models, RBAC, checkout, refunds, OTP, Channels)
cd backend
python manage.py check
python manage.py test apps.core_tests --keepdb

# 4. Multi-Actor Live Order Journey Simulation (Simulates 7-stage order lifecycle in ~17s)
python simulate_e2e_order_journey.py
```

---

## 8. Security & Secret Protection

- **Zero Tracked Secrets**: Real API secrets, private keys, and passwords are excluded by `.gitignore` and enforced via pre-commit audit standards.
- **Database Safety**: Raw database dumps (`*.sql`, `*.dump`) and user KYC records are permanently excluded from Git tracking.
- **Frontend Isolation**: Variables exposed to browser bundles must be explicitly prefixed with `VITE_`. Server credentials (Django `SECRET_KEY`, database credentials, Razorpay Key Secret) must never be accessible to the client.

For reporting security vulnerabilities, refer to [SECURITY.md](SECURITY.md).

---

## 9. License

This project is proprietary and confidential. See [LICENSE](LICENSE) for full legal terms.
Copyright &copy; 2026 FD Foods. All rights reserved.
