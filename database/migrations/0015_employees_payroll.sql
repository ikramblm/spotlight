CREATE TABLE employees (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            UUID UNIQUE REFERENCES users(id),
  full_name          VARCHAR(150) NOT NULL,
  phone              VARCHAR(30),
  position           VARCHAR(100) NOT NULL,
  base_salary        NUMERIC(12,2) NOT NULL CHECK (base_salary >= 0),
  employment_status  VARCHAR(30) NOT NULL DEFAULT 'active',
  start_date         DATE NOT NULL,
  notes              TEXT,
  status             record_status NOT NULL DEFAULT 'active',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_employees_status ON employees(status);

-- Reuses the payment_status enum ('unpaid'/'partial'/'paid') already created for bookings in
-- Phase 2 - same set of values fits payroll disbursement too.
CREATE TABLE payroll (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id    UUID NOT NULL REFERENCES employees(id),
  period_start   DATE NOT NULL,
  period_end     DATE NOT NULL CHECK (period_end >= period_start),
  base_salary    NUMERIC(12,2) NOT NULL CHECK (base_salary >= 0),
  bonuses        NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (bonuses >= 0),
  deductions     NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (deductions >= 0),
  net_pay        NUMERIC(12,2) GENERATED ALWAYS AS (base_salary + bonuses - deductions) STORED,
  payment_date   DATE,
  payment_status payment_status NOT NULL DEFAULT 'unpaid',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payroll_employee ON payroll(employee_id);
CREATE INDEX idx_payroll_period ON payroll(period_start, period_end);

-- One payroll run per employee per period - re-running payroll for a period that was already
-- processed should be an edit, not a second row.
CREATE UNIQUE INDEX idx_payroll_one_per_period ON payroll(employee_id, period_start, period_end);
