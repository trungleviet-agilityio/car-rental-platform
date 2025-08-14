#!/bin/bash

# Car Rental Platform - Main Deployment Script
# Entry point for deployment operations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

show_usage() {
    echo -e "${BLUE}🚀 Car Rental Platform - Deployment Scripts${NC}"
    echo "=================================================="
    echo ""
    echo -e "${YELLOW}Usage: $0 <command> [options]${NC}"
    echo ""
    echo -e "${YELLOW}Commands:${NC}"
    echo "  deploy              Deploy complete infrastructure + configure backend"
    echo "  app                 Deploy app changes only (fast)"
    echo "  stack <name>        Deploy specific CDK stack"
    echo "  destroy             Destroy all infrastructure"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  $0 deploy                    # Complete deployment"
    echo "  $0 app                       # Fast app deployment"
    echo "  $0 stack CarRentalFargateStack  # Deploy specific stack"
    echo "  $0 destroy                   # Clean up infrastructure"
    echo ""
    echo -e "${YELLOW}For detailed help:${NC}"
    echo "  $0 deploy --help"
    echo "  $0 stack --help"
}

# Check if command is provided
if [ $# -eq 0 ]; then
    show_usage
    exit 1
fi

COMMAND=$1
shift

case $COMMAND in
    deploy)
        echo -e "${BLUE}🚀 Running complete deployment...${NC}"
        exec ./scripts/deploy/deploy.sh "$@"
        ;;
    app)
        echo -e "${BLUE}🐳 Running app deployment...${NC}"
        exec ./scripts/deploy/deploy-app.sh "$@"
        ;;
    stack)
        if [ $# -eq 0 ]; then
            echo -e "${RED}❌ Error: Stack name required${NC}"
            echo "Usage: $0 stack <stack-name> [options]"
            exit 1
        fi
        echo -e "${BLUE}📦 Running stack deployment...${NC}"
        exec ./scripts/deploy/deploy-stack.sh "$@"
        ;;
    destroy)
        echo -e "${BLUE}🗑️  Running infrastructure cleanup...${NC}"
        exec ./scripts/deploy/destroy.sh "$@"
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
