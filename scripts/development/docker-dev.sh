#!/bin/bash

# Car Rental Platform - Docker Development Scripts
# Easy commands for local development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper function for colored output
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

# Function to check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
}

# Function to start all services
start_all() {
    print_status "Starting all Car Rental Platform services..."
    check_docker
    
    docker compose up -d postgres redis
    print_status "Waiting for database to be ready..."
    sleep 10
    
    docker compose up -d pgadmin redis-commander
    docker compose up -d api
    
    print_success "All services started!"
    print_status "Services available at:"
    echo "  🚗 API:              http://localhost:3000"
    echo "  🐘 pgAdmin:          http://localhost:5050 (admin@carrentals.local / admin123)"
    echo "  🔴 Redis Commander:  http://localhost:8081 (admin / admin123)"
    echo "  📊 API Health:       http://localhost:3000/health"
}

# Function to stop all services
stop_all() {
    print_status "Stopping all services..."
    docker compose down
    print_success "All services stopped!"
}

# Function to restart services
restart_all() {
    print_status "Restarting all services..."
    stop_all
    start_all
}

# Function to show logs
show_logs() {
    service=${1:-api}
    print_status "Showing logs for $service..."
    docker compose logs -f "$service"
}

# Function to setup database
setup_db() {
    print_status "Setting up database..."
    check_docker
    
    # Ensure postgres is running
    docker compose up -d postgres
    sleep 10
    
    # Run Prisma commands
    print_status "Running Prisma migrations..."
    docker compose exec api npx prisma migrate dev --name init
    
    print_status "Seeding database..."
    docker compose exec api npx prisma db seed
    
    print_success "Database setup complete!"
}

# Function to reset database
reset_db() {
    print_warning "This will completely reset the database and all data will be lost!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Resetting database..."
        docker compose exec api npx prisma migrate reset --force
        print_success "Database reset complete!"
    else
        print_status "Database reset cancelled."
    fi
}

# Function to backup database
backup_db() {
    print_status "Creating database backup..."
    timestamp=$(date +%Y%m%d_%H%M%S)
    backup_file="backup_${timestamp}.sql"
    
    docker compose exec postgres pg_dump -U postgres car_rental > "backups/$backup_file"
    print_success "Database backup created: backups/$backup_file"
}

# Function to show service status
status() {
    print_status "Service Status:"
    docker compose ps
}

# Function to open shell in API container
shell() {
    print_status "Opening shell in API container..."
    docker compose exec api sh
}

# Function to clean up Docker resources
cleanup() {
    print_status "Cleaning up Docker resources..."
    docker compose down -v
    docker system prune -f
    print_success "Cleanup complete!"
}

# Main script logic
case "$1" in
    start)
        start_all
        ;;
    stop)
        stop_all
        ;;
    restart)
        restart_all
        ;;
    logs)
        show_logs "$2"
        ;;
    setup-db)
        setup_db
        ;;
    reset-db)
        reset_db
        ;;
    backup-db)
        backup_db
        ;;
    status)
        status
        ;;
    shell)
        shell
        ;;
    cleanup)
        cleanup
        ;;
    *)
        echo "Car Rental Platform - Docker Development Helper"
        echo ""
        echo "Usage: $0 {start|stop|restart|logs|setup-db|reset-db|backup-db|status|shell|cleanup}"
        echo ""
        echo "Commands:"
        echo "  start     - Start all services"
        echo "  stop      - Stop all services"
        echo "  restart   - Restart all services"
        echo "  logs      - Show logs for service (default: api)"
        echo "  setup-db  - Initialize database with migrations and seed data"
        echo "  reset-db  - Reset database (WARNING: deletes all data)"
        echo "  backup-db - Create database backup"
        echo "  status    - Show service status"
        echo "  shell     - Open shell in API container"
        echo "  cleanup   - Clean up Docker resources"
        echo ""
        echo "Examples:"
        echo "  $0 start"
        echo "  $0 logs api"
        echo "  $0 logs postgres"
        echo "  $0 setup-db"
        exit 1
        ;;
esac
