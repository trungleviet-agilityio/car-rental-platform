# 🗄️ Database Design & Schema

Comprehensive documentation of the Car Rental Platform's database architecture, design decisions, and implementation details.

## 📊 Database Overview

The platform uses **PostgreSQL 15** with **PostGIS extensions** for robust, scalable data management with geospatial capabilities.

### **Key Features**
- **13 Core Tables**: Comprehensive business domain coverage
- **PostGIS Integration**: Geospatial data for vehicles and hubs
- **Audit Trail**: Complete activity logging
- **Soft Deletes**: Data preservation with deletion tracking
- **JSONB Fields**: Flexible schema for dynamic data
- **Performance Optimized**: Strategic indexing and constraints

## 🏗️ Architecture Principles

### **Design Philosophy**
1. **Domain-Driven Design**: Tables organized by business domains
2. **Data Integrity**: Comprehensive constraints and validations
3. **Scalability**: Optimized for high-volume operations
4. **Auditability**: Complete change tracking
5. **Flexibility**: JSONB for evolving requirements

### **Naming Conventions**
- **Tables**: `snake_case` (e.g., `user_profiles`)
- **Columns**: `snake_case` (e.g., `created_at`)
- **Indexes**: `idx_tablename_column`
- **Foreign Keys**: `fk_tablename_column`
- **Constraints**: `ck_tablename_constraint`

## 📋 Schema Overview

### **Core Business Entities**

```sql
-- Primary entities with their relationships
Users (1) ──────────── (N) Vehicles
  │                        │
  │                        │
  └── (N) Bookings ────────┘
           │
           ├── (N) Trips
           ├── (N) Payments
           └── (N) Reviews
```

## 🗂️ Table Specifications

### **1. Users Management**

#### **users**
```sql
CREATE TABLE users (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cognito_sub           VARCHAR UNIQUE NOT NULL,
  username              VARCHAR UNIQUE,
  email                 VARCHAR UNIQUE NOT NULL,
  phone_number          VARCHAR,
  first_name            VARCHAR NOT NULL,
  last_name             VARCHAR NOT NULL,
  driver_license        VARCHAR,
  kyc_status           kyc_status_enum NOT NULL DEFAULT 'UNVERIFIED',
  kyc_document_key     VARCHAR,
  is_active            BOOLEAN NOT NULL DEFAULT true,
  email_verified       BOOLEAN NOT NULL DEFAULT false,
  role                 user_role_enum NOT NULL DEFAULT 'RENTER',
  
  -- Timestamps
  created_at           TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at           TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_cognito_sub ON users(cognito_sub);
CREATE INDEX idx_users_kyc_status ON users(kyc_status);
```

#### **phone_verifications**
```sql
CREATE TABLE phone_verifications (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone                VARCHAR NOT NULL,
  verification_sid     VARCHAR NOT NULL,
  is_verified          BOOLEAN NOT NULL DEFAULT false,
  verified_at          TIMESTAMP,
  expires_at           TIMESTAMP NOT NULL,
  attempt_count        INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at           TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### **2. Vehicle Management**

#### **vehicles**
```sql
CREATE TABLE vehicles (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id             UUID NOT NULL REFERENCES users(id),
  make                 VARCHAR NOT NULL,
  model                VARCHAR NOT NULL,
  year                 INTEGER NOT NULL CHECK (year >= 1900 AND year <= EXTRACT(YEAR FROM NOW()) + 1),
  license_plate        VARCHAR UNIQUE NOT NULL,
  seats                INTEGER NOT NULL CHECK (seats > 0),
  
  -- Pricing (in cents for precision)
  hourly_price_cents   INTEGER CHECK (hourly_price_cents > 0),
  daily_price_cents    INTEGER NOT NULL CHECK (daily_price_cents > 0),
  deposit_cents        INTEGER NOT NULL DEFAULT 0,
  min_rental_hours     INTEGER NOT NULL DEFAULT 4,
  max_rental_hours     INTEGER NOT NULL DEFAULT 168, -- 7 days
  
  -- Media and details
  photos               JSONB NOT NULL, -- Array of S3 URLs
  insurance_details    JSONB,
  
  -- Location (PostGIS)
  location             GEOGRAPHY(POINT, 4326),
  address              VARCHAR,
  
  -- Availability
  is_available         BOOLEAN NOT NULL DEFAULT true,
  availability_calendar JSONB,
  
  -- Vehicle specifications
  fuel_type            fuel_type_enum NOT NULL,
  transmission         transmission_type_enum NOT NULL,
  features             JSONB NOT NULL, -- Array of features
  
  -- Timestamps
  created_at           TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at           TIMESTAMP
);

