#!/bin/bash

# Car Rental Platform - Script Manager
# Central hub for all project scripts with professional organization

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}🚗 Car Rental Platform - Script Manager${NC}"
    echo -e "${CYAN}========================================${NC}"
}

print_section() {
    echo -e "\n${BLUE}$1${NC}"
    echo -e "${BLUE}$(echo "$1" | sed 's/./─/g')${NC}"
}

print_command() {
    printf "  ${GREEN}%-25s${NC} %s\n" "$1" "$2"
}

print_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if script exists and is executable
check_script() {
    local script_path="$1"
    if [[ ! -f "$script_path" ]]; then
        print_error "Script not found: $script_path"
        return 1
    fi
    if [[ ! -x "$script_path" ]]; then
        print_info "Making script executable: $script_path"
        chmod +x "$script_path"
    fi
    return 0
}

# Execute script with error handling
execute_script() {
    local script_path="$1"
    shift
    
    if check_script "$script_path"; then
        print_info "Executing: $script_path $*"
        "$script_path" "$@"
        print_success "Script completed successfully"
    else
        print_error "Failed to execute script: $script_path"
        exit 1
    fi
}

# Show usage information
show_usage() {
    print_header
    echo -e "\nProfessional script management for development, testing, and deployment.\n"
    
    print_section "🔧 SETUP & CONFIGURATION"
    print_command "setup" "Complete development environment setup"
    print_command "setup-db" "Database and Prisma setup only"
    
    print_section "💻 DEVELOPMENT"
    print_command "dev start" "Start Docker development environment"
    print_command "dev stop" "Stop all development services"
    print_command "dev restart" "Restart development environment"
    print_command "dev logs [service]" "View service logs (default: api)"
    print_command "dev shell" "Open shell in API container"
    print_command "dev status" "Show service status"
    print_command "dev setup-db" "Setup database in Docker"
    print_command "dev backup-db" "Create database backup"
    print_command "dev cleanup" "Clean up Docker resources"
    
    print_section "🧪 TESTING"
    print_command "test" "Run complete onboarding flow test"
    
    print_section "🔨 MAINTENANCE"
    print_command "lint" "Run TypeScript linting"
    print_command "format" "Format code with Prettier"
    
    print_section "📚 DOCUMENTATION"
    print_command "help" "Show this help message"
    print_command "list" "List all available scripts"
    
    echo -e "\n${YELLOW}Examples:${NC}"
    echo -e "  $0 setup                    # Complete environment setup"
    echo -e "  $0 dev start                # Start development environment"
    echo -e "  $0 test                     # Test onboarding flow"
    echo -e "  $0 lint                     # Run linting"
    echo -e "\n${YELLOW}For more information, see: ${NC}scripts/README.md"
    echo
}

# List all available scripts
list_scripts() {
    print_header
    echo -e "\n${BLUE}📋 Available Scripts${NC}\n"
    
    echo -e "${CYAN}Setup Scripts:${NC}"
    find scripts/setup -name "*.sh" -type f | sort | sed 's|scripts/setup/|  |' | sed 's|\.sh||'
    
    echo -e "\n${CYAN}Development Scripts:${NC}"
    find scripts/development -name "*.sh" -type f | sort | sed 's|scripts/development/|  |' | sed 's|\.sh||'
    
    echo -e "\n${CYAN}Testing Scripts:${NC}"
    find scripts/testing -name "*.sh" -type f | sort | sed 's|scripts/testing/|  |' | sed 's|\.sh||'
    
    echo -e "\n${CYAN}Maintenance Scripts:${NC}"
    find scripts/maintenance -name "*.sh" -type f | sort | sed 's|scripts/maintenance/|  |' | sed 's|\.sh||'
    
    echo
}

# Main script logic
main() {
    case "$1" in
        # Setup commands
        "setup")
            execute_script "scripts/setup/setup-dev.sh" "${@:2}"
            ;;
        "setup-db")
            execute_script "scripts/setup/setup-prisma.sh" "${@:2}"
            ;;
            
        # Development commands
        "dev")
            case "$2" in
                "start"|"stop"|"restart"|"logs"|"shell"|"status"|"setup-db"|"backup-db"|"cleanup")
                    execute_script "scripts/development/docker-dev.sh" "${@:2}"
                    ;;
                *)
                    print_error "Unknown dev command: $2"
                    echo "Available dev commands: start, stop, restart, logs, shell, status, setup-db, backup-db, cleanup"
                    exit 1
                    ;;
            esac
            ;;
            
        # Testing commands
        "test")
            execute_script "scripts/testing/test-complete-onboarding-flow.sh" "${@:2}"
            ;;
            
        # Maintenance commands
        "lint")
            print_info "Running TypeScript linting..."
            npm run lint
            ;;
        "format")
            print_info "Formatting code with Prettier..."
            npm run format
            ;;
            
        # Documentation commands
        "help"|"--help"|"-h")
            show_usage
            ;;
        "list")
            list_scripts
            ;;
            
        # Default case
        "")
            show_usage
            ;;
        *)
            print_error "Unknown command: $1"
            echo -e "Run '${GREEN}$0 help${NC}' to see available commands."
            exit 1
            ;;
    esac
}

# Make sure we're in the right directory
if [[ ! -f "package.json" ]] || [[ ! -d "scripts" ]]; then
    print_error "This script must be run from the project root directory"
    exit 1
fi

# Execute main function
main "$@"
