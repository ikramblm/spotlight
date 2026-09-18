import "dotenv/config";
import { pool } from "../src/config/db";

// Integration tests run against a real Postgres database (DATABASE_URL), migrated and
// seeded beforehand - see backend/README.md "Running tests". This mirrors production
// behavior for things a mock can't verify: the EXCLUDE constraint, unique indexes, etc.
export async function truncateAllTables() {
  await pool.query(`
    TRUNCATE TABLE
      archives,
      audit_logs,
      password_resets,
      refresh_tokens,
      booking_history,
      booking_services,
      equipment_assignments,
      equipment,
      booking_caterers,
      caterers,
      payroll,
      employees,
      expenses,
      expense_categories,
      suppliers,
      restitution_records,
      confiscations,
      check_ins,
      rsvps,
      invitations,
      guests,
      events,
      bookings,
      booking_requests,
      services,
      halls,
      customers,
      users
    RESTART IDENTITY CASCADE
  `);
}

afterAll(async () => {
  await pool.end();
});
