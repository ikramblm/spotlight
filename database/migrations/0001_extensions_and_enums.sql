CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TYPE user_role AS ENUM (
  'business_owner',
  'operations_manager',
  'event_coordinator',
  'security_staff'
);

CREATE TYPE record_status AS ENUM ('active', 'archived', 'deleted');
