# XFERNO Docker Start Script (PowerShell)
# Usage: .\scripts\docker-start.ps1 [dev|prod]

param(
    [string]$Environment = "dev"
)

$ErrorActionPreference = "Stop"

Write-Host "🔥 XFERNO Docker Start" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Yellow

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Set compose file based on environment
if ($Environment -eq "prod") {
    $composeFile = "docker-compose.prod.yml"
    Write-Host "📦 Starting PRODUCTION environment..." -ForegroundColor Magenta
} else {
    $composeFile = "docker-compose.yml"
    Write-Host "🛠️  Starting DEVELOPMENT environment..." -ForegroundColor Green
}

# Check if .env exists
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.docker") {
        Copy-Item ".env.docker" ".env"
        Write-Host "📄 Created .env from .env.docker template" -ForegroundColor Yellow
    } else {
        Write-Host "⚠️  No .env file found. Using defaults." -ForegroundColor Yellow
    }
}

# Build and start containers
Write-Host "`n🐳 Building and starting containers..." -ForegroundColor Cyan
docker compose -f $composeFile up -d --build

# Wait for services to be healthy
Write-Host "`n⏳ Waiting for services to be healthy..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Show status
Write-Host "`n📊 Container Status:" -ForegroundColor Cyan
docker compose -f $composeFile ps

Write-Host "`n✅ XFERNO is running!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Services:" -ForegroundColor Cyan
Write-Host "   Frontend:  http://localhost:3000" -ForegroundColor White
Write-Host "   API:       http://localhost:3002" -ForegroundColor White
Write-Host "   GraphQL:   http://localhost:3002/graphql" -ForegroundColor White
Write-Host "   Health:    http://localhost:3002/health" -ForegroundColor White
Write-Host ""
Write-Host "📋 Commands:" -ForegroundColor Cyan
Write-Host "   View logs:  docker compose logs -f" -ForegroundColor White
Write-Host "   Stop:       docker compose down" -ForegroundColor White
Write-Host "   Restart:    docker compose restart" -ForegroundColor White
