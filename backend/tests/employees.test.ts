import request from "supertest";
import { createApp } from "../src/app";
import { truncateAllTables } from "./setup";
import { createTestUser, ensureRolesAndPermissions } from "./helpers";

const app = createApp();

async function loginAs(role: "business_owner" | "operations_manager") {
  const email = `${role}@test.local`;
  await createTestUser({ email, password: "test-pass", role });
  const res = await request(app).post("/api/v1/auth/login").send({ email, password: "test-pass" });
  return res.body.data.accessToken as string;
}

describe("Employees", () => {
  let ownerToken: string;

  beforeAll(async () => {
    await ensureRolesAndPermissions();
  });

  beforeEach(async () => {
    await truncateAllTables();
    ownerToken = await loginAs("business_owner");
  });

  it("creates an employee", async () => {
    const res = await request(app)
      .post("/api/v1/employees")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ fullName: "Nadia Cherif", position: "Event Coordinator", baseSalary: 60000, startDate: "2026-01-15" });

    expect(res.status).toBe(201);
    expect(res.body.data.full_name).toBe("Nadia Cherif");
    expect(res.body.data.employment_status).toBe("active");
    expect(res.body.data.status).toBe("active");
  });

  it("links an employee to an existing user account", async () => {
    const userId = await createTestUser({ email: "staff@test.local", password: "x", role: "event_coordinator" });

    const res = await request(app)
      .post("/api/v1/employees")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        fullName: "Linked Staff",
        position: "Coordinator",
        baseSalary: 55000,
        startDate: "2026-01-01",
        userId,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.user_id).toBe(userId);
  });

  it("rejects linking an employee to a user account that doesn't exist", async () => {
    const res = await request(app)
      .post("/api/v1/employees")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        fullName: "Bad Link",
        position: "Coordinator",
        baseSalary: 55000,
        startDate: "2026-01-01",
        userId: "00000000-0000-0000-0000-000000000000",
      });

    expect(res.status).toBe(400);
  });

  it("rejects linking two employees to the same user account", async () => {
    const userId = await createTestUser({ email: "staff2@test.local", password: "x", role: "event_coordinator" });

    await request(app)
      .post("/api/v1/employees")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ fullName: "First Link", position: "Coordinator", baseSalary: 55000, startDate: "2026-01-01", userId })
      .expect(201);

    const res = await request(app)
      .post("/api/v1/employees")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ fullName: "Second Link", position: "Coordinator", baseSalary: 55000, startDate: "2026-01-01", userId });

    expect(res.status).toBe(409);
  });

  it("updates employment status", async () => {
    const created = await request(app)
      .post("/api/v1/employees")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ fullName: "On Leave Soon", position: "Staff", baseSalary: 45000, startDate: "2026-01-01" });

    const res = await request(app)
      .patch(`/api/v1/employees/${created.body.data.id}`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ employmentStatus: "on_leave" });

    expect(res.status).toBe(200);
    expect(res.body.data.employment_status).toBe("on_leave");
  });

  it("archives an employee", async () => {
    const created = await request(app)
      .post("/api/v1/employees")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ fullName: "To Archive", position: "Staff", baseSalary: 45000, startDate: "2026-01-01" });

    const res = await request(app)
      .post(`/api/v1/employees/${created.body.data.id}/archive`)
      .set("Authorization", `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("archived");
  });

  it("forbids Operations Manager from any employee access (sensitive HR data)", async () => {
    const omToken = await loginAs("operations_manager");
    const res = await request(app).get("/api/v1/employees").set("Authorization", `Bearer ${omToken}`);
    expect(res.status).toBe(403);
  });
});
