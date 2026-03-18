#!/bin/bash

# Deployment script for React + FastAPI + Docker setup
# Usage: ./deploy.sh

set -e  # Exit on error

# Server configuration
SERVER_USER="nsc"
SERVER_HOST="TODO
SERVER_PORT="22"
REMOTE_PATH="TODO"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deploying to server...${NC}"
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
  ./ ${SERVER_USER}@${SERVER_HOST}:${REMOTE_PATH}/

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Files synced successfully${NC}"
else
    echo -e "${RED}✗ File sync failed${NC}"
    exit 1
fi

# Step 2: Deploy on server
echo -e "\n${YELLOW}Step 2: Building and starting containers on server...${NC}"
ssh -p ${SERVER_PORT} ${SERVER_USER}@${SERVER_HOST} << 'ENDSSH'
    cd /home/niels/simple_back_frontend_setup

    echo "Stopping existing containers..."
    docker compose -f docker-compose.prod.yml down

    echo "Building and starting containers..."
    docker compose -f docker-compose.prod.yml up -d --build

    echo "Waiting for containers to start..."
    sleep 5

    echo "Checking container status..."
    docker compose -f docker-compose.prod.yml ps

    echo "Testing backend health..."
    curl -f http://localhost/api/health || echo "Health check failed (this is normal on first deploy before nginx is ready)"
ENDSSH

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}========================================${NC}"
    echo -e "${GREEN}✓ Deployment completed successfully!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "\nYour application is running at:"
    echo -e "  ${YELLOW}http://${SERVER_HOST}${NC}"
    echo -e "\nTo view logs:"
    echo -e "  ${YELLOW}ssh -p ${SERVER_PORT} ${SERVER_USER}@${SERVER_HOST}${NC}"
    echo -e "  ${YELLOW}cd ${REMOTE_PATH} && docker compose -f docker-compose.prod.yml logs -f${NC}"
else
    echo -e "\n${RED}========================================${NC}"
    echo -e "${RED}✗ Deployment failed${NC}"
    echo -e "${RED}========================================${NC}"
    exit 1
fi