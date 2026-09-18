import "dotenv/config";
import { Pool } from "pg";
import argon2 from "argon2";

const ROLES: { name: string; description: string }[] = [
  { name: "business_owner", description: "Full access to all business information and settings" },
  { name: "operations_manager", description: "Manages daily operations: bookings, customers, halls, events" },
  { name: "event_coordinator", description: "Manages assigned events, guests, invitations and RSVP" },
  { name: "security_staff", description: "Entrance access: QR check-in and confiscated-item handling" },
];

// Phase 1 (auth + users + audit) + Phase 2 (customers, halls, services, booking requests,
// bookings) permission codes. Later phases extend this list - see the Role/Permission Matrix
// in the architecture doc.
const PERMISSIONS: { code: string; description: string }[] = [
  { code: "users.view", description: "View internal user accounts" },
  { code: "users.create", description: "Create internal user accounts" },
  { code: "users.edit", description: "Edit internal user accounts" },
  { code: "users.deactivate", description: "Activate or deactivate internal user accounts" },
  { code: "audit_logs.view", description: "View the security audit log" },
  { code: "archives.view", description: "Browse the archive trail (what was archived, when, and why)" },
  { code: "dashboard.view", description: "View the role-aware dashboard KPI summary" },

  { code: "customers.view", description: "View customers" },
  { code: "customers.create", description: "Create customers" },
  { code: "customers.edit", description: "Edit customers" },
  { code: "customers.archive", description: "Archive customers" },

  { code: "halls.view", description: "View halls" },
  { code: "halls.create", description: "Create halls" },
  { code: "halls.edit", description: "Edit halls" },
  { code: "halls.archive", description: "Archive halls" },

  { code: "services.view", description: "View event services" },
  { code: "services.create", description: "Create event services" },
  { code: "services.edit", description: "Edit event services" },
  { code: "services.archive", description: "Archive event services" },

  { code: "booking_requests.view", description: "View booking requests" },
  { code: "booking_requests.create", description: "Create booking requests" },
  { code: "booking_requests.edit", description: "Edit/cancel booking requests" },
  { code: "booking_requests.approve", description: "Approve, reject or convert booking requests" },

  { code: "bookings.view", description: "View bookings" },
  { code: "bookings.create", description: "Create bookings" },
  { code: "bookings.edit", description: "Edit bookings, update payments, cancel/complete" },

  { code: "calendar.view", description: "View the full event calendar across any date range" },
  { code: "calendar.view_today", description: "View today's events only" },

  { code: "guests.view", description: "View guest lists and attendance stats" },
  { code: "guests.create", description: "Add or import guests" },
  { code: "guests.edit", description: "Edit guest details" },

  { code: "invitations.create", description: "Generate invitations (QR + RSVP link)" },
  { code: "invitations.send", description: "Mark an invitation as sent" },
  { code: "invitations.view", description: "View invitation status and QR codes" },

  { code: "checkin.view", description: "View check-in records for an event" },
  { code: "checkin.scan", description: "Scan a QR code or manually check a guest in" },
  { code: "checkin.override", description: "Check a guest in again after a duplicate scan" },

  { code: "confiscations.view", description: "View confiscated-item records" },
  { code: "confiscations.create", description: "Record a confiscated/deposited item" },
  { code: "confiscations.return", description: "Record an item's restitution" },

  { code: "expenses.view", description: "View expenses and the financial summary" },
  { code: "expenses.create", description: "Record an expense" },
  { code: "expenses.edit", description: "Edit an expense or manage expense categories" },

  { code: "employees.view", description: "View employee records" },
  { code: "employees.create", description: "Add an employee" },
  { code: "employees.edit", description: "Edit an employee's details or employment status" },
  { code: "employees.archive", description: "Archive an employee record" },

  { code: "payroll.view", description: "View payroll runs and history" },
  { code: "payroll.create", description: "Run payroll for an employee" },
  { code: "payroll.edit", description: "Adjust bonuses/deductions on an unpaid payroll run" },
  { code: "payroll.pay", description: "Mark a payroll run as paid" },

  { code: "caterers.view", description: "View caterers" },
  { code: "caterers.create", description: "Add a caterer" },
  { code: "caterers.edit", description: "Edit a caterer or (un)assign them to a booking" },
  { code: "caterers.archive", description: "Archive a caterer" },

  { code: "suppliers.view", description: "View suppliers" },
  { code: "suppliers.create", description: "Add a supplier" },
  { code: "suppliers.edit", description: "Edit a supplier" },
  { code: "suppliers.archive", description: "Archive a supplier" },

  { code: "equipment.view", description: "View equipment inventory" },
  { code: "equipment.create", description: "Add an equipment item" },
  { code: "equipment.edit", description: "Edit an equipment item" },
  { code: "equipment.archive", description: "Archive an equipment item" },
  { code: "equipment.assign", description: "Assign equipment to a booking or record its return" },
];

