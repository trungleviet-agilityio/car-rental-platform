#!/bin/bash

# =================================================================
# Car Rental Platform - Prisma Setup Script
# =================================================================

set -e

echo "🚀 Setting up Prisma for Car Rental Platform..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
if [ ! -f .env ]; then
    print_status "Creating .env file from env.example..."
    cp env.example .env
    print_success ".env file created"
else
    print_warning ".env file already exists"
fi

# Check if PostgreSQL is running
print_status "Checking PostgreSQL connection..."
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    print_error "PostgreSQL is not running on localhost:5432"
    print_warning "Please start PostgreSQL or update your DATABASE_URL in .env"
    print_status "You can start PostgreSQL with: sudo systemctl start postgresql"
    exit 1
fi

print_success "PostgreSQL is running"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
    print_success "Dependencies installed"
fi

# Generate Prisma client
print_status "Generating Prisma client..."
npx prisma generate
print_success "Prisma client generated"

# Run database migration
print_status "Running database migration..."
npx prisma migrate dev --name init
print_success "Database migration completed"

# Optional: Seed the database
read -p "Do you want to seed the database with sample data? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Seeding database..."
    npx prisma db seed
    print_success "Database seeded"
fi

# Show database status
print_status "Database status:"
npx prisma migrate status

print_success "🎉 Prisma setup completed successfully!"
print_status "You can now start your application with: npm run start:dev"
print_status "To view your database with Prisma Studio: npx prisma studio"
