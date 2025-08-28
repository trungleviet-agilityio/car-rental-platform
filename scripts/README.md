# 🛠️ Scripts Directory

Professional script collection for the Car Rental Platform. All scripts are organized by category and purpose.

## 📁 Script Organization

```
scripts/
├── setup/           # 🔧 Environment and project setup
├── development/     # 💻 Development workflow tools
├── testing/         # 🧪 Testing and validation scripts
├── deployment/      # 🚀 Deployment automation (planned)
└── README.md        # This documentation
```

## 🚀 Quick Start

### **Environment Setup**
```bash
# Complete development environment setup
./scripts/setup/setup-dev.sh

# Database setup only
./scripts/setup/setup-prisma.sh

# Docker development environment
./scripts/development/docker-dev.sh start
```

### **Testing**
```bash
# Test complete onboarding flow
./scripts/testing/test-complete-onboarding-flow.sh
```

### **Development**
```bash
# Start Docker development environment
./scripts/development/docker-dev.sh start

# View logs
./scripts/development/docker-dev.sh logs api

# Development setup
./scripts/development/docker-dev.sh setup-db
```

## 📋 Script Categories

### **🔧 Setup Scripts**
Scripts for initial project setup and configuration.

| Script | Purpose | Usage |
|--------|---------|-------|
| [`setup-dev.sh`](setup/setup-dev.sh) | Complete development environment setup | `./scripts/setup/setup-dev.sh` |
| [`setup-prisma.sh`](setup/setup-prisma.sh) | Database and Prisma configuration | `./scripts/setup/setup-prisma.sh` |

### **💻 Development Scripts**
Daily development workflow tools.

| Script | Purpose | Usage |
|--------|---------|-------|
| [`docker-dev.sh`](development/docker-dev.sh) | Docker development environment management | `./scripts/development/docker-dev.sh [command]` |

### **🧪 Testing Scripts**
Testing and validation automation.

| Script | Purpose | Usage |
|--------|---------|-------|
| [`test-complete-onboarding-flow.sh`](testing/test-complete-onboarding-flow.sh) | Complete 4-phase onboarding test | `./scripts/testing/test-complete-onboarding-flow.sh` |

### **🚀 Deployment Scripts**
*(Planned for future releases)*

| Script | Purpose | Usage |
|--------|---------|-------|
| `deploy-staging.sh` | Deploy to staging environment | *(Coming Soon)* |
| `deploy-production.sh` | Deploy to production | *(Coming Soon)* |
| `rollback.sh` | Rollback deployment | *(Coming Soon)* |

### **🔨 Maintenance Commands**
Built-in maintenance through npm scripts and script manager.

| Command | Purpose | Usage |
|---------|---------|-------|
| `./scripts.sh lint` | Run TypeScript linting | `./scripts.sh lint` |
| `./scripts.sh format` | Format code with Prettier | `./scripts.sh format` |

## 🔧 Script Standards

### **Naming Convention**
- **Kebab-case**: `setup-dev.sh`, `docker-dev.sh`
- **Descriptive**: Clear purpose from name
- **Categorized**: Organized by function

### **Script Structure**
```bash
#!/bin/bash

# Script Name - Brief Description
# Detailed description of what the script does

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Main script logic
main() {
    print_status "Starting script..."
    # Script implementation
}

# Execute main function
main "$@"
```

### **Best Practices**
- ✅ **Error Handling**: Use `set -e` and proper error messages
- ✅ **Colored Output**: Consistent color scheme for status messages
- ✅ **Documentation**: Clear comments and usage examples
- ✅ **Validation**: Check prerequisites before execution
- ✅ **Idempotent**: Safe to run multiple times

## 🎯 Usage Examples

### **Complete Development Setup**
```bash
# 1. Clone the repository
git clone <repository-url>
cd car-rental-platform

# 2. Run complete setup
./scripts/setup/setup-dev.sh

# 3. Start development environment
./scripts/development/docker-dev.sh start

# 4. Test the implementation
./scripts/testing/test-complete-onboarding-flow.sh
```

### **Docker Development Workflow**
```bash
# Start all services
./scripts/development/docker-dev.sh start

# Setup database
./scripts/development/docker-dev.sh setup-db

# View API logs
./scripts/development/docker-dev.sh logs api

# Open shell in container
./scripts/development/docker-dev.sh shell

# Stop all services
./scripts/development/docker-dev.sh stop
```

### **Testing Workflow**
```bash
# Test complete onboarding flow
./scripts/testing/test-complete-onboarding-flow.sh

# Run linting
./scripts.sh lint

# Format code
./scripts.sh format
```

## 🔒 Security Considerations

### **Environment Variables**
- Scripts use `.env` files for configuration
- Sensitive data never hardcoded
- Production secrets handled separately

### **Permissions**
```bash
# Make scripts executable
chmod +x scripts/**/*.sh

# Or individually
chmod +x scripts/setup/setup-dev.sh
```

## 🛠️ Troubleshooting

### **Common Issues**

1. **Permission Denied**
   ```bash
   chmod +x scripts/path/to/script.sh
   ```

2. **Docker Not Running**
   ```bash
   # Start Docker Desktop or Docker daemon
   sudo systemctl start docker
   ```

3. **Port Conflicts**
   ```bash
   # Check what's using the port
   lsof -i :3000
   
   # Stop conflicting services
   ./scripts/development/docker-dev.sh stop
   ```

### **Debug Mode**
```bash
# Run scripts with debug output
bash -x ./scripts/setup/setup-dev.sh
```

## 📝 Contributing

### **Adding New Scripts**
1. Choose appropriate category directory
2. Follow naming conventions
3. Include proper header comments
4. Add to this README
5. Test thoroughly

### **Script Template**
```bash
#!/bin/bash

# Your Script Name - Brief Description
# Detailed description and usage instructions

set -e

# Import common functions (optional)
# source "$(dirname "$0")/../common/functions.sh"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Helper functions
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Main function
main() {
    echo "Script starting..."
    # Your implementation here
}

# Execute
main "$@"
```

---

**🛠️ Scripts are ready for professional development workflows!**

*For issues or improvements, please check the [troubleshooting guide](../docs/troubleshooting/) or open an issue.*
