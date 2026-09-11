# =====================================================
#  Script d'arrêt — NestFind Immobilier
#  Arrête PostgreSQL + Backend + Frontend
# =====================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  NestFind — Arret de l'application" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# --- 1. Arrêt du Frontend ---
Write-Host "[1/3] Arret du Frontend..." -ForegroundColor Yellow
$frontend = Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -like '*next*dev*' }
if ($frontend) {
    $frontend | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
    Write-Host "      Frontend arrete." -ForegroundColor Green
} else {
    Write-Host "      Frontend non en cours d'execution." -ForegroundColor DarkGray
}

# --- 2. Arrêt du Backend ---
Write-Host "[2/3] Arret du Backend..." -ForegroundColor Yellow
$backend = Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -like '*server.js*' }
if ($backend) {
    $backend | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
    Write-Host "      Backend arrete." -ForegroundColor Green
} else {
    Write-Host "      Backend non en cours d'execution." -ForegroundColor DarkGray
}

# --- 3. Arrêt de PostgreSQL ---
Write-Host "[3/3] Arret de PostgreSQL..." -ForegroundColor Yellow
$pgDir = "C:\Users\athar\AppData\Local\Temp\pg15\pgsql"
$pgData = "C:\Users\athar\AppData\Local\Temp\pg15\data"

$pgRunning = Get-Process -Name "postgres" -ErrorAction SilentlyContinue
if ($pgRunning) {
    if (Test-Path "$pgDir\bin\pg_ctl.exe") {
        & "$pgDir\bin\pg_ctl.exe" stop -D $pgData -m fast -w
        if ($LASTEXITCODE -eq 0) {
            Write-Host "      PostgreSQL arrete." -ForegroundColor Green
        } else {
            Write-Host "      Arret force de PostgreSQL." -ForegroundColor DarkYellow
            $pgRunning | ForEach-Object { Stop-Process -Id $_.Id -Force }
        }
    } else {
        $pgRunning | ForEach-Object { Stop-Process -Id $_.Id -Force }
        Write-Host "      PostgreSQL arrete (force)." -ForegroundColor Green
    }
} else {
    Write-Host "      PostgreSQL non en cours d'execution." -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Application arrete." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Pour redemarrer : .\start.ps1" -ForegroundColor Gray
Write-Host ""
