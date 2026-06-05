#!/bin/bash
set -e

IMAGE="helmseek-frontend"
CONTAINER="helmseek-frontend"
PORT=3003

echo "Stopping existing container..."
podman stop "$CONTAINER" 2>/dev/null || true
podman rm "$CONTAINER" 2>/dev/null || true

echo "Building image..."
podman build -t "$IMAGE" .

echo "Starting container..."
podman run -d \
  --name "$CONTAINER" \
  -p "$PORT:$PORT" \
  --restart unless-stopped \
  "$IMAGE"

echo "HelmSeek frontend running on http://localhost:$PORT"
