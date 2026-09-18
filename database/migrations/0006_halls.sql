CREATE TABLE halls (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           VARCHAR(120) NOT NULL,
  description    TEXT,
  capacity       INTEGER NOT NULL CHECK (capacity > 0),
  location       VARCHAR(255),
  base_price     NUMERIC(12,2) NOT NULL CHECK (base_price >= 0),
  features       JSONB NOT NULL DEFAULT '[]',
  is_available   BOOLEAN NOT NULL DEFAULT true,
  status         record_status NOT NULL DEFAULT 'active',
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_halls_status ON halls(status);
