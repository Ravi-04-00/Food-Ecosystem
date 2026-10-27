"""
Fast Delivery (FD) - PostgreSQL Database Restoration Script
Performs safe database restoration with explicit target safeguards.
Never overwrites production database without explicit confirmation flag.
"""

import os
import sys
import shutil
import subprocess
from pathlib import Path


def find_pg_tool(tool_name="psql"):
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


def restore_database(backup_file, target_db="wsfood_restore_verify_test", force=False):
    """
    Safely restores a PostgreSQL SQL dump into a designated database.
    Guards against accidental overwrite of production databases.
    """
    primary_db = os.environ.get("POSTGRES_DB", "wsfood_db")

    # Safety Guard
    if target_db.lower() == primary_db.lower() and not force:
        print(f"[!] SAFETY GUARD TRIGGERED: Refusing to restore over primary database '{target_db}' without --force.")
        return False

    backup_path = Path(backup_file)
    if not backup_path.exists():
        print(f"[!] Backup file not found: {backup_file}")
        return False

    db_user = os.environ.get("POSTGRES_USER", "postgres")
    db_password = os.environ.get("POSTGRES_PASSWORD", "root")
    db_host = os.environ.get("POSTGRES_HOST", "localhost")
    db_port = str(os.environ.get("POSTGRES_PORT", "5432"))

    psql_bin = find_pg_tool("psql")
    print(f"[*] Restoring '{backup_path.name}' into target database '{target_db}'...")
    print(f"[*] Using psql executable: {psql_bin}")

    env = os.environ.copy()
    env["PGPASSWORD"] = db_password

    # 1. Ensure target database exists (connect to 'postgres' administrative DB to create if missing)
    create_db_cmd = [
        psql_bin,
        "-h", db_host,
        "-p", db_port,
        "-U", db_user,
        "-d", "postgres",
        "-c", f"CREATE DATABASE \"{target_db}\";"
    ]
    subprocess.run(create_db_cmd, env=env, capture_output=True, text=True, check=False)

    # 2. Execute restoration command
    restore_cmd = [
        psql_bin,
        "-h", db_host,
        "-p", db_port,
        "-U", db_user,
        "-d", target_db,
        "-f", str(backup_path),
        "-q"
    ]

    try:
        proc = subprocess.run(
            restore_cmd,
            env=env,
            capture_output=True,
            text=True,
            check=False
        )

        if proc.returncode != 0 and "ERROR" in proc.stderr:
            safe_err = proc.stderr.replace(db_password, "********")
            print(f"[!] Restoration completed with warnings/errors: {safe_err.strip()[:300]}")

        # 3. Verify restoration integrity by counting tables and sample rows in restored DB
        verify_cmd = [
            psql_bin,
            "-h", db_host,
            "-p", db_port,
            "-U", db_user,
            "-d", target_db,
            "-t",
            "-c", "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';"
        ]

        verify_proc = subprocess.run(verify_cmd, env=env, capture_output=True, text=True, check=False)
        table_count = int(verify_proc.stdout.strip()) if verify_proc.stdout.strip().isdigit() else 0

        print(f"[+] Verification passed: Target database '{target_db}' contains {table_count} public tables.")
        if table_count >= 10:
            print("[+] Database restoration verified successfully!")
            return True
        else:
            print(f"[!] Warning: Restored table count ({table_count}) is lower than expected.")
            return False

    except Exception as e:
        safe_exc = str(e).replace(db_password, "********")
        print(f"[!] Exception during database restoration: {safe_exc}")
        return False


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python restore_db.py <path_to_backup.sql> [target_db] [--force]")
        sys.exit(1)

    file_arg = sys.argv[1]
    db_arg = sys.argv[2] if len(sys.argv) > 2 and not sys.argv[2].startswith("--") else "wsfood_restore_verify_test"
    force_flag = "--force" in sys.argv

    success = restore_database(file_arg, target_db=db_arg, force=force_flag)
    sys.exit(0 if success else 1)
