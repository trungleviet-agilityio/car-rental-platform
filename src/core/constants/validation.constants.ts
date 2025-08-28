/**
 * Validation Constants
 * Core validation rules and constraints used throughout the application
 */

export const VALIDATION_RULES = {
  // User validation
  USER: {
    EMAIL_MAX_LENGTH: 255,
    PHONE_MIN_LENGTH: 10,
    PHONE_MAX_LENGTH: 15,
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_MAX_LENGTH: 128,
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 50,
    USERNAME_MIN_LENGTH: 3,
    USERNAME_MAX_LENGTH: 30,
  },
  
  // Vehicle validation
  VEHICLE: {
    MAKE_MIN_LENGTH: 2,
    MAKE_MAX_LENGTH: 50,
    MODEL_MIN_LENGTH: 2,
    MODEL_MAX_LENGTH: 50,
    YEAR_MIN: 1900,
    YEAR_MAX: new Date().getFullYear() + 1,
    SEATS_MIN: 1,
    SEATS_MAX: 15,
    LICENSE_PLATE_MIN_LENGTH: 2,
    LICENSE_PLATE_MAX_LENGTH: 15,
    HOURLY_RATE_MIN_CENTS: 500, // $5
    HOURLY_RATE_MAX_CENTS: 10000, // $100
    DAILY_RATE_MIN_CENTS: 2000, // $20
    DAILY_RATE_MAX_CENTS: 50000, // $500
    DEPOSIT_MIN_CENTS: 0,
    DEPOSIT_MAX_CENTS: 200000, // $2000
    MIN_RENTAL_HOURS_MIN: 1,
    MIN_RENTAL_HOURS_MAX: 24,
    MAX_RENTAL_HOURS_MIN: 1,
    MAX_RENTAL_HOURS_MAX: 720, // 30 days
    DESCRIPTION_MAX_LENGTH: 1000,
    MAX_PHOTOS: 10,
    MAX_FEATURES: 20,
  },
  
  // Booking validation
  BOOKING: {
    NOTES_MAX_LENGTH: 1000,
    CANCELLATION_REASON_MAX_LENGTH: 500,
    MIN_BOOKING_DURATION_HOURS: 1,
    MAX_BOOKING_DURATION_HOURS: 720, // 30 days
    MAX_ADVANCE_BOOKING_DAYS: 365,
    MIN_ADVANCE_BOOKING_HOURS: 1,
  },
  
  // Hub validation
  HUB: {
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 100,
    ADDRESS_MAX_LENGTH: 255,
    DESCRIPTION_MAX_LENGTH: 1000,
    PHONE_MAX_LENGTH: 20,
    EMAIL_MAX_LENGTH: 255,
    TOTAL_SPOTS_MIN: 1,
    TOTAL_SPOTS_MAX: 1000,
    DISCOUNT_MIN: 0,
    DISCOUNT_MAX: 50, // 50%
  },
  
  // Payment validation
  PAYMENT: {
    AMOUNT_MIN_CENTS: 100, // $1
    AMOUNT_MAX_CENTS: 1000000, // $10,000
    COMMISSION_MIN: 0,
    COMMISSION_MAX: 30, // 30%
    REFUND_REASON_MAX_LENGTH: 500,
  },
  
  // Review validation
  REVIEW: {
    RATING_MIN: 1,
    RATING_MAX: 5,
    TEXT_MIN_LENGTH: 10,
    TEXT_MAX_LENGTH: 2000,
    RESPONSE_MAX_LENGTH: 1000,
    HIDDEN_REASON_MAX_LENGTH: 500,
  },
  
  // Trip validation
  TRIP: {
    CANCELLATION_REASON_MAX_LENGTH: 500,
    FUEL_LEVEL_MIN: 0,
    FUEL_LEVEL_MAX: 1,
    ODOMETER_MIN: 0,
    ODOMETER_MAX: 999999,
    MAX_PICKUP_PHOTOS: 20,
    MAX_RETURN_PHOTOS: 20,
    MAX_LATE_RETURN_HOURS: 72,
  },
  
  // Notification validation
  NOTIFICATION: {
    TITLE_MIN_LENGTH: 1,
    TITLE_MAX_LENGTH: 200,
    MESSAGE_MIN_LENGTH: 1,
    MESSAGE_MAX_LENGTH: 1000,
    MAX_RETRIES: 5,
    MAX_CHANNELS: 4,
  },
  
  // KYC validation
  KYC: {
    DOCUMENT_MAX_SIZE_MB: 10,
    ALLOWED_MIME_TYPES: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ],
    MAX_DOCUMENTS_PER_TYPE: 3,
  },
} as const;

export const REGEX_PATTERNS = {
  // Email pattern (RFC 5322 compliant)
  EMAIL: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  
  // Phone number pattern (international format)
  PHONE: /^\+?[1-9]\d{1,14}$/,
  
  // Password pattern (at least one uppercase, lowercase, digit, and special char)
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  
  // Username pattern (alphanumeric and underscore)
  USERNAME: /^[a-zA-Z0-9_]+$/,
  
  // License plate pattern (flexible for different formats)
  LICENSE_PLATE: /^[A-Z0-9\s-]+$/i,
  
  // VIN pattern (17 characters, no I, O, Q)
  VIN: /^[A-HJ-NPR-Z0-9]{17}$/,
  
  // Postal code patterns by country
  POSTAL_CODE: {
    US: /^\d{5}(-\d{4})?$/,
    CA: /^[A-Z]\d[A-Z] \d[A-Z]\d$/,
    UK: /^[A-Z]{1,2}[0-9R][0-9A-Z]? [0-9][A-BD-HJLNP-UW-Z]{2}$/,
    DE: /^\d{5}$/,
    FR: /^\d{5}$/,
    AU: /^\d{4}$/,
  },
} as const;

export const ERROR_MESSAGES = {
  // Generic messages
  REQUIRED: 'This field is required',
  INVALID_FORMAT: 'Invalid format',
  TOO_SHORT: 'Value is too short',
  TOO_LONG: 'Value is too long',
  OUT_OF_RANGE: 'Value is out of valid range',
  
  // User messages
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid phone number',
  WEAK_PASSWORD: 'Password must contain at least one uppercase letter, lowercase letter, digit, and special character',
  PASSWORD_TOO_SHORT: `Password must be at least ${VALIDATION_RULES.USER.PASSWORD_MIN_LENGTH} characters`,
  
  // Vehicle messages
  INVALID_YEAR: `Year must be between ${VALIDATION_RULES.VEHICLE.YEAR_MIN} and ${VALIDATION_RULES.VEHICLE.YEAR_MAX}`,
  INVALID_LICENSE_PLATE: 'Please enter a valid license plate',
  INVALID_PRICE_RANGE: 'Price is outside the valid range',
  
  // Booking messages
  INVALID_DATE_RANGE: 'End date must be after start date',
  BOOKING_TOO_SHORT: 'Booking duration is too short',
  BOOKING_TOO_LONG: 'Booking duration is too long',
  BOOKING_TOO_FAR: 'Booking date is too far in the future',
  
  // Payment messages
  AMOUNT_TOO_SMALL: 'Amount is below the minimum',
  AMOUNT_TOO_LARGE: 'Amount exceeds the maximum',
  
  // Review messages
  INVALID_RATING: `Rating must be between ${VALIDATION_RULES.REVIEW.RATING_MIN} and ${VALIDATION_RULES.REVIEW.RATING_MAX}`,
  REVIEW_TOO_SHORT: 'Review text is too short',
} as const;
