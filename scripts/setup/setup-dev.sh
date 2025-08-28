#!/bin/bash

# Car Rental Platform - Development Setup Script
# This script sets up the complete development environment

set -e  # Exit on any error

echo "🚀 Setting up Car Rental Platform Development Environment"
echo "========================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${BLUE}$1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Step 1: Check Prerequisites
print_step "1. Checking Prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2)
print_success "Node.js version: $NODE_VERSION"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed."
    exit 1
fi

NPM_VERSION=$(npm -v)
print_success "npm version: $NPM_VERSION"

# Check Docker
if ! command -v docker &> /dev/null; then
    print_warning "Docker is not installed. You'll need to set up PostgreSQL manually."
else
    print_success "Docker is available"
fi

# Step 2: Install Dependencies
print_step "2. Installing Dependencies..."
npm install
print_success "Dependencies installed"

# Step 3: Environment Setup
print_step "3. Setting up Environment..."

if [ ! -f .env ]; then
    if [ -f env.example ]; then
        cp env.example .env
        print_success "Environment file created from template"
        print_warning "Please update .env with your actual values before continuing"
    else
        print_error "env.example not found. Creating basic .env file..."
        cat > .env << EOL
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/carrentals"

# Application
PORT=3000
NODE_ENV=development

# JWT (Development only - change in production!)
JWT_SECRET="dev-jwt-secret-key-12345"
JWT_EXPIRES_IN="24h"

# Mock Services (Set these to any value for development)
AWS_REGION="us-east-1"
COGNITO_USER_POOL_ID="us-east-1_MOCKVALUE"
COGNITO_CLIENT_ID="MOCKVALUE"
ONBOARDING_STATE_MACHINE_ARN="arn:aws:states:us-east-1:123456:stateMachine:mock"
SES_FROM_EMAIL="dev@example.com"
S3_KYC_BUCKET="dev-kyc-bucket"

TWILIO_ACCOUNT_SID="MOCK_ACCOUNT_SID"
TWILIO_AUTH_TOKEN="MOCK_AUTH_TOKEN"
TWILIO_VERIFY_SERVICE_SID="MOCK_SERVICE_SID"

# Redis (Optional for development)
REDIS_HOST="localhost"
REDIS_PORT="6379"
EOL
        print_success "Basic .env file created"
    fi
else
    print_success ".env file already exists"
fi

# Step 4: Database Setup
print_step "4. Setting up Database..."

if command -v docker &> /dev/null; then
    # Check if PostgreSQL container is running
    if docker ps | grep -q carrentals-postgres; then
        print_success "PostgreSQL container is already running"
    else
        # Check if container exists but is stopped
        if docker ps -a | grep -q carrentals-postgres; then
            print_step "Starting existing PostgreSQL container..."
            docker start carrentals-postgres
        else
            print_step "Creating PostgreSQL container..."
            docker run -d \
              --name carrentals-postgres \
              -e POSTGRES_DB=carrentals \
              -e POSTGRES_USER=postgres \
              -e POSTGRES_PASSWORD=password \
              -p 5432:5432 \
              postgres:15-alpine
        fi
        
        # Wait for PostgreSQL to be ready
        print_step "Waiting for PostgreSQL to be ready..."
        for i in {1..30}; do
            if docker exec carrentals-postgres pg_isready -U postgres > /dev/null 2>&1; then
                print_success "PostgreSQL is ready"
                break
            fi
            if [ $i -eq 30 ]; then
                print_error "PostgreSQL failed to start within 30 seconds"
                exit 1
            fi
            sleep 1
        done
    fi
else
    print_warning "Docker not available. Please ensure PostgreSQL is running manually on localhost:5432"
    print_warning "Database: carrentals, User: postgres, Password: password"
fi

# Step 5: Prisma Setup
print_step "5. Setting up Prisma..."

# Generate Prisma client
npm run prisma:generate
print_success "Prisma client generated"

# Run migrations
print_step "Running database migrations..."
npm run prisma:migrate
print_success "Database migrations completed"

# Step 6: Verify Setup
print_step "6. Verifying Setup..."

# Check if we can build the project
print_step "Building project..."
npm run build
print_success "Project builds successfully"

# Step 7: Development Server
print_step "7. Starting Development Server..."
print_success "Setup completed successfully!"

echo ""
echo "🎉 Development Environment Ready!"
echo "================================"
echo ""
echo "📋 What's been set up:"
echo "  ✅ Dependencies installed"
echo "  ✅ Environment configuration"
echo "  ✅ PostgreSQL database (Docker)"
echo "  ✅ Prisma schema and migrations"
echo "  ✅ Project build verification"
echo ""
echo "🚀 Next steps:"
echo "  1. Start the development server: npm run start:dev"
echo "  2. Visit API docs: http://localhost:3000/api/docs"
echo "  3. Test the API flow: ./test-api.sh"
echo ""
echo "🔧 Development commands:"
echo "  npm run start:dev     - Start development server"
echo "  npm run prisma:studio - Open Prisma Studio (database GUI)"
echo "  ./test-api.sh         - Test complete API flow"
echo ""
echo "📚 Documentation:"
echo "  GETTING_STARTED.md - Quick start guide"
echo "  ARCHITECTURE.md    - Architecture overview"
echo ""

# Ask if user wants to start the dev server
read -p "Would you like to start the development server now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_step "Starting development server..."
    npm run start:dev
fi
