# =====================================================
#  Script de démarrage — NestFind Immobilier
#  Démarre PostgreSQL + Backend + Frontend
# =====================================================

$PG_DIR = "C:\Users\athar\AppData\Local\Temp\pg15\pgsql"
$PG_DATA = "C:\Users\athar\AppData\Local\Temp\pg15\data"
$BACKEND_DIR = "C:\Users\athar\Desktop\fredy\Soutenance\Application\Application\backend"
$FRONTEND_DIR = "C:\Users\athar\Desktop\fredy\Soutenance\Application\Application\front"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  NestFind — Demarrage de l'application" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# --- 1. Démarrage de PostgreSQL ---
Write-Host "[1/3] Demarrage de PostgreSQL..." -ForegroundColor Yellow

$pgRunning = Get-Process -Name "postgres" -ErrorAction SilentlyContinue
if ($pgRunning) {
    Write-Host "      PostgreSQL est deja en cours d'execution (PID: $($pgRunning.Id))." -ForegroundColor Green
} else {
    if (Test-Path "$PG_DIR\bin\pg_ctl.exe") {
        & "$PG_DIR\bin\pg_ctl.exe" start -D $PG_DATA -l "$PG_DATA\logfile.txt" -w
        if ($LASTEXITCODE -eq 0) {
            Write-Host "      PostgreSQL demarre avec succes." -ForegroundColor Green
        } else {
            Write-Host "      ERREUR: Impossible de demarrer PostgreSQL." -ForegroundColor Red
            Write-Host "      Verifiez le fichier: $PG_DATA\logfile.txt" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "      ERREUR: PostgreSQL introuvable dans $PG_DIR" -ForegroundColor Red
        Write-Host "      Installez PostgreSQL ou ajustez le chemin dans ce script." -ForegroundColor Red
        exit 1
    }
}

# --- 2. Démarrage du Backend (port 5001) ---
Write-Host "[2/3] Demarrage du Backend (port 5001)..." -ForegroundColor Yellow

$backendRunning = Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -like '*server.js*' }
if ($backendRunning) {
    Write-Host "      Le backend est deja en cours d'execution. Arret en cours..." -ForegroundColor DarkYellow
    $backendRunning | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
    Start-Sleep -Seconds 2
}

Start-Process -FilePath "node" -ArgumentList "src/server.js" -WorkingDirectory $BACKEND_DIR -WindowStyle Normal
Start-Sleep -Seconds 3
Write-Host "      Backend demarre sur http://localhost:5001" -ForegroundColor Green

# --- 3. Démarrage du Frontend (port 3000) ---
Write-Host "[3/3] Demarrage du Frontend (port 3000)..." -ForegroundColor Yellow

$frontendRunning = Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -like '*next*dev*' }
if ($frontendRunning) {
    Write-Host "      Le frontend est deja en cours d'execution. Arret en cours..." -ForegroundColor DarkYellow
    $frontendRunning | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
    Start-Sleep -Seconds 2
}

Start-Process -FilePath "npx.cmd" -ArgumentList "next dev" -WorkingDirectory $FRONTEND_DIR -WindowStyle Normal
Start-Sleep -Seconds 5
Write-Host "      Frontend demarre sur http://localhost:3000" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Application demarree !" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Frontend : http://localhost:3000" -ForegroundColor White
Write-Host "  Backend  : http://localhost:5001" -ForegroundColor White
Write-Host "  API      : http://localhost:5001/api/health" -ForegroundColor White
Write-Host ""
Write-Host "  Comptes de test :" -ForegroundColor Gray
Write-Host "    Admin : admin@immo.cm / admin123" -ForegroundColor Gray
Write-Host "    User  : user@immo.cm / user123" -ForegroundColor Gray
Write-Host ""
Write-Host "  Pour arreter : .\stop.ps1" -ForegroundColor Gray
Write-Host ""
