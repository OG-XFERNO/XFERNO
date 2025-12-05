#!/bin/bash
# XFERNO Docker Start Script (Bash)
# Usage: ./scripts/docker-start.sh [dev|prod]

set -e

ENVIRONMENT=${1:-dev}

echo "🔥 XFERNO Docker Start"
echo "Environment: $ENVIRONMENT"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker."
    exit 1
fi

# Set compose file based on environment
if [ "$ENVIRONMENT" = "prod" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
    echo "📦 Starting PRODUCTION environment..."
else
    COMPOSE_FILE="docker-compose.yml"
    echo "🛠️  Starting DEVELOPMENT environment..."
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    if [ -f ".env.docker" ]; then
        cp .env.docker .env
        echo "📄 Created .env from .env.docker template"
    else
        echo "⚠️  No .env file found. Using defaults."
    fi
fi

# Build and start containers
echo ""
echo "🐳 Building and starting containers..."
docker compose -f $COMPOSE_FILE up -d --build

# Wait for services to be healthy
echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 5

# Show status
echo ""
echo "📊 Container Status:"
docker compose -f $COMPOSE_FILE ps

echo ""
echo "✅ XFERNO is running!"
echo ""
echo "🌐 Services:"
echo "   Frontend:  http://localhost:3000"
echo "   API:       http://localhost:3002"
echo "   GraphQL:   http://localhost:3002/graphql"
echo "   Health:    http://localhost:3002/health"
echo ""
echo "📋 Commands:"
echo "   View logs:  docker compose logs -f"
echo "   Stop:       docker compose down"
echo "   Restart:    docker compose restart"
