#!/usr/bin/env bash
# ============================================================
# Connecta - Setup Script
# ============================================================
# This script sets up the entire development environment:
#   1. Checks prerequisites (Node.js, npm, Docker)
#   2. Starts PostgreSQL & Redis via Docker Compose
#   3. Installs all dependencies
#   4. Creates environment files
#   5. Generates Prisma client & pushes schema
#   6. Seeds the database with initial data
#   7. Starts the dev servers
# ============================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Icons
CHECK="${GREEN}✓${NC}"
CROSS="${RED}✗${NC}"
ARROW="${CYAN}→${NC}"
WARN="${YELLOW}⚠${NC}"

print_banner() {
  echo ""
  echo -e "${CYAN}╔═══════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║                                               ║${NC}"
  echo -e "${CYAN}║${BOLD}          Connecta - Setup Script              ${NC}${CYAN}║${NC}"
  echo -e "${CYAN}║       Open Source Messaging Platform           ║${NC}"
  echo -e "${CYAN}║                                               ║${NC}"
  echo -e "${CYAN}╚═══════════════════════════════════════════════╝${NC}"
  echo ""
}

print_step() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BOLD} Step $1: $2${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# ============================================================
# Step 0: Banner
# ============================================================
print_banner

# ============================================================
# Step 1: Check Prerequisites
# ============================================================
print_step "1/7" "Checking prerequisites"

MISSING=0

# Node.js
if command -v node &> /dev/null; then
  NODE_VERSION=$(node -v | sed 's/v//')
  NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)
  if [ "$NODE_MAJOR" -ge 20 ]; then
    echo -e "  ${CHECK} Node.js v${NODE_VERSION}"
  else
    echo -e "  ${CROSS} Node.js v${NODE_VERSION} (need >= 20.0.0)"
    MISSING=1
  fi
else
  echo -e "  ${CROSS} Node.js not found"
  MISSING=1
fi

# npm
if command -v npm &> /dev/null; then
  NPM_VERSION=$(npm -v)
  echo -e "  ${CHECK} npm v${NPM_VERSION}"
else
  echo -e "  ${CROSS} npm not found"
  MISSING=1
fi

