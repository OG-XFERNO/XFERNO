#!/bin/bash
# XFERNO Docker Stop Script (Bash)
# Usage: ./scripts/docker-stop.sh [--clean]

echo "🛑 XFERNO Docker Stop"

if [ "$1" = "--clean" ]; then
    echo "🧹 Stopping and removing all containers, volumes, and images..."
    docker compose down -v --rmi local
    echo "✅ All XFERNO containers, volumes, and images removed."
else
    echo "⏹️  Stopping containers..."
    docker compose down
    echo "✅ XFERNO containers stopped."
fi

echo ""
echo "📋 To restart: ./scripts/docker-start.sh"
