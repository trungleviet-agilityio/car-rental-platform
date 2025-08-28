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
      vin: '1HGBH41JXMN109186',
      color: 'Silver',
      mileage: 15000,
      fuelType: 'GASOLINE',
      transmission: 'AUTOMATIC',
      seats: 5,
      dailyRate: 75.00,
      hourlyRate: 15.00,
      status: 'AVAILABLE',
      location: 'Downtown',
      latitude: 40.7128,
      longitude: -74.0060,
      description: 'Comfortable sedan perfect for city driving',
      features: ['GPS', 'Bluetooth', 'Backup Camera', 'Heated Seats'],
      images: [
        'https://example.com/camry1.jpg',
        'https://example.com/camry2.jpg'
      ],
    },
  });

  const vehicle2 = await prisma.vehicle.create({
    data: {
      ownerId: user2.id,
      make: 'Honda',
      model: 'CR-V',
      year: 2023,
      licensePlate: 'XYZ789',
      vin: '2T1BURHE0JC123456',
      color: 'Blue',
      mileage: 8000,
      fuelType: 'HYBRID',
      transmission: 'AUTOMATIC',
      seats: 5,
      dailyRate: 85.00,
      hourlyRate: 18.00,
      status: 'AVAILABLE',
      location: 'Airport',
      latitude: 40.6413,
      longitude: -73.7781,
      description: 'Spacious SUV with great fuel efficiency',
      features: ['GPS', 'Bluetooth', 'AWD', 'Roof Rack'],
      images: [
        'https://example.com/crv1.jpg',
        'https://example.com/crv2.jpg'
      ],
    },
  });

  const vehicle3 = await prisma.vehicle.create({
    data: {
      ownerId: user3.id,
      make: 'Tesla',
      model: 'Model 3',
      year: 2023,
      licensePlate: 'TESLA1',
      vin: '5YJ3E1EA0PF123456',
      color: 'White',
      mileage: 5000,
      fuelType: 'ELECTRIC',
      transmission: 'AUTOMATIC',
      seats: 5,
      dailyRate: 120.00,
      hourlyRate: 25.00,
      status: 'AVAILABLE',
      location: 'Downtown',
      latitude: 40.7128,
      longitude: -74.0060,
      description: 'Electric vehicle with autopilot capabilities',
      features: ['Autopilot', 'Supercharging', 'Glass Roof', 'Premium Audio'],
      images: [
        'https://example.com/tesla1.jpg',
        'https://example.com/tesla2.jpg'
      ],
    },
  });

  // Create sample bookings
  const booking1 = await prisma.booking.create({
    data: {
      vehicleId: vehicle1.id,
      renterId: user1.id,
      startDate: new Date('2024-01-15T10:00:00Z'),
      endDate: new Date('2024-01-17T10:00:00Z'),
      totalAmount: 150.00,
      depositAmount: 50.00,
      status: 'COMPLETED',
      pickupLocation: 'Downtown',
      dropoffLocation: 'Airport',
      pickupLatitude: 40.7128,
      pickupLongitude: -74.0060,
      dropoffLatitude: 40.6413,
      dropoffLongitude: -73.7781,
    },
  });

  const booking2 = await prisma.booking.create({
    data: {
      vehicleId: vehicle2.id,
      renterId: user1.id,
      startDate: new Date('2024-02-01T14:00:00Z'),
      endDate: new Date('2024-02-03T14:00:00Z'),
      totalAmount: 170.00,
      depositAmount: 60.00,
      status: 'CONFIRMED',
      pickupLocation: 'Airport',
      dropoffLocation: 'Downtown',
      pickupLatitude: 40.6413,
      pickupLongitude: -73.7781,
      dropoffLatitude: 40.7128,
      dropoffLongitude: -74.0060,
    },
  });

  // Create sample payments
  await prisma.payment.create({
    data: {
      bookingId: booking1.id,
      amount: 150.00,
      type: 'RENTAL_FEE',
      status: 'SUCCEEDED',
      transactionId: 'txn_123456789',
      provider: 'stripe',
      currency: 'USD',
    },
  });

  await prisma.payment.create({
    data: {
      bookingId: booking1.id,
      amount: 50.00,
      type: 'DEPOSIT',
      status: 'SUCCEEDED',
      transactionId: 'txn_123456790',
      provider: 'stripe',
      currency: 'USD',
    },
  });

  // Create sample reviews
  await prisma.review.create({
    data: {
      bookingId: booking1.id,
      reviewerId: user1.id,
      rating: 5,
      comment: 'Great car, very clean and well-maintained. Owner was very professional.',
      isPublic: true,
      helpfulCount: 2,
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