-- Indexes
CREATE INDEX idx_vehicles_owner_id ON vehicles(owner_id);
CREATE INDEX idx_vehicles_location ON vehicles USING GIST(location);
CREATE INDEX idx_vehicles_make_model ON vehicles(make, model);
CREATE INDEX idx_vehicles_is_available ON vehicles(is_available);
```

#### **hubs**
```sql
CREATE TABLE hubs (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 VARCHAR NOT NULL,
  address              VARCHAR NOT NULL,
  location             GEOGRAPHY(POINT, 4326) NOT NULL,
  operating_hours      JSONB NOT NULL, -- Daily schedule
  total_parking_spots  INTEGER NOT NULL CHECK (total_parking_spots > 0),
  available_spots      INTEGER NOT NULL DEFAULT 0,
  discount_percentage  DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  hub_type             hub_type_enum NOT NULL,
  contact_phone        VARCHAR,
  contact_email        VARCHAR,
  is_active            BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  created_at           TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at           TIMESTAMP
);

-- Indexes
CREATE INDEX idx_hubs_location ON hubs USING GIST(location);
CREATE INDEX idx_hubs_hub_type ON hubs(hub_type);
```

### **3. Booking & Trip Management**

#### **bookings**
```sql
CREATE TABLE bookings (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  renter_id            UUID NOT NULL REFERENCES users(id),
  vehicle_id           UUID NOT NULL REFERENCES vehicles(id),
  owner_id             UUID NOT NULL REFERENCES users(id),
  
  -- Schedule
  start_datetime       TIMESTAMP NOT NULL,
  end_datetime         TIMESTAMP NOT NULL,
  
  -- Locations (PostGIS)
  pickup_location      GEOGRAPHY(POINT, 4326),
  return_location      GEOGRAPHY(POINT, 4326),
  hub_id               UUID REFERENCES hubs(id),
  
  -- Status and pricing
  status               booking_status_enum NOT NULL DEFAULT 'PENDING',
  pricing_breakdown    JSONB NOT NULL, -- rental_fee, deposit, commission
  total_amount_cents   INTEGER NOT NULL CHECK (total_amount_cents > 0),
  commission_cents     INTEGER NOT NULL CHECK (commission_cents >= 0),
  hub_discount_cents   INTEGER NOT NULL DEFAULT 0,
  
  -- Additional info
  booking_notes        TEXT,
  cancellation_reason  TEXT,
  cancelled_by         UUID REFERENCES users(id),
  cancelled_at         TIMESTAMP,
  confirmed_at         TIMESTAMP,
  
  -- Timestamps
  created_at           TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at           TIMESTAMP,
  
  -- Constraints
  CONSTRAINT ck_booking_dates CHECK (end_datetime > start_datetime),
  CONSTRAINT ck_booking_different_users CHECK (renter_id != owner_id)
);

