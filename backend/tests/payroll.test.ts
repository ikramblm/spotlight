import request from "supertest";
import { createApp } from "../src/app";
import { truncateAllTables } from "./setup";
import { createTestEmployee, createTestUser, ensureRolesAndPermissions } from "./helpers";

const app = createApp();

async function loginAsOwner() {
  await createTestUser({ email: "owner@test.local", password: "owner-pass", role: "business_owner" });
  const res = await request(app).post("/api/v1/auth/login").send({ email: "owner@test.local", password: "owner-pass" });
  return res.body.data.accessToken as string;
}

describe("Payroll", () => {
  let ownerToken: string;
  let employeeId: string;

  beforeAll(async () => {
    await ensureRolesAndPermissions();
  });

  beforeEach(async () => {
    await truncateAllTables();
    ownerToken = await loginAsOwner();
    employeeId = await createTestEmployee({ fullName: "Payroll Employee", baseSalary: 50000 });
  });

  it("runs payroll using the employee's base salary by default, computing net pay", async () => {
    const res = await request(app)
      .post("/api/v1/payroll")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ employeeId, periodStart: "2026-03-01", periodEnd: "2026-03-31", bonuses: 5000, deductions: 2000 });

    expect(res.status).toBe(201);
    expect(res.body.data.base_salary).toBe("50000.00");
    expect(res.body.data.net_pay).toBe("53000.00");
    expect(res.body.data.payment_status).toBe("unpaid");
  });

  it("allows overriding the base salary for one payroll run", async () => {
    const res = await request(app)
      .post("/api/v1/payroll")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ employeeId, periodStart: "2026-03-01", periodEnd: "2026-03-31", baseSalary: 60000 });

    expect(res.status).toBe(201);
    expect(res.body.data.base_salary).toBe("60000.00");
    expect(res.body.data.net_pay).toBe("60000.00");
  });

  it("rejects a second payroll run for the same employee and period", async () => {
    await request(app)
      .post("/api/v1/payroll")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ employeeId, periodStart: "2026-03-01", periodEnd: "2026-03-31" })
      .expect(201);

    const res = await request(app)
      .post("/api/v1/payroll")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ employeeId, periodStart: "2026-03-01", periodEnd: "2026-03-31" });

    expect(res.status).toBe(409);
  });

  it("rejects a period end before the period start", async () => {
    const res = await request(app)
      .post("/api/v1/payroll")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ employeeId, periodStart: "2026-03-31", periodEnd: "2026-03-01" });

    expect(res.status).toBe(400);
  });

  it("marks a payroll run as paid, recording the payment date", async () => {
    const created = await request(app)
      .post("/api/v1/payroll")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ employeeId, periodStart: "2026-03-01", periodEnd: "2026-03-31" });

    const res = await request(app)
      .post(`/api/v1/payroll/${created.body.data.id}/pay`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ paymentDate: "2026-04-01" });

    expect(res.status).toBe(200);
    expect(res.body.data.payment_status).toBe("paid");
    expect(res.body.data.payment_date).toBe("2026-04-01");
  });

  it("rejects paying the same payroll run twice", async () => {
    const created = await request(app)
      .post("/api/v1/payroll")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ employeeId, periodStart: "2026-03-01", periodEnd: "2026-03-31" });

    await request(app)
      .post(`/api/v1/payroll/${created.body.data.id}/pay`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({})
      .expect(200);

    const res = await request(app)
      .post(`/api/v1/payroll/${created.body.data.id}/pay`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it("prevents editing a payroll run that has already been paid", async () => {
    const created = await request(app)
      .post("/api/v1/payroll")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ employeeId, periodStart: "2026-03-01", periodEnd: "2026-03-31" });

    await request(app)
      .post(`/api/v1/payroll/${created.body.data.id}/pay`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({})
      .expect(200);

    const res = await request(app)
      .patch(`/api/v1/payroll/${created.body.data.id}`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ bonuses: 10000 });

    expect(res.status).toBe(400);
  });

  it("allows editing bonuses/deductions before payment, recomputing net pay", async () => {
    const created = await request(app)
      .post("/api/v1/payroll")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ employeeId, periodStart: "2026-03-01", periodEnd: "2026-03-31" });

    const res = await request(app)
      .patch(`/api/v1/payroll/${created.body.data.id}`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ bonuses: 8000 });

    expect(res.status).toBe(200);
    expect(res.body.data.net_pay).toBe("58000.00");
  });

  it("lists payroll history for one employee", async () => {
    await request(app)
      .post("/api/v1/payroll")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ employeeId, periodStart: "2026-02-01", periodEnd: "2026-02-28" })
      .expect(201);
    await request(app)
      .post("/api/v1/payroll")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ employeeId, periodStart: "2026-03-01", periodEnd: "2026-03-31" })
      .expect(201);

    const res = await request(app)
      .get(`/api/v1/employees/${employeeId}/payroll`)
      .set("Authorization", `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it("forbids Operations Manager from any payroll access", async () => {
    await createTestUser({ email: "om@test.local", password: "x", role: "operations_manager" });
    const login = await request(app).post("/api/v1/auth/login").send({ email: "om@test.local", password: "x" });
    const omToken = login.body.data.accessToken;

    const res = await request(app).get("/api/v1/payroll").set("Authorization", `Bearer ${omToken}`);
    expect(res.status).toBe(403);
  });
});
