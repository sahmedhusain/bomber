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

HTTP_PORT=8080
WS_PORT=8765

echo -e "${BLUE}Starting Blast Arena server...${NC}"
echo -e "${YELLOW}HTTP Server: http://localhost:${HTTP_PORT}${NC}"
echo -e "${YELLOW}WebSocket Server: ws://localhost:${WS_PORT}${NC}"
echo ""
echo -e "${GREEN}Both servers are now running!${NC}"
echo -e "${GREEN}Open your browser to http://localhost:${HTTP_PORT}${NC}"
echo ""

# Start the combined server
node server.js

echo ""
echo -e "${GREEN}✓ Server stopped${NC}"