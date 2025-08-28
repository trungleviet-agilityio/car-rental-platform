# Prisma Setup Guide for Car Rental Platform

## Overview

This guide will help you set up Prisma ORM for the Car Rental Platform with a complete database schema including user management, vehicle rentals, bookings, payments, and more.

## 🚀 Quick Start

### 1. Automatic Setup (Recommended)

Run the automated setup script:

```bash
./scripts/setup-prisma.sh
```

This script will:
- Create `.env` file from `env.example`
- Check PostgreSQL connection
- Install dependencies
- Generate Prisma client
- Run database migrations
- Optionally seed the database

### 2. Manual Setup

If you prefer to set up manually, follow these steps:

#### Step 1: Environment Configuration

Copy the environment file:
```bash
cp env.example .env
```

Update the `.env` file with your database credentials:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/car_rental"
```

#### Step 2: Install Dependencies

```bash
npm install
```

#### Step 3: Generate Prisma Client

```bash
npx prisma generate
```

#### Step 4: Run Database Migration

```bash
npx prisma migrate dev --name init
```

#### Step 5: Seed Database (Optional)

```bash
npx prisma db seed
```

## 📊 Database Schema

### Core Models

#### User Management
- **User**: Complete user profiles with KYC, roles, and onboarding
- **OnboardingProgress**: Tracks user onboarding steps
- **KYCDocument**: Document verification and storage
- **PhoneVerification**: Phone number verification

#### Car Rental Business
- **Vehicle**: Car listings with detailed specifications
- **Booking**: Rental reservations and scheduling
- **Payment**: Payment processing and tracking
- **Review**: User reviews and ratings

#### System Features
- **Notification**: User notifications and messaging
- **NotificationTemplate**: Email/SMS templates
- **NotificationLog**: Delivery tracking
- **AuditLog**: System audit trail
- **SystemSetting**: Platform configuration

### Key Features

#### 🔐 Security & Compliance
- Soft deletes for data retention
- Comprehensive audit logging
- KYC document verification
- Phone number verification

#### 🚗 Vehicle Management
- Detailed vehicle specifications
- Location-based search
- Image and feature arrays
- Insurance information storage

#### 💳 Payment Processing
- Multiple payment types (rental fee, deposit, etc.)
- Payment status tracking
- Transaction history
- Support for multiple providers

#### 📱 Notifications
- Multi-channel delivery (email, SMS, push)
- Template-based messaging
- Delivery status tracking
- Retry mechanisms

## 🛠️ Available Scripts

```bash
# Prisma Commands
npm run prisma:generate    # Generate Prisma client
npm run prisma:migrate     # Run migrations
npm run prisma:studio      # Open Prisma Studio
npm run prisma:seed        # Seed database

# Development
npm run setup:dev          # Complete development setup
npm run start:dev          # Start development server
```

## 🔍 Database Exploration

### Prisma Studio

Launch Prisma Studio to explore your database visually:

```bash
npx prisma studio
```

This opens a web interface at `http://localhost:5555` where you can:
- Browse all tables
- View and edit data
- Run queries
- Export data

### Database Queries

Example queries using Prisma:

```typescript
// Find available vehicles
const availableVehicles = await prisma.vehicle.findMany({
  where: {
    status: 'AVAILABLE',
    deletedAt: null
  },
  include: {
    owner: true
  }
});

// Get user bookings with vehicle details
const userBookings = await prisma.booking.findMany({
  where: {
    renterId: userId,
    deletedAt: null
  },
  include: {
    vehicle: true,
    payments: true,
    reviews: true
  }
});

// Get platform statistics
const stats = await prisma.$transaction([
  prisma.user.count(),
  prisma.vehicle.count(),
  prisma.booking.count(),
  prisma.payment.aggregate({
    _sum: { amount: true }
  })
]);
```

## 📈 Performance Optimization

### Indexes

The schema includes strategic indexes for optimal performance:

- **User queries**: email, phoneNumber, kycStatus, role
- **Vehicle search**: make/model, status, dailyRate, location
- **Booking queries**: vehicleId, renterId, date ranges, status
- **Payment tracking**: bookingId, status, transactionId
- **Notifications**: userId, type, priority, read status

### Query Optimization Tips

1. **Use includes sparingly**: Only include relations you need
2. **Leverage indexes**: Query on indexed fields
3. **Use transactions**: For related operations
4. **Pagination**: Use `skip` and `take` for large datasets

## 🔧 Configuration

### Environment Variables

Key environment variables for Prisma:

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# Individual database config (for app config)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=car_rental
DB_SSL=false
```

### Prisma Service Configuration

The `PrismaService` is configured with:
- Query logging in development
- Error handling and reconnection
- Soft delete utilities
- Transaction helpers
- Health check methods

## 🧪 Testing

### Database Testing

For testing, you can use:

```bash
# Reset database for testing
npx prisma migrate reset

# Run tests
npm run test

# E2E tests
npm run test:e2e
```

### Sample Data

The seed script creates:
- 3 sample users (renter, owner, admin)
- 3 sample vehicles (sedan, SUV, electric)
- Sample bookings and payments
- Notification templates
- System settings

## 🚨 Troubleshooting

### Common Issues

1. **Connection refused**: Check if PostgreSQL is running
2. **Migration failed**: Ensure DATABASE_URL is correct
3. **Client not generated**: Run `npx prisma generate`
4. **Permission denied**: Check database user permissions

### Reset Database

To completely reset the database:

```bash
npx prisma migrate reset
```

This will:
- Drop all tables
- Re-run all migrations
- Seed the database (if seed script is configured)

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [NestJS Prisma Integration](https://docs.nestjs.com/techniques/database)

## 🤝 Contributing

When making schema changes:

1. Create a new migration: `npx prisma migrate dev --name description`
2. Update the seed script if needed
3. Test the migration on a fresh database
4. Update this documentation

---

**Note**: Always backup your database before running migrations in production!
