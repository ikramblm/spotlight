import argon2 from "argon2";
import { pool } from "../src/config/db";
import { venueDateExpr } from "../src/lib/timezone";
import type { UserRole } from "../src/types";

const ALL_PERMISSIONS = [
  "users.view",
  "users.create",
  "users.edit",
  "users.deactivate",
  "audit_logs.view",
  "archives.view",
  "dashboard.view",
  "customers.view",
  "customers.create",
  "customers.edit",
  "customers.archive",
  "halls.view",
  "halls.create",
  "halls.edit",
  "halls.archive",
  "services.view",
  "services.create",
  "services.edit",
  "services.archive",
  "booking_requests.view",
  "booking_requests.create",
  "booking_requests.edit",
  "booking_requests.approve",
  "bookings.view",
  "bookings.create",
  "bookings.edit",
  "calendar.view",
  "calendar.view_today",
  "guests.view",
  "guests.create",
  "guests.edit",
  "invitations.create",
  "invitations.send",
  "invitations.view",
  "checkin.view",
  "checkin.scan",
  "checkin.override",
  "confiscations.view",
  "confiscations.create",
  "confiscations.return",
  "expenses.view",
  "expenses.create",
  "expenses.edit",
  "employees.view",
  "employees.create",
  "employees.edit",
  "employees.archive",
  "payroll.view",
  "payroll.create",
  "payroll.edit",
  "payroll.pay",
  "caterers.view",
  "caterers.create",
  "caterers.edit",
  "caterers.archive",
  "suppliers.view",
  "suppliers.create",
  "suppliers.edit",
  "suppliers.archive",
  "equipment.view",
  "equipment.create",
  "equipment.edit",
  "equipment.archive",
  "equipment.assign",
];

const OPERATIONS_MANAGER_PERMISSIONS = [
  "dashboard.view",
  "customers.view",
  "customers.create",
  "customers.edit",
  "halls.view",
  "halls.create",
  "halls.edit",
  "services.view",
  "services.create",
  "services.edit",
  "booking_requests.view",
  "booking_requests.create",
  "booking_requests.edit",
  "booking_requests.approve",
  "bookings.view",
  "bookings.create",
  "bookings.edit",
  "calendar.view",
  "calendar.view_today",
  "guests.view",
  "guests.create",
  "guests.edit",
  "invitations.create",
  "invitations.send",
  "invitations.view",
  "checkin.view",
  "confiscations.view",
  "caterers.view",
  "caterers.create",
  "caterers.edit",
  "suppliers.view",
  "suppliers.create",
  "suppliers.edit",
  "equipment.view",
  "equipment.create",
  "equipment.edit",
  "equipment.assign",
];

const EVENT_COORDINATOR_PERMISSIONS = [
  "dashboard.view",
  "customers.view",
  "halls.view",
  "services.view",
  "booking_requests.view",
  "bookings.view",
  "calendar.view",
  "calendar.view_today",
  "guests.view",
  "guests.create",
  "guests.edit",
  "invitations.create",
  "invitations.send",
  "invitations.view",
  "checkin.view",
  "checkin.scan",
  "caterers.view",
  "suppliers.view",
  "equipment.view",
];

const SECURITY_STAFF_PERMISSIONS = [
  "dashboard.view",
  "calendar.view_today",
  "checkin.view",
  "checkin.scan",
  "checkin.override",
  "confiscations.view",
  "confiscations.create",
  "confiscations.return",
];

export async function ensureRolesAndPermissions() {
  const roles: UserRole[] = [
    "business_owner",
    "operations_manager",
    "event_coordinator",
    "security_staff",
  ];
  for (const role of roles) {
    await pool.query(`INSERT INTO roles (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`, [role]);
  }

  for (const code of ALL_PERMISSIONS) {
    await pool.query(`INSERT INTO permissions (code) VALUES ($1) ON CONFLICT (code) DO NOTHING`, [code]);
  }

  async function grant(role: UserRole, codes: string[]) {
    await pool.query(
      `DELETE FROM role_permissions WHERE role_id = (SELECT id FROM roles WHERE name = $1)`,
      [role]
    );
    for (const code of codes) {
      await pool.query(
        `INSERT INTO role_permissions (role_id, permission_id)
         VALUES ((SELECT id FROM roles WHERE name = $1), (SELECT id FROM permissions WHERE code = $2))
         ON CONFLICT DO NOTHING`,
        [role, code]
      );
    }
  }

  await grant("business_owner", ALL_PERMISSIONS);
  await grant("operations_manager", OPERATIONS_MANAGER_PERMISSIONS);
  await grant("event_coordinator", EVENT_COORDINATOR_PERMISSIONS);
  await grant("security_staff", SECURITY_STAFF_PERMISSIONS);
}

