#!/bin/bash

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if python3 is available
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: python3 is not installed or not in PATH${NC}"
    echo "Please install Python 3 and try again."
    exit 1
fi

PORT=8080

echo -e "${BLUE}Starting HTTP server for Bomberman DOM app...${NC}"
echo -e "${YELLOW}Port: ${PORT}${NC}"
echo -e "${YELLOW}URL: http://localhost:${PORT}${NC}"
echo ""

# Start the server
python3 -m http.server $PORT

echo ""
echo -e "${GREEN}✓ Server stopped${NC}"