-- Indexes
CREATE INDEX idx_bookings_renter_id ON bookings(renter_id);
CREATE INDEX idx_bookings_vehicle_id ON bookings(vehicle_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_dates ON bookings(start_datetime, end_datetime);
```

#### **trips**
```sql
CREATE TABLE trips (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id           UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  trip_number          INTEGER NOT NULL DEFAULT 1,
  trip_status          trip_status_enum NOT NULL DEFAULT 'SCHEDULED',
  
  -- Actual timings
  actual_start_datetime TIMESTAMP,
  actual_end_datetime  TIMESTAMP,
  
  -- Inspection data
  pickup_checklist     JSONB NOT NULL, -- fuel, odometer, damage, photos
  return_checklist     JSONB NOT NULL,
  pickup_photos        JSONB NOT NULL, -- Array of S3 URLs
  return_photos        JSONB NOT NULL,
  
  -- Vehicle condition
  initial_fuel_level   DECIMAL(2,1),
  final_fuel_level     DECIMAL(2,1),
  initial_odometer     INTEGER,
  final_odometer       INTEGER,
  
  -- Issues and penalties
  damage_reported      BOOLEAN NOT NULL DEFAULT false,
  damage_details       JSONB,
  late_return_minutes  INTEGER NOT NULL DEFAULT 0,
  penalties_applied    JSONB,
  cancellation_reason  TEXT,
  
  -- Timestamps
  picked_up_at         TIMESTAMP,
  returned_at          TIMESTAMP,
  created_at           TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at           TIMESTAMP,
  
  -- Unique constraint for booking trips
  UNIQUE(booking_id, trip_number)
);
```

### **4. Payment Processing**

#### **payments**
```sql
CREATE TABLE payments (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id           UUID NOT NULL REFERENCES bookings(id),
  payment_sequence     INTEGER NOT NULL DEFAULT 1,
  payment_type         payment_type_enum NOT NULL,
  amount_cents         INTEGER NOT NULL CHECK (amount_cents > 0),
  commission_cents     INTEGER NOT NULL CHECK (commission_cents >= 0),
  hub_discount_cents   INTEGER NOT NULL DEFAULT 0,
  net_payout_cents     INTEGER NOT NULL CHECK (net_payout_cents >= 0),
  payment_status       payment_status_enum NOT NULL DEFAULT 'PENDING',
  payment_method       payment_method_enum NOT NULL,
  refund_amount_cents  INTEGER NOT NULL DEFAULT 0,
  refund_reason        TEXT,
  processed_at         TIMESTAMP,
  initiated_at         TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Timestamps
  created_at           TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at           TIMESTAMP,
  
  -- Unique constraint for payment sequences
  UNIQUE(booking_id, payment_sequence)
);
```

#### **payment_transactions**
```sql
CREATE TABLE payment_transactions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id           UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  stripe_payment_intent_id VARCHAR UNIQUE,
  stripe_charge_id     VARCHAR,
  transaction_type     transaction_type_enum NOT NULL,
  amount_cents         INTEGER NOT NULL CHECK (amount_cents > 0),
  status               payment_status_enum NOT NULL DEFAULT 'PENDING',
  processed_at         TIMESTAMP,
  failure_reason       TEXT,
  retry_count          INTEGER NOT NULL DEFAULT 0,
  external_reference   VARCHAR,
  metadata             JSONB, -- Stripe metadata
  
  -- Timestamps
  created_at           TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at           TIMESTAMP
);
```

### **5. Review System**

#### **reviews**
```sql
CREATE TABLE reviews (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id           UUID NOT NULL REFERENCES bookings(id),
  reviewer_id          UUID NOT NULL REFERENCES users(id),
  reviewee_id          UUID NOT NULL REFERENCES users(id),
  review_type          review_type_enum NOT NULL,
  rating               INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text          TEXT,
  is_public            BOOLEAN NOT NULL DEFAULT true,
  helpful_votes        INTEGER NOT NULL DEFAULT 0,
  reported_count       INTEGER NOT NULL DEFAULT 0,
  is_hidden            BOOLEAN NOT NULL DEFAULT false,
  hidden_reason        TEXT,
  response_text        TEXT,
  responded_at         TIMESTAMP,
  
  -- Timestamps
  created_at           TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at           TIMESTAMP
);
```

#### **vehicle_reviews**
```sql
CREATE TABLE vehicle_reviews (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id           UUID NOT NULL REFERENCES bookings(id),
  vehicle_id           UUID NOT NULL REFERENCES vehicles(id),
  reviewer_id          UUID NOT NULL REFERENCES users(id),
  rating               INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text          TEXT,
  is_public            BOOLEAN NOT NULL DEFAULT true,
  helpful_votes        INTEGER NOT NULL DEFAULT 0,
  reported_count       INTEGER NOT NULL DEFAULT 0,
  is_hidden            BOOLEAN NOT NULL DEFAULT false,
  hidden_reason        TEXT,
  responded_at         TIMESTAMP,
  
  -- Timestamps
  created_at           TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at           TIMESTAMP
);
```

## 🔗 Enums & Custom Types

### **User & Authentication**
```sql
CREATE TYPE kyc_status_enum AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');
CREATE TYPE user_role_enum AS ENUM ('RENTER', 'OWNER', 'BOTH', 'ADMIN');
CREATE TYPE onboarding_step_enum AS ENUM (
  'PHONE_VERIFICATION', 
  'PROFILE_COMPLETION', 
  'KYC_UPLOAD', 
  'ACCOUNT_ACTIVATION'
);
```

### **Vehicle & Location**
```sql
CREATE TYPE fuel_type_enum AS ENUM ('PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID');
CREATE TYPE transmission_type_enum AS ENUM ('MANUAL', 'AUTOMATIC');
CREATE TYPE hub_type_enum AS ENUM ('AIRPORT', 'MALL', 'RESIDENTIAL', 'COMMERCIAL');
```

### **Booking & Payment**
```sql
CREATE TYPE booking_status_enum AS ENUM (
  'PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED'
);
CREATE TYPE trip_status_enum AS ENUM (
  'SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'DISPUTED'
);
CREATE TYPE payment_type_enum AS ENUM (
  'DEPOSIT', 'RENTAL_FEE', 'PENALTY', 'REFUND', 'COMMISSION'
);
CREATE TYPE payment_status_enum AS ENUM (
  'PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'REFUNDED'
);
CREATE TYPE payment_method_enum AS ENUM (
  'CARD', 'BANK_TRANSFER', 'WALLET', 'CASH'
);
CREATE TYPE transaction_type_enum AS ENUM (
  'CHARGE', 'REFUND', 'PARTIAL_REFUND', 'DISPUTE'
);
```

## 📊 Performance Optimizations

### **Strategic Indexing**
```sql
-- Geospatial indexes for location-based queries
CREATE INDEX idx_vehicles_location ON vehicles USING GIST(location);
CREATE INDEX idx_hubs_location ON hubs USING GIST(location);

