#!/bin/bash

# Car Rental Platform - Check All Stack Changes
# Shows what will change before deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CDK_DIR="cdk"
REGION="ap-southeast-1"
STACKS=("CarRentalStorageStack" "CarRentalFargateStack" "CarRentalAuthStack" "CarRentalApiStack")

echo -e "${BLUE}📋 Car Rental Platform - Stack Changes Review${NC}"
echo "=================================================="

# Check if we're in the right directory
if [ ! -d "$CDK_DIR" ]; then
    echo -e "${RED}❌ Error: CDK directory not found. Please run this script from the poc directory.${NC}"
    exit 1
fi

# Activate virtual environment
echo -e "${YELLOW}🔧 Activating CDK environment...${NC}"
cd "$CDK_DIR"
source .venv/bin/activate
export AWS_DEFAULT_REGION="$REGION"

echo -e "${YELLOW}🔍 Checking changes across all stacks...${NC}"
echo ""

HAS_CHANGES=false

for stack in "${STACKS[@]}"; do
    echo -e "${BLUE}--- $stack ---${NC}"
    
    # Run cdk diff and capture output
    DIFF_OUTPUT=$(cdk diff $stack 2>&1 || true)
    
    # Check if there are actual changes (not just "no changes")
    if echo "$DIFF_OUTPUT" | grep -q "There were no differences"; then
        echo -e "${GREEN}✅ No changes${NC}"
    elif echo "$DIFF_OUTPUT" | grep -q "Stack .* does not exist"; then
        echo -e "${YELLOW}⚠️  Stack does not exist - will be created${NC}"
        HAS_CHANGES=true
    else
        echo -e "${YELLOW}📝 Changes detected:${NC}"
        echo "$DIFF_OUTPUT"
        HAS_CHANGES=true
    fi
    echo ""
done

# Summary and recommendations
echo -e "${BLUE}📊 Summary and Recommendations:${NC}"
echo "=================================================="

if [ "$HAS_CHANGES" = true ]; then
    echo -e "${YELLOW}📝 Changes detected in one or more stacks${NC}"
    echo ""
    echo -e "${BLUE}🚀 Recommended deployment approaches:${NC}"
    echo ""
    echo -e "${GREEN}For app-only changes (backend/src):${NC}"
    echo "  ./scripts/deploy-app.sh"
    echo ""
    echo -e "${GREEN}For specific stack changes:${NC}"
    echo "  ./scripts/deploy-stack.sh <StackName>"
    echo ""
    echo -e "${GREEN}For infrastructure changes:${NC}"
    echo "  ./scripts/deploy.sh deploy [fast]"
    echo ""
    
    # Analyze change types and provide specific guidance
    echo -e "${BLUE}📋 Change Analysis:${NC}"
    
    # Check what files changed in git
    if git status --porcelain 2>/dev/null | grep -q .; then
        echo -e "${YELLOW}Git working directory changes:${NC}"
        git status --porcelain | while read -r line; do
            file=$(echo "$line" | awk '{print $2}')
            if [[ "$file" == backend/src/* ]]; then
                echo "  📱 App code: $file → Use deploy-app.sh"
            elif [[ "$file" == lambda/* ]]; then
                echo "  🔧 Lambda: $file → Use deploy-stack.sh ApiStack"
            elif [[ "$file" == cdk/stacks/* ]]; then
                stack_file=$(basename "$file" .py)
                case $stack_file in
                    "fargate_stack") echo "  🐳 Infrastructure: $file → Use deploy-stack.sh FargateStack" ;;
                    "auth_stack") echo "  🔐 Auth: $file → Use deploy-stack.sh AuthStack" ;;
                    "api_stack") echo "  🌐 API: $file → Use deploy-stack.sh ApiStack" ;;
                    "storage_stack") echo "  💾 Storage: $file → Use deploy-stack.sh StorageStack" ;;
                    *) echo "  ❓ Unknown: $file → Review manually" ;;
                esac
            else
                echo "  📄 Other: $file"
            fi
        done
    fi
else
    echo -e "${GREEN}✅ No changes detected in any stack${NC}"
    echo ""
    echo -e "${BLUE}💡 Deployment options:${NC}"
    echo "  - Infrastructure is up to date"
    echo "  - For app changes: ./scripts/deploy-app.sh"
    echo "  - For testing: ./scripts/smoke-test.sh"
fi

cd ..
