@echo off
title FD FOODS - UNIFIED ECOSYSTEM LAUNCHER
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start_fast_delivery.ps1"
if errorlevel 1 pause
