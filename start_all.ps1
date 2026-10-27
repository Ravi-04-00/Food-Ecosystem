# =====================================================================
# FD FOODS — UNIFIED 1-CLICK POWERSHELL LAUNCHER
# Fresh Choices. Royal Experiences.
# =====================================================================

Write-Host "=====================================================================" -ForegroundColor Green
Write-Host "       FD FOODS - FRESH CHOICES. ROYAL EXPERIENCES." -ForegroundColor Green
Write-Host "       Unified Ecosystem Launcher (Port Conflict-Safe)" -ForegroundColor DarkGreen
Write-Host "=====================================================================" -ForegroundColor Green

if (Test-Path "$PSScriptRoot\backend") {
    $projectRoot = "$PSScriptRoot"
} elseif (Test-Path "$PSScriptRoot\fd_") {
    $projectRoot = "$PSScriptRoot\fd_"
} else {
    $projectRoot = "$PSScriptRoot\webpurches"
}

# 1. Resolve Python executable
$pythonExe = "C:\Users\ELCOT\AppData\Local\Python\pythoncore-3.14-64\python.exe"
if (-not (Test-Path $pythonExe)) {
    if (Get-Command py -ErrorAction SilentlyContinue) {
        $pythonExe = "py"
    } elseif (Get-Command python -ErrorAction SilentlyContinue) {
        $pythonExe = "python"
    } else {
        Write-Host "[ERROR] Python 3.12+ was not found in PATH." -ForegroundColor Red
        Exit 1
    }
}
Write-Host "`n[Python] Using executable: $pythonExe" -ForegroundColor DarkGray

# 2. Port 8000 conflict resolution (Safe detection without terminating unrelated processes)
$backendPort = 8000
$port8000Busy = $false
try {
    $conn8000 = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
    if ($conn8000) { $port8000Busy = $true }
} catch {}

$backendAlreadyRunning = $false

if ($port8000Busy) {
    try {
        $probe = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/health/" -Method Get -TimeoutSec 2 -ErrorAction Stop
        if ($probe.platform -like "*Fast Delivery*") {
            Write-Host "[Backend] FD Foods backend is already active on port 8000. Reusing active instance." -ForegroundColor Green
            $backendPort = 8000
            $backendAlreadyRunning = $true
        } else {
            Write-Host "[Port Conflict] Port 8000 is occupied by an unrelated service. Preserving process safely." -ForegroundColor Yellow
            $backendPort = 8001
        }
    } catch {
        Write-Host "[Port Conflict] Port 8000 is in use by an external service. Safely selecting Port 8001." -ForegroundColor Yellow
        $backendPort = 8001
    }
}

# If Port 8001 is targeted, check if FD Foods is already listening there
if ($backendPort -eq 8001) {
    try {
        $conn8001 = Get-NetTCPConnection -LocalPort 8001 -State Listen -ErrorAction SilentlyContinue
        if ($conn8001) {
            $probe8001 = Invoke-RestMethod -Uri "http://127.0.0.1:8001/api/health/" -Method Get -TimeoutSec 2 -ErrorAction Stop
            if ($probe8001.platform -like "*Fast Delivery*") {
                Write-Host "[Backend] FD Foods backend is already active on port 8001. Reusing active instance." -ForegroundColor Green
                $backendAlreadyRunning = $true
            }
        }
    } catch {}
}

# 3. Launch Backend if not already running
if (-not $backendAlreadyRunning) {
    Write-Host "[Backend] Starting Django ASGI Backend on port $backendPort..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location -Path '$projectRoot'; & '$pythonExe' backend/manage.py runserver 127.0.0.1:$backendPort" -WorkingDirectory $projectRoot
    Start-Sleep -Seconds 3
}

# 4. Launch 4 Frontends concurrently with matching API Base URL
Write-Host "[Frontends] Launching 4 Independent FD Foods React Applications..." -ForegroundColor Green
Write-Host "  * FD FOODS CUSTOMER         -> http://localhost:3000" -ForegroundColor Green
Write-Host "  * FD FOODS RESTAURANT       -> http://localhost:3001" -ForegroundColor DarkGreen
Write-Host "  * FD FOODS DELIVERY PARTNER -> http://localhost:3002" -ForegroundColor Green
Write-Host "  * FD FOODS MISSION ADMIN    -> http://localhost:3003" -ForegroundColor DarkGreen
Write-Host "  * BACKEND SWAGGER DOCS      -> http://127.0.0.1:$backendPort/api/docs/" -ForegroundColor Cyan

$frontendCmd = "`$env:VITE_API_BASE_URL='http://localhost:$backendPort/api'; `$env:VITE_WS_URL='ws://localhost:$backendPort/'; npm run dev:all"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location -Path '$projectRoot'; $frontendCmd" -WorkingDirectory $projectRoot

Write-Host "`nDemo Accounts: (Pass: wsfood123 | OTP: 8492)" -ForegroundColor DarkGray
Write-Host "  Customer: customer@wsfood.io | Restaurant: shop@wsfood.io | Delivery: rider@wsfood.io | Admin: admin@wsfood.io" -ForegroundColor DarkGray
Write-Host "=====================================================================" -ForegroundColor Green
