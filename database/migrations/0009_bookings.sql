CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TYPE booking_status AS ENUM ('confirmed', 'completed', 'canceled');
CREATE TYPE payment_status AS ENUM ('unpaid', 'partial', 'paid');

CREATE TABLE bookings (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_request_id  UUID UNIQUE REFERENCES booking_requests(id),
  customer_id        UUID NOT NULL REFERENCES customers(id),
  hall_id            UUID NOT NULL REFERENCES halls(id),
  event_type         VARCHAR(80) NOT NULL,
  event_date         DATE NOT NULL,
  start_time         TIMESTAMPTZ NOT NULL,
  end_time           TIMESTAMPTZ NOT NULL CHECK (end_time > start_time),
  guest_count        INTEGER CHECK (guest_count >= 0),
  total_amount       NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  advance_payment    NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (advance_payment >= 0),
  remaining_balance  NUMERIC(12,2) GENERATED ALWAYS AS (total_amount - advance_payment) STORED,
  payment_status     payment_status NOT NULL DEFAULT 'unpaid',
  status             booking_status NOT NULL DEFAULT 'confirmed',
  notes              TEXT,
  created_by         UUID NOT NULL REFERENCES users(id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (advance_payment <= total_amount),
  -- Spec §30 rule #1: no two CONFIRMED bookings may overlap on the same hall. This is the
  -- real guarantee (race-condition-proof); the service layer only adds a friendly message.
  EXCLUDE USING gist (
    hall_id WITH =,
    tsrange(start_time, end_time) WITH &&
  ) WHERE (status = 'confirmed')
);
CREATE INDEX idx_bookings_hall_date ON bookings(hall_id, event_date);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_status ON bookings(status);

CREATE TABLE booking_history (
  id             BIGSERIAL PRIMARY KEY,
  booking_id     UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  changed_by     UUID NOT NULL REFERENCES users(id),
  change_type    VARCHAR(40) NOT NULL,
  before_data    JSONB,
  after_data     JSONB,
  changed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_booking_history_booking ON booking_history(booking_id);

CREATE TABLE booking_services (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id     UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  service_id     UUID NOT NULL REFERENCES services(id),
  quantity       INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price     NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  UNIQUE (booking_id, service_id)
);
