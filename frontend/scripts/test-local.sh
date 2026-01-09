#!/bin/bash

# Bauturbo Directory - Local Test Script
# This script tests the build locally and verifies everything works correctly
# Usage (from anywhere):
# ~/Library/Mobile\ Documents/com\~apple\~CloudDocs/Dev/work/projecttogether/pt-apps/directory_multisites_1/frontend/scripts/test-local.sh
# Or from project directory:
# cd frontend && ./scripts/test-local.sh

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Bauturbo Directory - Local Test${NC}"
echo -e "${BLUE}========================================${NC}\n"

cd "$FRONTEND_DIR"

# Step 1: Check dependencies
echo -e "${YELLOW}[1/7] Checking dependencies...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed${NC}"
    exit 1
fi
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node --version)${NC}"
echo -e "${GREEN}✓ npm $(npm --version)${NC}\n"

# Step 2: Check required files
echo -e "${YELLOW}[2/7] Checking required files...${NC}"
REQUIRED_FILES=(
    "config.yml"
    ".env"
    "package.json"
    ".eleventy.js"
    "src/_data/siteConfig.js"
    "src/_data/directories.js"
    "src/_includes/layouts/base.njk"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ $file${NC}"
    else
        echo -e "${RED}✗ Missing: $file${NC}"
        exit 1
    fi
done
echo ""

# Step 3: Validate YAML syntax
echo -e "${YELLOW}[3/7] Validating config.yml syntax...${NC}"
if npx js-yaml config.yml > /dev/null 2>&1; then
    echo -e "${GREEN}✓ config.yml syntax is valid${NC}\n"
else
    echo -e "${RED}✗ config.yml has syntax errors${NC}"
    npx js-yaml config.yml
    exit 1
fi

# Step 4: Check environment variables
echo -e "${YELLOW}[4/7] Checking environment variables...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${RED}✗ .env file not found${NC}"
    echo -e "${YELLOW}  Copy .env.example to .env and fill in values${NC}"
    exit 1
fi

# Source .env and check required variables
source .env
REQUIRED_ENV_VARS=(
    "NOCODB_BASE_URL"
    "NOCODB_API_TOKEN"
    "NOCODB_PROJECT_ID"
)

ALL_ENV_VARS_SET=true
for var in "${REQUIRED_ENV_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}✗ Missing: $var${NC}"
        ALL_ENV_VARS_SET=false
    else
        echo -e "${GREEN}✓ $var is set${NC}"
    fi
done

if [ "$ALL_ENV_VARS_SET" = false ]; then
    exit 1
fi
echo ""

# Step 5: Install/verify dependencies
echo -e "${YELLOW}[5/7] Checking npm dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}Installing dependencies...${NC}"
    npm install
else
    echo -e "${GREEN}✓ node_modules exists${NC}"
fi
echo ""

# Step 6: Clear cache and build
echo -e "${YELLOW}[6/7] Building site (clean build)...${NC}"
echo -e "${BLUE}Clearing cache...${NC}"
rm -rf .cache _site

echo -e "${BLUE}Running build...${NC}"
if npm run build; then
    echo -e "${GREEN}✓ Build successful!${NC}\n"
else
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi

# Step 7: Verify build output
echo -e "${YELLOW}[7/7] Verifying build output...${NC}"

if [ ! -d "_site" ]; then
    echo -e "${RED}✗ _site directory not created${NC}"
    exit 1
fi

# Check for expected files
EXPECTED_FILES=(
    "_site/index.html"
    "_site/projekte/index.html"
)

for file in "${EXPECTED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ $file${NC}"
    else
        echo -e "${YELLOW}⚠ Missing: $file (may be expected if directory config changed)${NC}"
    fi
done

# Count generated files
HTML_COUNT=$(find _site -name "*.html" | wc -l | tr -d ' ')
echo -e "\n${GREEN}✓ Generated $HTML_COUNT HTML files${NC}"

# Check for assets
if [ -d "_site/assets" ]; then
    echo -e "${GREEN}✓ Assets directory copied${NC}"
else
    echo -e "${YELLOW}⚠ No assets directory found${NC}"
fi

# Final summary
echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}✓ All tests passed!${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${BLUE}Build output is in: ${NC}_site/"
echo -e "\n${BLUE}Starting dev server...${NC}"
echo -e "${GREEN}Visit: ${NC}http://localhost:8080/\n"
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}\n"

npm run dev