-- Composite indexes for common queries
CREATE INDEX idx_bookings_dates_status ON bookings(start_datetime, end_datetime, status);
CREATE INDEX idx_vehicles_availability ON vehicles(is_available, created_at);

-- Full-text search
CREATE INDEX idx_vehicles_search ON vehicles USING GIN(
  to_tsvector('english', make || ' ' || model || ' ' || COALESCE(address, ''))
);
```

### **Query Optimization**
```sql
-- Example: Find available vehicles near location
SELECT v.*, 
       ST_Distance(v.location, ST_Point($longitude, $latitude)::geography) as distance
FROM vehicles v
WHERE v.is_available = true
  AND v.deleted_at IS NULL
  AND ST_DWithin(v.location, ST_Point($longitude, $latitude)::geography, 10000) -- 10km radius
ORDER BY distance
LIMIT 20;
```

## 🔄 Data Relationships

### **Core Relationships**
```
Users (1:N) ← Vehicles
Users (1:N) ← Bookings (Renter)
Users (1:N) ← Bookings (Owner)
Vehicles (1:N) ← Bookings
Bookings (1:N) ← Trips
Bookings (1:N) ← Payments
Bookings (1:N) ← Reviews
```

### **Referential Integrity**
- **CASCADE DELETE**: `trips`, `payments`, `reviews` when booking deleted
- **RESTRICT DELETE**: Cannot delete `users` or `vehicles` with active bookings
- **SOFT DELETE**: Most entities use `deleted_at` for data preservation

## 📈 Scalability Considerations

### **Partitioning Strategy**
```sql
-- Partition bookings by date for performance
CREATE TABLE bookings_2024 PARTITION OF bookings
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

### **Read Replicas**
- Separate read replicas for reporting queries
- Load balancing for read operations
- Master-slave replication for high availability

## 🔒 Security Features

### **Row Level Security (RLS)**
```sql
-- Enable RLS for user data
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own data
CREATE POLICY user_isolation ON users
  FOR ALL TO app_user
  USING (id = current_setting('app.current_user_id')::uuid);
```

### **Data Encryption**
- **At Rest**: PostgreSQL TDE (Transparent Data Encryption)
- **In Transit**: SSL/TLS connections
- **Application Level**: Sensitive fields encrypted before storage

## 🔍 Monitoring & Maintenance

### **Health Checks**
```sql
-- Database health query
SELECT 
  schemaname,
  tablename,
  n_tup_ins,
  n_tup_upd,
  n_tup_del,
  n_live_tup,
  n_dead_tup
FROM pg_stat_user_tables;
```

### **Maintenance Tasks**
- **Daily**: Update statistics, analyze query performance
- **Weekly**: Vacuum and reindex operations
- **Monthly**: Archive old data, cleanup soft-deleted records

---

**🗄️ Database design complete! Ready for enterprise-scale car rental operations.**
