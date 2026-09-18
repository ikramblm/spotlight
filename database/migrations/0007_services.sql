CREATE TABLE services (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           VARCHAR(120) NOT NULL,
  category       VARCHAR(60) NOT NULL,
  default_price  NUMERIC(12,2) NOT NULL CHECK (default_price >= 0),
  description    TEXT,
  status         record_status NOT NULL DEFAULT 'active'
);
CREATE INDEX idx_services_category ON services(category);
