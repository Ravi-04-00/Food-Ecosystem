@echo off
setlocal
echo ==============================================================================
echo Fast Delivery (FD) - PostgreSQL Automated Database Backup
echo ==============================================================================

set "PYTHON_EXE=C:\Users\ELCOT\AppData\Local\Python\pythoncore-3.14-64\python.exe"
if not exist "%PYTHON_EXE%" set "PYTHON_EXE=python"

"%PYTHON_EXE%" backend/scripts/backup_db.py %*
if %ERRORLEVEL% EQU 0 (
    echo [+] Database backup completed successfully.
) else (
    echo [!] Database backup failed with error code %ERRORLEVEL%.
)
endlocal
