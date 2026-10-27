# Security Policy — FD Foods

At FD Foods, security, data integrity, and customer privacy are foundational to our engineering standards. This document outlines our vulnerability disclosure policy and security commitments.

---

## 1. Supported Versions

We actively provide security patches and dependency updates for the following components:

| Component | Version / Environment | Supported |
| :--- | :--- | :--- |
| **Backend REST & Channels API** | Django 5.x / Python 3.12+ | :white_check_mark: Active |
| **Customer Web Portal** | React 19 + Vite | :white_check_mark: Active |
| **Restaurant Partner Portal** | React 19 + Vite | :white_check_mark: Active |
| **Delivery Partner Portal** | React 19 + Vite | :white_check_mark: Active |
| **Admin Command Center** | React 19 + Vite | :white_check_mark: Active |
| **Database Schemas** | PostgreSQL 16+ | :white_check_mark: Active |

---

## 2. Reporting a Vulnerability

If you discover a security vulnerability or credential leak within the FD Foods repository or live environments, please report it privately:

- **Email**: Send detailed vulnerability reports to `security@fastdelivery.com`.
- **Response Time**: Our security team will acknowledge receipt within 24 hours and provide an initial assessment within 48 hours.
- **Responsible Disclosure**: Please allow us reasonable time to remediate the vulnerability before publicly disclosing details.

### What to Include in Your Report:
- Detailed description of the vulnerability and its potential impact.
- Step-by-step reproduction instructions or a minimal proof of concept (PoC).
- Affected endpoints, parameters, components, or client applications.
- Any suggested mitigations or remediation strategies.

---

## 3. Secrets & Credential Protection Policy

- **Zero Secret Commits**: Real API keys, private keys, database passwords, Razorpay credentials, and tokens must NEVER be committed to Git.
- **Environment Isolation**: All configuration is managed via `.env` files (excluded via `.gitignore`) and loaded into Django settings or Vite build tools using explicit environment variables.
- **Frontend Variable Exposure**: Only variables explicitly prefixed with `VITE_` are bundled into browser artifacts. Private server secrets (Django `SECRET_KEY`, database credentials, Razorpay Key Secrets, webhook tokens) must never be prefixed with `VITE_`.
- **Database Safety**: Raw database dumps (`.sql`, `.dump`) and user KYC records are strictly excluded from version control.
