# VPS Deployment Guide (Frontend)

## What was added

- `Dockerfile` for the Vite React app (build + Nginx runtime)
- `docker-compose.yml` for container runtime on VPS
- `.dockerignore` for smaller and safer image builds
- `.env.example` template for runtime configuration
- `deploy/vps/deploy.sh` deployment script

## 1) Prepare your VPS (one-time)

Install Docker and Docker Compose plugin on your VPS, then run:

```bash
sudo mkdir -p /opt/nse-smart-investor-frontend
sudo chown -R $USER:$USER /opt/nse-smart-investor-frontend
cd /opt/nse-smart-investor-frontend
```

Clone your repository:

```bash
git clone <your-frontend-repo-url> .
```

Create app environment file:

```bash
cp .env.example .env
```

Edit `.env` and set real values, especially:

- `FRONTEND_PORT` (optional, default `80`)
- `VITE_API_BASE_URL` (optional, build-time API URL)

## 2) Deploy manually on VPS

```bash
cd /opt/nse-smart-investor-frontend
chmod +x deploy/vps/deploy.sh
sh deploy/vps/deploy.sh "$(pwd)"
```

## 3) Update deployment after code changes

Whenever new commits are available:

```bash
cd /opt/nse-smart-investor-frontend
git pull
sh deploy/vps/deploy.sh "$(pwd)"
```

## 4) Manual verification on VPS

```bash
cd /opt/nse-smart-investor-frontend
docker compose ps
docker compose logs -f --tail=100
curl http://127.0.0.1:${FRONTEND_PORT:-80}
```