export async function createTestUser(opts: {
  email: string;
  password: string;
  role: UserRole;
  fullName?: string;
  isActive?: boolean;
}) {
  const passwordHash = await argon2.hash(opts.password, { type: argon2.argon2id });
  const result = await pool.query<{ id: string }>(
    `INSERT INTO users (full_name, email, password_hash, role_id, is_active)
     VALUES ($1, $2, $3, (SELECT id FROM roles WHERE name = $4), $5)
     RETURNING id`,
    [opts.fullName ?? "Test User", opts.email, passwordHash, opts.role, opts.isActive ?? true]
  );
  return result.rows[0]!.id;
}

export async function createTestCustomer(opts: { fullName?: string; phone: string }) {
  const result = await pool.query<{ id: string }>(
    `INSERT INTO customers (full_name, phone) VALUES ($1, $2) RETURNING id`,
    [opts.fullName ?? "Test Customer", opts.phone]
  );
  return result.rows[0]!.id;
}

export async function createTestHall(opts: { name?: string; capacity?: number; basePrice?: number }) {
  const result = await pool.query<{ id: string }>(
    `INSERT INTO halls (name, capacity, base_price) VALUES ($1, $2, $3) RETURNING id`,
    [opts.name ?? "Test Hall", opts.capacity ?? 100, opts.basePrice ?? 50000]
  );
  return result.rows[0]!.id;
}

/** Inserts a confirmed booking + its auto-created event directly (bypassing the API) so
 * guest/invitation/check-in tests have somewhere to attach without re-testing Phase 2 booking
 * creation. Mirrors what bookingsRepo.insertBooking does inside its own transaction. */
export async function createTestBooking(opts: {
  customerId: string;
  hallId: string;
  createdBy: string;
  startTime: Date;
  endTime: Date;
  status?: "confirmed" | "completed" | "canceled";
}) {
  const result = await pool.query<{ id: string }>(
    `INSERT INTO bookings (customer_id, hall_id, event_type, event_date, start_time, end_time,
       total_amount, advance_payment, status, created_by)
     VALUES ($1, $2, 'wedding', ${venueDateExpr("$3")}, $3, $4, 100000, 0, $5, $6)
     RETURNING id`,
    [opts.customerId, opts.hallId, opts.startTime, opts.endTime, opts.status ?? "confirmed", opts.createdBy]
  );
  const bookingId = result.rows[0]!.id;

  const eventResult = await pool.query<{ id: string }>(
    `INSERT INTO events (booking_id) VALUES ($1) RETURNING id`,
    [bookingId]
  );

  return { bookingId, eventId: eventResult.rows[0]!.id };
}

export async function createTestExpenseCategory(name = "Test Category") {
  const result = await pool.query<{ id: number }>(
    `INSERT INTO expense_categories (name) VALUES ($1) RETURNING id`,
    [name]
  );
  return result.rows[0]!.id;
}

export async function createTestSupplier(name = "Test Supplier") {
  const result = await pool.query<{ id: string }>(`INSERT INTO suppliers (name) VALUES ($1) RETURNING id`, [name]);
  return result.rows[0]!.id;
}

export async function createTestCaterer(name = "Test Caterer") {
  const result = await pool.query<{ id: string }>(`INSERT INTO caterers (name) VALUES ($1) RETURNING id`, [name]);
  return result.rows[0]!.id;
}

export async function createTestEquipment(opts: { name?: string; category?: string; quantityTotal?: number }) {
  const total = opts.quantityTotal ?? 10;
  const result = await pool.query<{ id: string }>(
    `INSERT INTO equipment (name, category, quantity_total, quantity_available) VALUES ($1, $2, $3, $3) RETURNING id`,
    [opts.name ?? "Test Equipment", opts.category ?? "Sound", total]
  );
  return result.rows[0]!.id;
}

export async function createTestEmployee(opts: {
  fullName?: string;
  position?: string;
  baseSalary?: number;
  startDate?: string;
}) {
  const result = await pool.query<{ id: string }>(
    `INSERT INTO employees (full_name, position, base_salary, start_date) VALUES ($1, $2, $3, $4) RETURNING id`,
    [
      opts.fullName ?? "Test Employee",
      opts.position ?? "Staff",
      opts.baseSalary ?? 50000,
      opts.startDate ?? "2026-01-01",
    ]
  );
  return result.rows[0]!.id;
}
