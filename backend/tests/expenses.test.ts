import request from "supertest";
import { createApp } from "../src/app";
import { truncateAllTables } from "./setup";
import {
  createTestCustomer,
  createTestExpenseCategory,
  createTestHall,
  createTestUser,
  ensureRolesAndPermissions,
} from "./helpers";

const app = createApp();

async function loginAs(role: "business_owner" | "operations_manager") {
  const email = `${role}@test.local`;
  await createTestUser({ email, password: "test-pass", role });
  const res = await request(app).post("/api/v1/auth/login").send({ email, password: "test-pass" });
  return res.body.data.accessToken as string;
}

describe("Expenses and financial summary", () => {
  let ownerToken: string;
  let categoryId: number;

  beforeAll(async () => {
    await ensureRolesAndPermissions();
  });

  beforeEach(async () => {
    await truncateAllTables();
    ownerToken = await loginAs("business_owner");
    categoryId = await createTestExpenseCategory("Catering");
  });

  it("records an expense against a category", async () => {
    const res = await request(app)
      .post("/api/v1/expenses")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        categoryId,
        amount: 15000,
        expenseDate: "2026-03-10",
        paymentMethod: "cash",
        description: "Ice sculptures",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.category_name).toBe("Catering");
    expect(res.body.data.amount).toBe("15000.00");
  });

  it("rejects an unknown expense category", async () => {
    const res = await request(app)
      .post("/api/v1/expenses")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ categoryId: 999999, amount: 1000, expenseDate: "2026-03-10", paymentMethod: "cash" });

    expect(res.status).toBe(400);
  });

  it("rejects a malformed date", async () => {
    const res = await request(app)
      .post("/api/v1/expenses")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ categoryId, amount: 1000, expenseDate: "10-03-2026", paymentMethod: "cash" });

    expect(res.status).toBe(400);
  });

  it("filters expenses by date range and category", async () => {
    const otherCategoryId = await createTestExpenseCategory("Decoration");

    await request(app)
      .post("/api/v1/expenses")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ categoryId, amount: 5000, expenseDate: "2026-01-15", paymentMethod: "cash" })
      .expect(201);
    await request(app)
      .post("/api/v1/expenses")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ categoryId, amount: 6000, expenseDate: "2026-03-15", paymentMethod: "cash" })
      .expect(201);
    await request(app)
      .post("/api/v1/expenses")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ categoryId: otherCategoryId, amount: 7000, expenseDate: "2026-03-16", paymentMethod: "card" })
      .expect(201);

    const res = await request(app)
      .get("/api/v1/expenses")
      .query({ from: "2026-03-01", to: "2026-03-31", categoryId })
      .set("Authorization", `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].amount).toBe("6000.00");
  });

  it("computes the financial summary: revenue, expenses, payments received, outstanding balance", async () => {
    const customerId = await createTestCustomer({ phone: "0555888999" });
    const hallId = await createTestHall({ name: "Summary Hall" });
    const start = new Date("2026-03-20T18:00:00Z");
    const end = new Date("2026-03-20T23:00:00Z");

    const bookingRes = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        customerId,
        hallId,
        eventType: "wedding",
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        totalAmount: 300000,
        advancePayment: 100000,
      });
    expect(bookingRes.status).toBe(201);

    await request(app)
      .post("/api/v1/expenses")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ categoryId, amount: 40000, expenseDate: "2026-03-20", paymentMethod: "cash" })
      .expect(201);

    const summary = await request(app)
      .get("/api/v1/expenses/summary")
      .query({ from: "2026-03-01", to: "2026-03-31" })
      .set("Authorization", `Bearer ${ownerToken}`);

    expect(summary.status).toBe(200);
    expect(summary.body.data.revenue).toBe("300000.00");
    expect(summary.body.data.payments_received).toBe("100000.00");
    expect(summary.body.data.expenses).toBe("40000.00");
    expect(summary.body.data.outstanding_balance).toBe("200000.00");
    expect(summary.body.data.expenses_by_category.find((c: { category_name: string }) => c.category_name === "Catering").total).toBe(
      "40000.00"
    );
  });

  it("exports expenses as CSV", async () => {
    await request(app)
      .post("/api/v1/expenses")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ categoryId, amount: 2500, expenseDate: "2026-03-10", paymentMethod: "cash", description: "Flowers" })
      .expect(201);

    const res = await request(app)
      .get("/api/v1/expenses/export")
      .set("Authorization", `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/csv/);
    expect(res.text).toContain("Catering");
    expect(res.text).toContain("2500.00");
    expect(res.text).toContain("Flowers");
  });

  it("exports the financial summary as a PDF", async () => {
    await request(app)
      .post("/api/v1/expenses")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ categoryId, amount: 1000, expenseDate: "2026-03-10", paymentMethod: "cash", description: "Décor" })
      .expect(201);

    const res = await request(app)
      .get("/api/v1/expenses/summary/export")
      .set("Authorization", `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("application/pdf");
    expect(res.body.slice(0, 4).toString("latin1")).toBe("%PDF");
  });

  it("edits an expense", async () => {
    const created = await request(app)
      .post("/api/v1/expenses")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ categoryId, amount: 1000, expenseDate: "2026-03-10", paymentMethod: "cash" });

    const res = await request(app)
      .patch(`/api/v1/expenses/${created.body.data.id}`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ amount: 1200 });

    expect(res.status).toBe(200);
    expect(res.body.data.amount).toBe("1200.00");
  });

  describe("role permissions (matrix §6: Expenses/accounting - BO F, everyone else —)", () => {
    it("forbids Operations Manager from any expenses access", async () => {
      const omToken = await loginAs("operations_manager");

      const list = await request(app).get("/api/v1/expenses").set("Authorization", `Bearer ${omToken}`);
      expect(list.status).toBe(403);

      const create = await request(app)
        .post("/api/v1/expenses")
        .set("Authorization", `Bearer ${omToken}`)
        .send({ categoryId, amount: 1000, expenseDate: "2026-03-10", paymentMethod: "cash" });
      expect(create.status).toBe(403);
    });
  });
});
