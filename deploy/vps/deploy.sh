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

if [ -n "${GHCR_USERNAME:-}" ]; then
  export GHCR_USERNAME
fi

if [ -n "${GHCR_TOKEN:-}" ]; then
  export GHCR_TOKEN
fi

if [ -z "${GHCR_USERNAME:-}" ] || [ -z "${GHCR_TOKEN:-}" ]; then
  echo "GHCR_USERNAME and GHCR_TOKEN must be set in .env or shell environment."
  exit 1
fi

if [ -n "${IMAGE_TAG:-}" ]; then
  export IMAGE_TAG
fi

echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USERNAME" --password-stdin

docker compose pull
docker compose up -d --remove-orphans
docker image prune -f

echo "Frontend deployment completed."
