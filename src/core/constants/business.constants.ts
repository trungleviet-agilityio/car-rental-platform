/**
 * Business Constants
 * Core business rules and configuration used throughout the application
 */

export const BUSINESS_RULES = {
  // Commission and fees
  COMMISSION: {
    DEFAULT_RATE: 15, // 15% commission
    MIN_RATE: 5,
    MAX_RATE: 30,
    OWNER_RATE: 85, // Owner gets 85% after commission
  },
  
  // Hub discounts
  HUB_DISCOUNT: {
    DEFAULT_RATE: 10, // 10% discount for hub usage
    MIN_RATE: 0,
    MAX_RATE: 25,
  },
  
  // Payment processing
  PAYMENT: {
    STRIPE_FEE_RATE: 2.9, // 2.9% + $0.30
    STRIPE_FIXED_FEE_CENTS: 30,
    DEPOSIT_MULTIPLIER: 2, // Deposit is 2x daily rate
    REFUND_PROCESSING_DAYS: 5,
    CHARGEBACK_FEE_CENTS: 1500, // $15
  },
  
  // Booking rules
  BOOKING: {
    CANCELLATION: {
      FREE_CANCELLATION_HOURS: 24, // Free cancellation up to 24 hours
      PARTIAL_REFUND_HOURS: 12, // 50% refund up to 12 hours
      NO_REFUND_HOURS: 2, // No refund less than 2 hours
      PARTIAL_REFUND_RATE: 50, // 50% refund rate
    },
    MODIFICATION: {
      FREE_MODIFICATION_HOURS: 12, // Free modification up to 12 hours
      MODIFICATION_FEE_CENTS: 500, // $5 modification fee
    },
    AUTO_CONFIRM_HOURS: 2, // Auto-confirm bookings within 2 hours
    GRACE_PERIOD_MINUTES: 15, // 15-minute grace period for pickup
  },
  
  // Trip and vehicle rules
  TRIP: {
    LATE_RETURN: {
      GRACE_PERIOD_MINUTES: 30, // 30-minute grace period
      HOURLY_PENALTY_CENTS: 500, // $5 per hour late
      MAX_PENALTY_HOURS: 24, // Maximum 24 hours penalty
    },
    FUEL: {
      LOW_FUEL_THRESHOLD: 0.25, // Below 25% fuel
      FUEL_PENALTY_PER_TENTH: 1000, // $10 per 0.1 fuel level
      FULL_TANK_THRESHOLD: 0.9, // Above 90% is considered full
    },
    MILEAGE: {
      DAILY_MILEAGE_LIMIT: 200, // 200 miles per day
      EXCESS_MILEAGE_CENTS_PER_MILE: 25, // $0.25 per excess mile
    },
    DAMAGE: {
      BASE_DAMAGE_FEE_CENTS: 5000, // $50 base damage assessment fee
      MINOR_DAMAGE_THRESHOLD_CENTS: 10000, // $100
      MAJOR_DAMAGE_THRESHOLD_CENTS: 50000, // $500
    },
  },
  
  // KYC and verification
  KYC: {
    VERIFICATION_EXPIRY_DAYS: 365, // KYC documents expire after 1 year
    MAX_VERIFICATION_ATTEMPTS: 3,
    MANUAL_REVIEW_THRESHOLD: 70, // Below 70% confidence requires manual review
    AUTO_APPROVE_THRESHOLD: 90, // Above 90% confidence auto-approves
  },
  
  // User and rating system
  USER: {
    MIN_RATING_TO_RENT: 3.0, // Minimum 3.0 rating to rent vehicles
    MIN_TRIPS_FOR_RATING: 3, // Need 3 trips before rating is displayed
    SUSPENSION_RATING_THRESHOLD: 2.0, // Below 2.0 rating triggers review
    MAX_CONSECUTIVE_CANCELLATIONS: 3, // Max 3 consecutive cancellations
  },
  
  // Review system
  REVIEW: {
    REVIEW_WINDOW_HOURS: 168, // 7 days to leave a review
    RESPONSE_WINDOW_HOURS: 72, // 3 days to respond to a review
    MODERATION_THRESHOLD: 3, // 3 reports trigger moderation
    AUTO_HIDE_RATING_THRESHOLD: 1, // Rating of 1 triggers auto-moderation
  },
  
  // Notification settings
  NOTIFICATION: {
    RETRY_INTERVALS_MINUTES: [5, 15, 60, 240, 1440], // Retry intervals
    URGENT_RETRY_INTERVALS_MINUTES: [1, 3, 10, 30], // Urgent notification retries
    EXPIRY_HOURS: {
      URGENT: 4,
      HIGH: 24,
      NORMAL: 72,
      LOW: 168,
    },
    BATCH_SIZE: 100, // Process notifications in batches of 100
  },
  
  // Geographic and location
  LOCATION: {
    MAX_SEARCH_RADIUS_MILES: 50, // Maximum search radius
    DEFAULT_SEARCH_RADIUS_MILES: 10, // Default search radius
    HUB_PROXIMITY_THRESHOLD_MILES: 2, // Within 2 miles of hub for discount
    GEOFENCE_RADIUS_METERS: 100, // 100m geofence for pickup/return
  },
  
  // Vehicle availability
  AVAILABILITY: {
    BOOKING_BUFFER_HOURS: 1, // 1-hour buffer between bookings
    MAINTENANCE_BUFFER_HOURS: 2, // 2-hour buffer for maintenance
    CLEANING_TIME_MINUTES: 30, // 30 minutes cleaning time
    INSPECTION_TIME_MINUTES: 15, // 15 minutes inspection time
  },
  
  // Platform limits
  LIMITS: {
    MAX_VEHICLES_PER_OWNER: 50, // Maximum vehicles per owner
    MAX_ACTIVE_BOOKINGS_PER_USER: 5, // Maximum active bookings
    MAX_DAILY_BOOKINGS: 3, // Maximum bookings per day per user
    MAX_PHOTOS_PER_VEHICLE: 10, // Maximum photos per vehicle
    MAX_DOCUMENTS_PER_USER: 20, // Maximum KYC documents per user
  },
} as const;

export const PRICING_MODELS = {
  // Dynamic pricing factors
  SURGE_PRICING: {
    WEEKEND_MULTIPLIER: 1.2, // 20% increase on weekends
    HOLIDAY_MULTIPLIER: 1.5, // 50% increase on holidays
    HIGH_DEMAND_MULTIPLIER: 1.3, // 30% increase during high demand
    PEAK_HOURS: [16, 17, 18, 19, 20], // 4 PM - 8 PM
    PEAK_MULTIPLIER: 1.1, // 10% increase during peak hours
  },
  
  // Discount models
  DISCOUNTS: {
    FIRST_TIME_USER: 20, // 20% discount for first-time users
    LOYAL_USER_THRESHOLD: 10, // 10+ trips
    LOYAL_USER_DISCOUNT: 15, // 15% discount for loyal users
    BULK_BOOKING_THRESHOLD: 7, // 7+ days
    BULK_BOOKING_DISCOUNT: 25, // 25% discount for bulk bookings
    LAST_MINUTE_THRESHOLD_HOURS: 2, // Within 2 hours
    LAST_MINUTE_DISCOUNT: 10, // 10% discount for last-minute bookings
  },
} as const;

// Status transitions will be implemented in Phase 2+
export const STATUS_TRANSITIONS = {
  // Will be implemented when we add booking/payment functionality
} as const;
