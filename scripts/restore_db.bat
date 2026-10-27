@echo off
setlocal
echo ==============================================================================
echo Fast Delivery (FD) - PostgreSQL Database Restoration Script
echo ==============================================================================

if "%~1"=="" (
    echo Usage: scripts\restore_db.bat [path_to_backup_file.sql] [target_db] [--force]
    exit /b 1
)

set "PYTHON_EXE=C:\Users\ELCOT\AppData\Local\Python\pythoncore-3.14-64\python.exe"
if not exist "%PYTHON_EXE%" set "PYTHON_EXE=python"

"%PYTHON_EXE%" backend/scripts/restore_db.py %*
endlocal
