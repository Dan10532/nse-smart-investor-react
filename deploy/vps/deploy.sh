#!/usr/bin/env sh
set -eu

APP_DIR="${1:-$(pwd)}"
cd "$APP_DIR"

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "Created .env from .env.example. Update it with real values and re-run."
  exit 1
fi

set -a
. ./.env
set +a

# Build locally on VPS and restart container.
docker compose up -d --build --remove-orphans
docker image prune -f

echo "Frontend deployment completed."
