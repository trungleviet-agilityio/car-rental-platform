# 🚗 Car Rental Platform

A comprehensive full-stack car rental platform built with NestJS, Prisma, PostgreSQL, and AWS services. Features a complete 4-phase user onboarding flow, geospatial vehicle tracking, and secure payment processing.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.x-red.svg)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://docker.com/)

## 🌟 Features

### **Core Functionality**
- **🔐 4-Phase User Onboarding**: Registration → Phone Verification → Profile Completion → KYC
- **🚗 Vehicle Management**: Listings with geospatial locations and real-time availability
- **📱 Smart Booking System**: Multi-location pickup/dropoff with hub integration
- **💳 Payment Processing**: Secure transactions with Stripe integration
- **📍 Geospatial Integration**: PostGIS for location-based services
- **🔔 Multi-channel Notifications**: Email, SMS, and in-app notifications

### **Technical Highlights**
- **🏗️ Clean Architecture**: Domain-driven design with proper separation of concerns
- **🐳 Full Docker Support**: Development and production environments
- **📊 Comprehensive Database**: 13 tables following enterprise ERD design
- **🔒 JWT Authentication**: Secure API access with role-based permissions
- **📈 Observability**: Health checks, logging, and monitoring ready
- **🎯 API Documentation**: Auto-generated Swagger/OpenAPI docs

## 🚀 Quick Start

### Prerequisites
- Node.js 20.x or higher
- Docker & Docker Compose
- PostgreSQL 15+ (or use Docker)
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd car-rental-platform

# Install dependencies
npm install

# Start with Docker (Recommended)
./scripts/docker-dev.sh start
./scripts/docker-dev.sh setup-db

# Or start locally
cp env.example .env
npm run start:dev
```

### Access Points
- **🚗 API Server**: http://localhost:3000
- **📚 API Documentation**: http://localhost:3000/api/docs
- **🐘 Database Admin**: http://localhost:5050 (admin@carrentals.local / admin123)
- **🔴 Redis Monitor**: http://localhost:8081 (admin / admin123)

## 📚 Documentation

### **Getting Started**
- [🏃 Quick Start Guide](docs/setup/GETTING_STARTED.md)
- [🐳 Docker Setup](docs/setup/DOCKER_SETUP.md)
- [⚙️ Environment Configuration](docs/setup/ENVIRONMENT.md)

### **Development**
- [🏗️ Architecture Overview](docs/architecture/ARCHITECTURE.md)
- [🗄️ Database Design](docs/database/DATABASE_DESIGN.md)
- [🔄 User Onboarding Flow](docs/guides/USER_ONBOARDING_FLOW.md)
- [🧪 Testing Guide](docs/development/TESTING.md)

### **Integration Guides**
- [📱 Twilio Setup](docs/setup/TWILIO_SETUP.md)
- [☁️ AWS Services](docs/setup/AWS_SETUP.md)
- [⚡ Step Functions](docs/setup/STEP_FUNCTIONS_SETUP.md)
- [💳 Payment Integration](docs/setup/STRIPE_SETUP.md)

### **API Reference**
- [📖 API Documentation](docs/api/API_REFERENCE.md)
- [🔗 Postman Collection](docs/api/postman/)
- [🔐 Authentication](docs/api/AUTHENTICATION.md)

### **Deployment**
- [🚀 Production Deployment](docs/deployment/PRODUCTION.md)
- [🔧 CI/CD Setup](docs/deployment/CICD.md)
- [📊 Monitoring](docs/deployment/MONITORING.md)

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (Future)      │◄──►│   (NestJS)      │◄──►│   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   AWS Services  │
                       │ • Cognito       │
                       │ • Step Functions│
                       │ • S3            │
                       │ • SES           │
                       └─────────────────┘
```

### **Technology Stack**
- **Backend**: NestJS, TypeScript, Prisma ORM
- **Database**: PostgreSQL 15 with PostGIS
- **Cache**: Redis
- **Authentication**: AWS Cognito + JWT
- **File Storage**: AWS S3
- **Workflows**: AWS Step Functions
- **Notifications**: Twilio (SMS) + AWS SES (Email)
- **Payments**: Stripe
- **Deployment**: Docker, Docker Compose

## 🧪 Testing

```bash
# Run all tests
npm test

# Test specific functionality
./test-complete-onboarding-flow.sh
./test-phase1.sh

# Test with Docker
./scripts/docker-dev.sh start
./scripts/docker-dev.sh setup-db
```

## 📊 Database Schema

Our database follows enterprise-grade design principles with 13 core tables:

- **Users & Authentication**: `users`, `phone_verifications`
- **Vehicle Management**: `vehicles`, `hubs`
- **Booking System**: `bookings`, `trips`
- **Payment Processing**: `payments`, `payment_transactions`
- **Review System**: `reviews`, `vehicle_reviews`
- **Communication**: `notifications`, `notification_templates`
- **System Management**: `audit_logs`, `system_settings`

[View Complete ERD](docs/database/ONBOARDING_ERD.d2)

## 🔧 Development

### **Project Structure**
```
src/
├── modules/          # Feature modules
│   ├── auth/         # Authentication & onboarding
│   ├── users/        # User management
│   └── kyc/          # KYC processing
├── core/             # Domain logic
│   ├── entities/     # Business entities
│   ├── interfaces/   # Service contracts
│   └── enums/        # Shared enums
├── infrastructure/   # External services
├── shared/           # Shared utilities
└── config/           # Configuration
```

### **Key Commands**
```bash
# Quick Setup
./scripts.sh setup              # Complete environment setup
./scripts.sh dev start          # Start development environment
./scripts.sh test               # Test onboarding flow

# Development
./scripts.sh dev start          # Start Docker services
./scripts.sh dev logs api       # View API logs
./scripts.sh dev shell          # Shell into container
./scripts.sh dev setup-db       # Setup database

# Testing
./scripts.sh test               # Complete onboarding flow test
./scripts.sh test-phase1        # Test Phase 1 only
./scripts.sh verify             # Verify implementation

# Direct npm commands
npm run start:dev               # Start development server
npm run build                   # Build for production
npm test                        # Run unit tests
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### **Development Guidelines**
- Follow TypeScript strict mode
- Use conventional commits
- Write tests for new features
- Update documentation
- Follow clean architecture principles

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **📖 Documentation**: [docs/](docs/)
- **🐛 Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)

## 🗺️ Roadmap

### **Phase 1** ✅ **Completed**
- [x] User onboarding flow
- [x] Database design and implementation
- [x] Docker development environment
- [x] Basic API endpoints

### **Phase 2** 🔄 **In Progress**
- [ ] Frontend React application
- [ ] Real-time notifications
- [ ] Advanced search and filtering
- [ ] Mobile app (React Native)

### **Phase 3** 📋 **Planned**
- [ ] Analytics dashboard
- [ ] Admin panel
- [ ] Multi-tenancy support
- [ ] Advanced reporting

---

**Built with ❤️ by the Car Rental Platform Team**

*Ready to revolutionize car rentals? Let's build something amazing together!* 🚀