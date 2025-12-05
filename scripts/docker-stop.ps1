# XFERNO Docker Stop Script (PowerShell)
# Usage: .\scripts\docker-stop.ps1 [--clean]

param(
    [switch]$Clean
)

Write-Host "🛑 XFERNO Docker Stop" -ForegroundColor Cyan

# Stop containers
if ($Clean) {
    Write-Host "🧹 Stopping and removing all containers, volumes, and images..." -ForegroundColor Yellow
    docker compose down -v --rmi local
    Write-Host "✅ All XFERNO containers, volumes, and images removed." -ForegroundColor Green
} else {
    Write-Host "⏹️  Stopping containers..." -ForegroundColor Yellow
    docker compose down
    Write-Host "✅ XFERNO containers stopped." -ForegroundColor Green
}

Write-Host ""
Write-Host "📋 To restart: .\scripts\docker-start.ps1" -ForegroundColor Cyan
