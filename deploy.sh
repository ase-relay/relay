#!/bin/bash

# Deploy script for Relay Backend with Supabase (minimalist Docker deployment)
# This script pulls the latest changes and rebuilds the Docker container

set -e  # Exit on any error

CONTAINER_NAME="otewe-backend"
IMAGE_NAME="otewe-backend"

echo "🚀 Starting deployment process..."

# Pull latest changes from git
echo "📥 Pulling latest changes from main branch..."
git pull origin main

# Stop and remove existing container
echo "🛑 Stopping existing container..."
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

# Build new image
echo "� Building Docker image..."
cd backend
docker build -t $IMAGE_NAME .

# Start new container
echo "� Starting new container..."
docker run -d \
  --name $CONTAINER_NAME \
  --restart unless-stopped \
  --env-file .env \
  -p 8000:8000 \
  $IMAGE_NAME

cd ..

# Wait for container to be healthy
echo "⏳ Waiting for backend to be healthy..."
sleep 10

# Run Prisma migrations to Supabase
echo "🗄️  Running Prisma migrations to Supabase..."
docker exec $CONTAINER_NAME npx prisma migrate deploy

# Print final status
echo "✅ Deployment completed successfully!"
echo "📊 Current container status:"
docker ps --filter "name=$CONTAINER_NAME"

echo "🎉 All done! Backend is now running with Supabase."
