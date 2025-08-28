import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create sample users
  const user1 = await prisma.user.upsert({
    where: { email: 'john.doe@example.com' },
    update: {},
    create: {
      cognitoSub: 'cognito-sub-1',
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '+1234567890',
      role: 'RENTER',
      kycStatus: 'VERIFIED',
      isActive: true,
      emailVerified: true,
      profileCompleted: true,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'jane.smith@example.com' },
    update: {},
    create: {
      cognitoSub: 'cognito-sub-2',
      email: 'jane.smith@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      phoneNumber: '+0987654321',
      role: 'OWNER',
      kycStatus: 'VERIFIED',
      isActive: true,
      emailVerified: true,
      profileCompleted: true,
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: 'admin@carrental.com' },
    update: {},
    create: {
      cognitoSub: 'cognito-sub-admin',
      email: 'admin@carrental.com',
      firstName: 'Admin',
      lastName: 'User',
      phoneNumber: '+1111111111',
      role: 'ADMIN',
      kycStatus: 'VERIFIED',
      isActive: true,
      emailVerified: true,
      profileCompleted: true,
    },
  });

  // Create sample vehicles
  const vehicle1 = await prisma.vehicle.create({
    data: {
      ownerId: user2.id,
      make: 'Toyota',
      model: 'Camry',
      year: 2022,
      licensePlate: 'ABC123',
      seats: 5,
      dailyPriceCents: 7500, // $75.00
      hourlyPriceCents: 1500, // $15.00
      depositCents: 5000, // $50.00
      fuelType: 'GASOLINE',
      transmission: 'AUTOMATIC',
      location: 'POINT(-74.0060 40.7128)', // PostGIS format
      address: 'Downtown Manhattan',
      isAvailable: true,
      photos: ['https://example.com/camry1.jpg', 'https://example.com/camry2.jpg'],
      features: ['GPS', 'Bluetooth', 'Backup Camera', 'Heated Seats'],
      insuranceDetails: {
        provider: 'State Farm',
        policyNumber: 'SF123456',
        coverage: 'Comprehensive'
      }
    },
  });

  const vehicle2 = await prisma.vehicle.create({
    data: {
      ownerId: user2.id,
      make: 'Honda',
      model: 'CR-V',
      year: 2023,
      licensePlate: 'XYZ789',
      seats: 5,
      dailyPriceCents: 8500, // $85.00
      hourlyPriceCents: 1800, // $18.00
      depositCents: 6000, // $60.00
      fuelType: 'HYBRID',
      transmission: 'AUTOMATIC',
      location: 'POINT(-73.7781 40.6413)', // PostGIS format
      address: 'JFK Airport',
      isAvailable: true,
      photos: ['https://example.com/crv1.jpg', 'https://example.com/crv2.jpg'],
      features: ['GPS', 'Bluetooth', 'AWD', 'Roof Rack'],
      insuranceDetails: {
        provider: 'Allstate',
        policyNumber: 'AL789012',
        coverage: 'Comprehensive'
      }
    },
  });

  const vehicle3 = await prisma.vehicle.create({
    data: {
      ownerId: user3.id,
      make: 'Tesla',
      model: 'Model 3',
      year: 2023,
      licensePlate: 'TESLA1',
      seats: 5,
      dailyPriceCents: 12000, // $120.00
      hourlyPriceCents: 2500, // $25.00
      depositCents: 8000, // $80.00
      fuelType: 'ELECTRIC',
      transmission: 'AUTOMATIC',
      location: 'POINT(-74.0060 40.7128)', // PostGIS format
      address: 'Downtown Manhattan',
      isAvailable: true,
      photos: ['https://example.com/tesla1.jpg', 'https://example.com/tesla2.jpg'],
      features: ['Autopilot', 'Supercharging', 'Glass Roof', 'Premium Audio'],
      insuranceDetails: {
        provider: 'Geico',
        policyNumber: 'GC345678',
        coverage: 'Comprehensive'
      }
    },
  });

  // Create sample bookings
  const booking1 = await prisma.booking.create({
    data: {
      vehicleId: vehicle1.id,
      renterId: user1.id,
      ownerId: user2.id,
      startDatetime: new Date('2024-01-15T10:00:00Z'),
      endDatetime: new Date('2024-01-17T10:00:00Z'),
      totalAmountCents: 15000, // $150.00
      commissionCents: 1500, // $15.00
      status: 'COMPLETED',
      pickupLocation: 'POINT(-74.0060 40.7128)',
      returnLocation: 'POINT(-73.7781 40.6413)',
      pricingBreakdown: {
        rental_fee: 15000,
        deposit: 5000,
        commission: 1500
      }
    },
  });

  const booking2 = await prisma.booking.create({
    data: {
      vehicleId: vehicle2.id,
      renterId: user1.id,
      ownerId: user2.id,
      startDatetime: new Date('2024-02-01T14:00:00Z'),
      endDatetime: new Date('2024-02-03T14:00:00Z'),
      totalAmountCents: 17000, // $170.00
      commissionCents: 1700, // $17.00
      status: 'CONFIRMED',
      pickupLocation: 'POINT(-73.7781 40.6413)',
      returnLocation: 'POINT(-74.0060 40.7128)',
      pricingBreakdown: {
        rental_fee: 17000,
        deposit: 6000,
        commission: 1700
      }
    },
  });

  // Create sample payments
  await prisma.payment.create({
    data: {
      bookingId: booking1.id,
      paymentType: 'RENTAL_FEE',
      amountCents: 15000, // $150.00 in cents
      commissionCents: 1500, // 10% commission
      netPayoutCents: 13500,
      paymentStatus: 'SUCCEEDED',
      paymentMethod: 'CARD',
      processedAt: new Date(),
    },
  });

  await prisma.payment.create({
    data: {
      bookingId: booking1.id,
      paymentSequence: 2, // Second payment for this booking
      paymentType: 'DEPOSIT',
      amountCents: 5000, // $50.00 in cents
      commissionCents: 500, // 10% commission
      netPayoutCents: 4500,
      paymentStatus: 'SUCCEEDED',
      paymentMethod: 'CARD',
      processedAt: new Date(),
    },
  });

  // Create sample reviews
  await prisma.review.create({
    data: {
      bookingId: booking1.id,
      reviewerId: user1.id,
      revieweeId: user2.id, // Owner being reviewed
      reviewType: 'RENTER_TO_OWNER',
      rating: 5,
      reviewText: 'Great car, very clean and well-maintained. Owner was very professional.',
      isPublic: true,
      helpfulVotes: 2,
    },
  });

  // Create sample notification templates
  await prisma.notificationTemplate.upsert({
    where: { name: 'booking_confirmation' },
    update: {},
    create: {
      name: 'booking_confirmation',
      type: 'email',
      subject: 'Your booking has been confirmed',
      body: 'Hi {{firstName}}, your booking for {{vehicleMake}} {{vehicleModel}} has been confirmed. Pickup: {{pickupDate}} at {{pickupLocation}}.',
      variables: ['firstName', 'vehicleMake', 'vehicleModel', 'pickupDate', 'pickupLocation'],
    },
  });

  await prisma.notificationTemplate.upsert({
    where: { name: 'payment_success' },
    update: {},
    create: {
      name: 'payment_success',
      type: 'email',
      subject: 'Payment successful',
      body: 'Hi {{firstName}}, your payment of {{amount}} has been processed successfully.',
      variables: ['firstName', 'amount'],
    },
  });

  // Create sample system settings
  await prisma.systemSetting.upsert({
    where: { key: 'platform_commission_rate' },
    update: {},
    create: {
      key: 'platform_commission_rate',
      value: 0.10, // 10% commission
      description: 'Platform commission rate for bookings',
      isPublic: false,
    },
  });

  await prisma.systemSetting.upsert({
    where: { key: 'max_booking_days' },
    update: {},
    create: {
      key: 'max_booking_days',
      value: 30,
      description: 'Maximum number of days for a single booking',
      isPublic: true,
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log(`Created ${await prisma.user.count()} users`);
  console.log(`Created ${await prisma.vehicle.count()} vehicles`);
  console.log(`Created ${await prisma.booking.count()} bookings`);
  console.log(`Created ${await prisma.payment.count()} payments`);
  console.log(`Created ${await prisma.review.count()} reviews`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
