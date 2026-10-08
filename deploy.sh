#!/bin/bash
# Deploy backend otewe (Docker + Supabase).
# Bisa dijalankan manual dari root project, atau lewat GitHub Actions (CI=true).

set -euo pipefail

CONTAINER_NAME="otewe-backend"
IMAGE_NAME="otewe-backend"
ENV_FILE="${ENV_FILE:-$(pwd)/backend/.env}"

echo "Mulai deploy..."

# Di GitHub Actions kode sudah di-checkout oleh workflow, jadi tidak perlu git pull
if [ "${CI:-}" != "true" ]; then
  echo "Menarik perubahan terbaru dari branch main..."
  git pull origin main
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: file env tidak ditemukan di $ENV_FILE" >&2
  exit 1
fi

# Build dulu sebelum menghentikan container lama, supaya kalau build gagal
# versi lama tetap jalan dan downtime hanya beberapa detik.
echo "Build image..."
docker build -t "$IMAGE_NAME" backend

echo "Mengganti container lama..."
docker stop "$CONTAINER_NAME" 2>/dev/null || true
docker rm "$CONTAINER_NAME" 2>/dev/null || true

docker run -d \
  --name "$CONTAINER_NAME" \
  --restart unless-stopped \
  --env-file "$ENV_FILE" \
  -p 8000:8000 \
  "$IMAGE_NAME"

echo "Menunggu backend healthy..."
for i in $(seq 1 30); do
  status=$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$CONTAINER_NAME")
  if [ "$status" = "healthy" ]; then
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "ERROR: backend tidak healthy setelah 150 detik" >&2
    docker logs --tail 50 "$CONTAINER_NAME" >&2
    exit 1
  fi
  sleep 5
done

echo "Menjalankan migrasi Prisma..."
docker exec "$CONTAINER_NAME" npx prisma migrate deploy

echo "Deploy selesai."
docker ps --filter "name=$CONTAINER_NAME"
