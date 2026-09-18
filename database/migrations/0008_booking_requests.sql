CREATE TYPE booking_request_status AS ENUM ('pending', 'approved', 'rejected', 'canceled');

CREATE TABLE booking_requests (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id         UUID NOT NULL REFERENCES customers(id),
  hall_id             UUID NOT NULL REFERENCES halls(id),
  event_type          VARCHAR(80) NOT NULL,
  event_date          DATE NOT NULL,
  start_time          TIMESTAMPTZ NOT NULL,
  end_time            TIMESTAMPTZ NOT NULL CHECK (end_time > start_time),
  requested_services  JSONB NOT NULL DEFAULT '[]',
  notes               TEXT,
  status              booking_request_status NOT NULL DEFAULT 'pending',
  decided_by          UUID REFERENCES users(id),
  decided_at          TIMESTAMPTZ,
  created_by          UUID NOT NULL REFERENCES users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_booking_requests_hall_date ON booking_requests(hall_id, event_date);
CREATE INDEX idx_booking_requests_status ON booking_requests(status);
CREATE INDEX idx_booking_requests_customer ON booking_requests(customer_id);
