#!/usr/bin/env bash
# ==============================================================================
# Fast Delivery (FD) - PostgreSQL Automated Database Backup (Linux / POSIX)
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

python3 "${PROJECT_ROOT}/backend/scripts/backup_db.py" "$@"
