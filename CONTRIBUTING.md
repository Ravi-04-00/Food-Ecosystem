# Contributing to FD Foods

Thank you for your interest in contributing to the **FD Foods** ecosystem! This document provides guidelines for environment setup, code conventions, testing requirements, and pull request workflows.

---

## 1. Development Setup

### Prerequisites
- **Node.js**: `v18.0.0` or higher (`v20+` recommended)
- **Python**: `3.12` to `3.14`
- **PostgreSQL**: `16+` running locally on port `5432`
- **Git**: Recent version

### Repository Installation
```bash
# Clone the repository
git clone https://github.com/Ravi-04-00/Food-Ecosystem.git
cd Food-Ecosystem

# Install frontend dependencies across all micro-frontends
cd fd_
npm install
cd ..

# Install Python backend dependencies
cd fd_/backend
pip install -r requirements.txt
cd ../..
```

### Starting the Ecosystem
To launch all services simultaneously with port conflict protection:
```powershell
# Windows PowerShell
.\start_all.ps1
```
Or start each service individually:
- **Backend**: `python fd_/backend/manage.py runserver 0.0.0.0:8000`
- **Customer App**: `cd fd_/customer-app && npm run dev` (Port 3000)
- **Restaurant App**: `cd fd_/restaurant-app && npm run dev` (Port 3001)
- **Delivery Partner App**: `cd fd_/delivery-partner-app && npm run dev` (Port 3002)
- **Admin App**: `cd fd_/admin-app && npm run dev` (Port 3003)

---

## 2. Branching & Commit Guidelines

- **Branch Naming**:
  - `feat/<feature-name>` for new capabilities
  - `fix/<bug-description>` for bug resolutions
  - `chore/<task-name>` for maintenance or dependency updates
  - `docs/<doc-name>` for documentation updates
- **Commit Messages**: Follow Conventional Commits:
  - `feat(orders): add live order cancellation grace period`
  - `fix(customer): resolve delivery address coordinate fallback`
  - `chore(deps): bump vite from 8.3.3 to 8.3.4`

---

## 3. Code Standards & Quality Checks

Before submitting code, ensure all quality checks pass:

```bash
# 1. Run frontend automated quality, responsive, and security suites
cd fd_
npm run test:frontend

# 2. Verify all 4 micro-frontend production builds
npm run build:all

# 3. Run backend Django system checks and test suite
cd backend
python manage.py check
python manage.py test apps.core_tests --keepdb
```

---

## 4. Pull Request Process

1. Fork or branch from `main`.
2. Ensure no sensitive credentials, `.env` files, or test media uploads are committed.
3. Verify that all 75+ frontend tests and 76+ backend tests pass cleanly.
4. Fill out the Pull Request template completely, detailing changes, test evidence, and affected endpoints.
5. Request review from the repository maintainers.
