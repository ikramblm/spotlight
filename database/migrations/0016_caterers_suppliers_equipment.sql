CREATE TABLE caterers (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           VARCHAR(150) NOT NULL,
  phone          VARCHAR(30),
  email          VARCHAR(255),
  services       JSONB NOT NULL DEFAULT '[]',
  pricing_notes  TEXT,
  notes          TEXT,
  status         record_status NOT NULL DEFAULT 'active',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE booking_caterers (
  booking_id     UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  caterer_id     UUID NOT NULL REFERENCES caterers(id),
  assigned_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (booking_id, caterer_id)
);
CREATE INDEX idx_booking_caterers_caterer ON booking_caterers(caterer_id);

CREATE TABLE suppliers (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           VARCHAR(150) NOT NULL,
  phone          VARCHAR(30),
  email          VARCHAR(255),
  products       JSONB NOT NULL DEFAULT '[]',
  pricing_notes  TEXT,
  notes          TEXT,
  status         record_status NOT NULL DEFAULT 'active',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Deferred from Phase 6 (architecture doc's expenses schema referenced suppliers before this
-- table existed) - now that it's real, expenses can actually be attributed to one.
ALTER TABLE expenses ADD COLUMN supplier_id UUID REFERENCES suppliers(id);
CREATE INDEX idx_expenses_supplier ON expenses(supplier_id);

CREATE TABLE equipment (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                VARCHAR(150) NOT NULL,
  category            VARCHAR(80) NOT NULL,
  quantity_total       INTEGER NOT NULL CHECK (quantity_total >= 0),
  quantity_available   INTEGER NOT NULL CHECK (quantity_available >= 0),
  condition           VARCHAR(30) NOT NULL DEFAULT 'good',
  location            VARCHAR(150),
  supplier_id         UUID REFERENCES suppliers(id),
  notes               TEXT,
  status              record_status NOT NULL DEFAULT 'active',
  CHECK (quantity_available <= quantity_total)
);
CREATE INDEX idx_equipment_supplier ON equipment(supplier_id);

CREATE TABLE equipment_assignments (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id   UUID NOT NULL REFERENCES equipment(id),
  booking_id     UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  quantity       INTEGER NOT NULL CHECK (quantity > 0),
  assigned_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  returned_at    TIMESTAMPTZ
);
CREATE INDEX idx_equipment_assignments_equipment ON equipment_assignments(equipment_id);
CREATE INDEX idx_equipment_assignments_booking ON equipment_assignments(booking_id);
