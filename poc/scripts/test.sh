#!/bin/bash

# Car Rental Platform - Main Testing Script
# Entry point for testing operations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

show_usage() {
    echo -e "${BLUE}🧪 Car Rental Platform - Testing Scripts${NC}"
    echo "==============================================="
    echo ""
    echo -e "${YELLOW}Usage: $0 <command> [options]${NC}"
    echo ""
    echo -e "${YELLOW}Commands:${NC}"
    echo "  smoke               Run basic system smoke tests"
    echo "  aws                 Test AWS provider integration"
    echo "  flow                Test complete application flows"
    echo "  registration        Test user registration flow"
    echo "  dip                 Test DIP implementation"
    echo "  health              Check system health status"
    echo "  diff                Check CDK infrastructure changes"
    echo "  setup-db            Setup local database for development"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  $0 smoke                    # Run smoke tests"
    echo "  $0 aws                      # Test AWS integration"
    echo "  $0 flow                     # Test complete flows"
    echo "  $0 registration             # Test registration flow"
    echo "  $0 dip                      # Test DIP implementation"
    echo "  $0 health                   # Check system health"
    echo "  $0 diff                     # Check infrastructure changes"
    echo "  $0 setup-db                 # Setup local database"
    echo ""
    echo -e "${YELLOW}For detailed help:${NC}"
    echo "  $0 smoke --help"
}

# Check if command is provided
if [ $# -eq 0 ]; then
    show_usage
    exit 1
fi

COMMAND=$1
shift

case $COMMAND in
    smoke)
        echo -e "${BLUE}🧪 Running smoke tests...${NC}"
        exec ./scripts/test/smoke-test.sh "$@"
        ;;
    aws)
        echo -e "${BLUE}☁️  Testing AWS integration...${NC}"
        exec ./scripts/test/test-aws-integration.sh "$@"
        ;;
    flow)
        echo -e "${BLUE}🔄 Testing complete flows...${NC}"
        exec ./scripts/test/test-complete-flow.sh "$@"
        ;;
    registration)
        echo -e "${BLUE}👤 Testing registration flow...${NC}"
        exec ./scripts/test/test-registration-flow.sh "$@"
        ;;
    dip)
        echo -e "${BLUE}🏗️  Testing DIP implementation...${NC}"
        exec node ./scripts/test/test-dip.js "$@"
        ;;
    health)
        echo -e "${BLUE}🏥 Checking system health...${NC}"
        exec ./scripts/utils/health-check.sh "$@"
        ;;
    diff)
        echo -e "${BLUE}📊 Checking infrastructure changes...${NC}"
        exec ./scripts/utils/diff.sh "$@"
        ;;
    setup-db)
        echo -e "${BLUE}🐘 Setting up local database...${NC}"
        exec ./scripts/utils/setup-local-db.sh "$@"
        ;;
    --help|-h|help)
        show_usage
        ;;
    *)
        echo -e "${RED}❌ Error: Unknown command: $COMMAND${NC}"
        show_usage
        exit 1
        ;;
esac
