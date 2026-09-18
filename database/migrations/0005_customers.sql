CREATE TABLE customers (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name      VARCHAR(150) NOT NULL,
  phone          VARCHAR(30) NOT NULL,
  email          VARCHAR(255),
  address        TEXT,
  notes          TEXT,
  status         record_status NOT NULL DEFAULT 'active',
  created_by     UUID REFERENCES users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_customers_phone ON customers(phone) WHERE status <> 'deleted';
CREATE INDEX idx_customers_name_trgm ON customers USING gin (full_name gin_trgm_ops);
