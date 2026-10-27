#!/usr/bin/env bash
# ==============================================================================
# Fast Delivery (FD) - PostgreSQL Database Restoration (Linux / POSIX)
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

if [ $# -lt 1 ]; then
    echo "Usage: ./scripts/restore_db.sh <path_to_backup.sql> [target_db] [--force]"
    exit 1
fi

python3 "${PROJECT_ROOT}/backend/scripts/restore_db.py" "$@"
