#!/bin/bash

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if node is available
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: node is not installed or not in PATH${NC}"
    echo "Please install Node.js and try again."
    exit 1
fi

PORT=8765

echo -e "${BLUE}Starting WebSocket server for Bomberman DOM...${NC}"
echo -e "${YELLOW}WebSocket URL: ws://localhost:${PORT}${NC}"
echo -e "${YELLOW}HTTP Server: Run ./run.sh in another terminal${NC}"
echo ""

# Start the server
node server.js

echo ""
echo -e "${GREEN}✓ WebSocket server stopped${NC}"