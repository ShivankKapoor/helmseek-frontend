#!/bin/bash
set -e

IMAGE="helmseek-frontend"
CONTAINER="helmseek-frontend"

echo "Stopping container..."
podman stop "$CONTAINER" 2>/dev/null || true
podman rm "$CONTAINER" 2>/dev/null || true

echo "Removing image..."
podman rmi "$IMAGE" 2>/dev/null || true

echo "HelmSeek frontend stopped and image removed."
