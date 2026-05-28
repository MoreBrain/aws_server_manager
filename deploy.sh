#!/bin/bash

# Deployment script for React + FastAPI + Docker setup
# Usage: ./deploy.sh
#
# Reads target host configuration from .env (see .env.example).

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load .env from repo root
if [ -f "${SCRIPT_DIR}/.env" ]; then
    set -a
    # shellcheck disable=SC1091
    source "${SCRIPT_DIR}/.env"
    set +a
else
    echo "No .env file found at ${SCRIPT_DIR}/.env"
    echo "Copy .env.example to .env and fill in the values."
    exit 1
fi

: "${HOST_IP:?HOST_IP must be set in .env}"
: "${SERVER_USER:?SERVER_USER must be set in .env}"
: "${REMOTE_PATH:?REMOTE_PATH must be set in .env}"
SERVER_PORT="${SERVER_PORT:-22}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deploying to ${SERVER_USER}@${HOST_IP}:${REMOTE_PATH}${NC}"
echo -e "${GREEN}========================================${NC}"

# Step 1: Sync files to server
echo -e "\n${YELLOW}Step 1: Syncing files to server...${NC}"
rsync -avz --progress \
  -e "ssh -p ${SERVER_PORT}" \
  --exclude 'node_modules' \
  --exclude '__pycache__' \
  --exclude '.git' \
  --exclude 'dist' \
  --exclude '*.pyc' \
  --exclude '.env' \
  --exclude '.DS_Store' \
  ./ "${SERVER_USER}@${HOST_IP}:${REMOTE_PATH}/"

echo -e "${GREEN}✓ Files synced successfully${NC}"

# Step 2: Deploy on server
echo -e "\n${YELLOW}Step 2: Building and starting containers on server...${NC}"
ssh -p "${SERVER_PORT}" "${SERVER_USER}@${HOST_IP}" REMOTE_PATH="${REMOTE_PATH}" bash <<'ENDSSH'
    set -e
    cd "${REMOTE_PATH}"

    echo "Stopping existing containers..."
    docker compose -f docker-compose.prod.yml down

    echo "Building and starting containers..."
    docker compose -f docker-compose.prod.yml up -d --build

    echo "Waiting for containers to start..."
    sleep 5

    echo "Checking container status..."
    docker compose -f docker-compose.prod.yml ps
ENDSSH

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Deployment completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\nYour application is running at:"
echo -e "  ${YELLOW}http://${HOST_IP}${NC}"
echo -e "\nTo view logs:"
echo -e "  ${YELLOW}ssh -p ${SERVER_PORT} ${SERVER_USER}@${HOST_IP}${NC}"
echo -e "  ${YELLOW}cd ${REMOTE_PATH} && docker compose -f docker-compose.prod.yml logs -f${NC}"
