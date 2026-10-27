"""
Fast Delivery (FD) - Automated PostgreSQL Database Backup Script
Performs consistent, unbuffered pg_dump with credentials passed securely
via subprocess environment variables. Implements retention pruning.
"""

import os
import sys
import shutil
import datetime
import subprocess
from pathlib import Path


def find_pg_tool(tool_name="pg_dump"):
    """Finds PostgreSQL binary in system PATH or standard OS installation paths."""
    found = shutil.which(tool_name)
    if found:
        return found

    # Windows standard paths
    if sys.platform == "win32":
        candidates = [
            Path(r"C:\Program Files\PostgreSQL\18\bin") / f"{tool_name}.exe",
            Path(r"C:\Program Files\PostgreSQL\17\bin") / f"{tool_name}.exe",
            Path(r"C:\Program Files\PostgreSQL\16\bin") / f"{tool_name}.exe",
            Path(r"C:\Program Files\PostgreSQL\15\bin") / f"{tool_name}.exe",
            Path(r"C:\Program Files\PostgreSQL\14\bin") / f"{tool_name}.exe",
        ]
        for c in candidates:
            if c.exists():
                return str(c)
    # Linux standard paths
    elif sys.platform.startswith("linux"):
        linux_candidates = [
            f"/usr/lib/postgresql/16/bin/{tool_name}",
            f"/usr/lib/postgresql/15/bin/{tool_name}",
            f"/usr/bin/{tool_name}",
            f"/usr/local/bin/{tool_name}",
        ]
        for lc in linux_candidates:
            if os.path.exists(lc):
                return lc

    return tool_name


def backup_database(target_dir=None, retention_days=14):
    """
    Executes PostgreSQL database backup safely.
    Never outputs or leaks passwords.
    """
    # 1. Resolve DB settings from environment or fallback
    db_name = os.environ.get("POSTGRES_DB", "wsfood_db")
    db_user = os.environ.get("POSTGRES_USER", "postgres")
    db_password = os.environ.get("POSTGRES_PASSWORD", "root")
    db_host = os.environ.get("POSTGRES_HOST", "localhost")
    db_port = str(os.environ.get("POSTGRES_PORT", "5432"))

    # 2. Setup backup directory
    if target_dir is None:
        target_dir = Path(__file__).resolve().parent.parent / "backups"
    else:
        target_dir = Path(target_dir)

    target_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = target_dir / f"{db_name}_backup_{timestamp}.sql"

    pg_dump_bin = find_pg_tool("pg_dump")
    print(f"[*] Starting PostgreSQL backup for database '{db_name}'...")
    print(f"[*] Using pg_dump executable: {pg_dump_bin}")
    print(f"[*] Destination: {backup_file}")

    # Build command WITHOUT password
    cmd = [
        pg_dump_bin,
        "-h", db_host,
        "-p", db_port,
        "-U", db_user,
        "-d", db_name,
        "--clean",
        "--if-exists",
        "--no-owner",
        "--no-privileges",
        "-f", str(backup_file),
    ]

    # Pass password via private subprocess environment variable
    env = os.environ.copy()
    env["PGPASSWORD"] = db_password

    try:
        proc = subprocess.run(
            cmd,
            env=env,
            capture_output=True,
            text=True,
            check=False
        )

        if proc.returncode != 0:
            print(f"[!] pg_dump failed with exit code {proc.returncode}")
            # Filter output to ensure no credentials leaked
            safe_err = proc.stderr.replace(db_password, "********")
            print(f"[!] Error message: {safe_err.strip()}")
            return None

        # Verify backup file integrity
        if not backup_file.exists():
            print("[!] Backup failed: Target file was not created.")
            return None

        size_bytes = backup_file.stat().st_size
        if size_bytes < 1024:
            print(f"[!] Backup warning: File size is unexpectedly small ({size_bytes} bytes).")
            return None

        print(f"[+] Backup successfully created: {backup_file.name} ({size_bytes / 1024:.2f} KB)")

        # Retention management: Prune backups older than retention_days
        pruned_count = 0
        cutoff = datetime.datetime.now() - datetime.timedelta(days=retention_days)
        for existing in target_dir.glob(f"{db_name}_backup_*.sql"):
            mtime = datetime.datetime.fromtimestamp(existing.stat().st_mtime)
            if mtime < cutoff:
                try:
                    existing.unlink()
                    pruned_count += 1
                except Exception as e:
                    print(f"[-] Could not prune old backup {existing.name}: {e}")

        if pruned_count > 0:
            print(f"[*] Pruned {pruned_count} old backup file(s) exceeding {retention_days} days retention.")

        return str(backup_file)

    except Exception as e:
        safe_exc = str(e).replace(db_password, "********")
        print(f"[!] Exception during database backup: {safe_exc}")
        return None


if __name__ == "__main__":
    retention = int(sys.argv[1]) if len(sys.argv) > 1 else 14
    result = backup_database(retention_days=retention)
    if result:
        print("[+] PostgreSQL Backup Completed Successfully.")
        sys.exit(0)
    else:
        print("[!] PostgreSQL Backup Encountered an Error.")
        sys.exit(1)