// Default expense categories - a starting taxonomy for an Algerian event-venue business
// (architecture doc's business context). Business Owner can add more via the API.
const DEFAULT_EXPENSE_CATEGORIES = [
  "Catering",
  "Decoration",
  "Sound & Lighting",
  "Staff Wages",
  "Utilities",
  "Maintenance",
  "Marketing",
  "Equipment",
  "Other",
];

// Role/Permission Matrix (architecture doc §6): Business Owner gets everything; Operations
// Manager gets day-to-day operational access but never user-management or archive/audit;
// Event Coordinator gets read-only visibility into the modules relevant to running an event;
// Security Staff gets none of this (their permissions arrive with the check-in phase).
const ROLE_PERMISSIONS: Record<string, string[]> = {
  business_owner: PERMISSIONS.map((p) => p.code),
  operations_manager: [
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
  ],
  event_coordinator: [
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
  ],
  // Security Staff only ever gets "today" on the calendar (matrix §6: R, today's events only)
  // and never touches guests/invitations directly - their guest visibility comes from the
  // checkin flow itself (the scan response names the guest), not a general guest list (spec
  // §2: "Security staff should only see information required for their operational
  // responsibilities"). They do hold checkin.override alongside Business Owner (matrix: "F").
  security_staff: [
    "dashboard.view",
    "calendar.view_today",
    "checkin.view",
    "checkin.scan",
    "checkin.override",
    "confiscations.view",
    "confiscations.create",
    "confiscations.return",
  ],
};

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new Pool({ connectionString });

  try {
    for (const role of ROLES) {
      await pool.query(
        `INSERT INTO roles (name, description) VALUES ($1, $2)
         ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description`,
        [role.name, role.description]
      );
    }

    for (const permission of PERMISSIONS) {
      await pool.query(
        `INSERT INTO permissions (code, description) VALUES ($1, $2)
         ON CONFLICT (code) DO UPDATE SET description = EXCLUDED.description`,
        [permission.code, permission.description]
      );
    }

    for (const [roleName, codes] of Object.entries(ROLE_PERMISSIONS)) {
      await pool.query(
        `DELETE FROM role_permissions WHERE role_id = (SELECT id FROM roles WHERE name = $1)`,
        [roleName]
      );
      for (const code of codes) {
        await pool.query(
          `INSERT INTO role_permissions (role_id, permission_id)
           VALUES ((SELECT id FROM roles WHERE name = $1), (SELECT id FROM permissions WHERE code = $2))`,
          [roleName, code]
        );
      }
    }

    for (const name of DEFAULT_EXPENSE_CATEGORIES) {
      await pool.query(`INSERT INTO expense_categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`, [name]);
    }

    const ownerEmail = process.env.SEED_OWNER_EMAIL ?? "owner@spotlight.local";
    const ownerPassword = process.env.SEED_OWNER_PASSWORD ?? "ChangeMe123!";

    const existing = await pool.query(`SELECT id FROM users WHERE email = $1`, [ownerEmail]);
    if (existing.rowCount === 0) {
      const passwordHash = await argon2.hash(ownerPassword, { type: argon2.argon2id });
      await pool.query(
        `INSERT INTO users (full_name, email, password_hash, role_id)
         VALUES ($1, $2, $3, (SELECT id FROM roles WHERE name = 'business_owner'))`,
        ["Spotlight Owner", ownerEmail, passwordHash]
      );
      console.log(`Created demo Business Owner: ${ownerEmail} / ${ownerPassword}`);
      console.log("This is a DEMO account for local development only - change or remove it before production.");
    } else {
      console.log(`Demo owner ${ownerEmail} already exists, skipping.`);
    }

    console.log("Seed complete.");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