# Docker
if command -v docker &> /dev/null; then
  DOCKER_VERSION=$(docker --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
  echo -e "  ${CHECK} Docker v${DOCKER_VERSION}"
else
  echo -e "  ${CROSS} Docker not found"
  echo -e "  ${ARROW} Install Docker: https://docs.docker.com/get-docker/"
  MISSING=1
fi

# Docker Compose - detect V2 plugin vs V1 standalone
DOCKER_COMPOSE=""
if docker compose version &> /dev/null; then
  DOCKER_COMPOSE="docker compose"
  DC_VERSION=$(docker compose version --short 2>/dev/null || docker compose version 2>&1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
  echo -e "  ${CHECK} Docker Compose v${DC_VERSION} (plugin)"
elif command -v docker-compose &> /dev/null; then
  DOCKER_COMPOSE="docker-compose"
  DC_VERSION=$(docker-compose version --short 2>/dev/null || docker-compose version 2>&1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
  echo -e "  ${CHECK} Docker Compose v${DC_VERSION} (standalone)"
else
  echo -e "  ${CROSS} Docker Compose not found"
  MISSING=1
fi

if [ "$MISSING" -eq 1 ]; then
  echo ""
  echo -e "  ${CROSS} ${RED}Missing prerequisites. Please install them and try again.${NC}"
  exit 1
fi

echo ""
echo -e "  ${CHECK} All prerequisites met!"

# ============================================================
# Step 2: Start Docker services (PostgreSQL + Redis)
# ============================================================
print_step "2/7" "Starting Docker services (PostgreSQL + Redis)"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if containers are already running
if docker ps --format '{{.Names}}' | grep -q 'connecta-postgres'; then
  echo -e "  ${CHECK} PostgreSQL already running"
else
  echo -e "  ${ARROW} Starting PostgreSQL..."
  $DOCKER_COMPOSE up -d postgres
  echo -e "  ${CHECK} PostgreSQL started"
fi

if docker ps --format '{{.Names}}' | grep -q 'connecta-redis'; then
  echo -e "  ${CHECK} Redis already running"
else
  echo -e "  ${ARROW} Starting Redis..."
  $DOCKER_COMPOSE up -d redis
  echo -e "  ${CHECK} Redis started"
fi

# Wait for PostgreSQL to be ready
echo -e "  ${ARROW} Waiting for PostgreSQL to be ready..."
RETRIES=30
until docker exec connecta-postgres pg_isready -U connecta -d connectadb > /dev/null 2>&1 || [ "$RETRIES" -eq 0 ]; do
  RETRIES=$((RETRIES - 1))
  sleep 1
done

if [ "$RETRIES" -eq 0 ]; then
  echo -e "  ${CROSS} ${RED}PostgreSQL failed to start. Check Docker logs:${NC}"
  echo -e "  ${ARROW} $DOCKER_COMPOSE logs postgres"
  exit 1
fi

echo -e "  ${CHECK} PostgreSQL is ready"

# Wait for Redis to be ready
echo -e "  ${ARROW} Waiting for Redis to be ready..."
RETRIES=15
until docker exec connecta-redis redis-cli ping > /dev/null 2>&1 || [ "$RETRIES" -eq 0 ]; do
  RETRIES=$((RETRIES - 1))
  sleep 1
done

if [ "$RETRIES" -eq 0 ]; then
  echo -e "  ${CROSS} ${RED}Redis failed to start. Check Docker logs:${NC}"
  echo -e "  ${ARROW} $DOCKER_COMPOSE logs redis"
  exit 1
fi

echo -e "  ${CHECK} Redis is ready"

# ============================================================
# Step 3: Create environment files
# ============================================================
print_step "3/7" "Setting up environment files"

# Generate a random secret for JWT/NextAuth
JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "dev-secret-$(date +%s)-change-in-production")

# Server .env
if [ ! -f apps/server/.env ]; then
  cat > apps/server/.env << EOF
DATABASE_URL="postgresql://connecta:connectapass@localhost:5432/connectadb?schema=public"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_SECRET="${JWT_SECRET}"
PORT=4000
NODE_ENV=development
CLIENT_URL="http://localhost:3000"
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=26214400
EOF
  echo -e "  ${CHECK} Created apps/server/.env"
else
  echo -e "  ${WARN} apps/server/.env already exists (skipped)"
fi

# Web .env.local
if [ ! -f apps/web/.env.local ]; then
  cat > apps/web/.env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
EOF
  echo -e "  ${CHECK} Created apps/web/.env.local"
else
  echo -e "  ${WARN} apps/web/.env.local already exists (skipped)"
fi

# Create uploads directory
mkdir -p apps/server/uploads
echo -e "  ${CHECK} Uploads directory ready"

# ============================================================
# Step 4: Install dependencies
# ============================================================
print_step "4/7" "Installing dependencies"

echo -e "  ${ARROW} Running npm install (this may take a minute)..."
npm install --loglevel=warn 2>&1 | tail -5

echo -e "  ${CHECK} Dependencies installed"

# ============================================================
# Step 5: Generate Prisma client & push schema
# ============================================================
print_step "5/7" "Setting up database"

echo -e "  ${ARROW} Generating Prisma client..."
cd apps/server
npx prisma generate 2>&1 | tail -3
echo -e "  ${CHECK} Prisma client generated"

echo -e "  ${ARROW} Pushing schema to database..."
npx prisma db push --accept-data-loss 2>&1 | tail -5
echo -e "  ${CHECK} Database schema applied"

cd "$SCRIPT_DIR"

# ============================================================
# Step 6: Seed the database
# ============================================================
print_step "6/7" "Seeding database"

echo -e "  ${ARROW} Running seed script..."
cd apps/server
npx tsx prisma/seed.ts 2>&1 | tail -10
echo -e "  ${CHECK} Database seeded"

cd "$SCRIPT_DIR"

# ============================================================
# Step 7: Done!
# ============================================================
print_step "7/7" "Setup complete!"

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                               ║${NC}"
echo -e "${GREEN}║${BOLD}           Setup completed!                    ${NC}${GREEN}║${NC}"
echo -e "${GREEN}║                                               ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BOLD}To start the development servers:${NC}"
echo ""
echo -e "    ${CYAN}npm run dev${NC}"
echo ""
echo -e "  This starts both services concurrently:"
echo -e "    ${ARROW} Frontend:  ${BOLD}http://localhost:3000${NC}"
echo -e "    ${ARROW} Backend:   ${BOLD}http://localhost:4000${NC}"
echo -e "    ${ARROW} API docs:  ${BOLD}http://localhost:4000/api/v1${NC}"
echo ""
echo -e "  ${BOLD}Default seed account:${NC}"
echo -e "    ${ARROW} Email:     ${BOLD}admin@example.com${NC}"
echo -e "    ${ARROW} Password:  ${BOLD}password123${NC}"
echo -e "    ${ARROW} Workspace: ${BOLD}Acme Inc${NC} (slug: acme)"
echo ""
echo -e "  ${BOLD}Useful commands:${NC}"
echo -e "    ${CYAN}npm run dev${NC}              Start dev servers"
echo -e "    ${CYAN}npm run build${NC}            Build for production"
echo -e "    ${CYAN}npm run db:seed${NC}          Re-seed the database"
echo -e "    ${CYAN}npm run db:migrate${NC}       Run Prisma migrations"
echo -e "    ${CYAN}${DOCKER_COMPOSE} down${NC}      Stop PostgreSQL & Redis"
echo -e "    ${CYAN}${DOCKER_COMPOSE} up -d${NC}     Restart PostgreSQL & Redis"
echo ""
echo -e "  ${BOLD}Project structure:${NC}"
echo -e "    ${ARROW} apps/web/        Next.js frontend"
echo -e "    ${ARROW} apps/server/     Express + Socket.io backend"
echo -e "    ${ARROW} packages/shared/ Shared types, validators, constants"
echo ""
