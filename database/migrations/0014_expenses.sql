CREATE TABLE expense_categories (
  id             SMALLSERIAL PRIMARY KEY,
  name           VARCHAR(80) NOT NULL UNIQUE
);

-- supplier_id is intentionally not here yet: the `suppliers` table doesn't exist until Phase 8
-- (architecture doc §28). It arrives via an ALTER TABLE in that phase's migration rather than
-- forward-referencing a table that doesn't exist.
CREATE TABLE expenses (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id    SMALLINT NOT NULL REFERENCES expense_categories(id),
  booking_id     UUID REFERENCES bookings(id),
  amount         NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  expense_date   DATE NOT NULL,
  payment_method VARCHAR(40) NOT NULL,
  description    TEXT,
  created_by     UUID NOT NULL REFERENCES users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_category ON expenses(category_id);
CREATE INDEX idx_expenses_booking ON expenses(booking_id);
