import request from "supertest";
import { createApp } from "../src/app";
import { truncateAllTables } from "./setup";
import { createTestUser, ensureRolesAndPermissions } from "./helpers";

const app = createApp();

async function loginAs(email: string, password: string) {
  const res = await request(app).post("/api/v1/auth/login").send({ email, password });
  return res.body.data.accessToken as string;
}

describe("Users (role permissions)", () => {
  beforeAll(async () => {
    await ensureRolesAndPermissions();
  });

  beforeEach(async () => {
    await truncateAllTables();
  });

  it("allows a Business Owner to create a user", async () => {
    await createTestUser({ email: "owner@test.local", password: "owner-pass", role: "business_owner" });
    const token = await loginAs("owner@test.local", "owner-pass");

    const res = await request(app)
      .post("/api/v1/users")
      .set("Authorization", `Bearer ${token}`)
      .send({
        fullName: "New Coordinator",
        email: "coordinator@test.local",
        password: "coordinator-pass",
        role: "event_coordinator",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe("coordinator@test.local");
    expect(res.body.data.role).toBe("event_coordinator");
  });

  it("rejects creating a user with a duplicate email", async () => {
    await createTestUser({ email: "owner@test.local", password: "owner-pass", role: "business_owner" });
    await createTestUser({ email: "existing@test.local", password: "x", role: "event_coordinator" });
    const token = await loginAs("owner@test.local", "owner-pass");

    const res = await request(app)
      .post("/api/v1/users")
      .set("Authorization", `Bearer ${token}`)
      .send({
        fullName: "Duplicate",
        email: "existing@test.local",
        password: "another-pass",
        role: "event_coordinator",
      });

    expect(res.status).toBe(400);
    expect(res.body.error.fields.email).toMatch(/already in use/i);
  });

  it("forbids a non-owner role from creating a user (spec §30 rule #3)", async () => {
    await createTestUser({ email: "manager@test.local", password: "manager-pass", role: "operations_manager" });
    const token = await loginAs("manager@test.local", "manager-pass");

    const res = await request(app)
      .post("/api/v1/users")
      .set("Authorization", `Bearer ${token}`)
      .send({
        fullName: "Should Fail",
        email: "should-fail@test.local",
        password: "whatever123",
        role: "event_coordinator",
      });

    expect(res.status).toBe(403);
  });

  it("forbids Security Staff from viewing the user list (§30 rule #4: no unrelated admin access)", async () => {
    await createTestUser({ email: "guard@test.local", password: "guard-pass", role: "security_staff" });
    const token = await loginAs("guard@test.local", "guard-pass");

    const res = await request(app).get("/api/v1/users").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("prevents a user from deactivating their own account", async () => {
    const ownerId = await createTestUser({
      email: "owner@test.local",
      password: "owner-pass",
      role: "business_owner",
    });
    const token = await loginAs("owner@test.local", "owner-pass");

    const res = await request(app)
      .post(`/api/v1/users/${ownerId}/deactivate`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it("a deactivated user can no longer log in", async () => {
    await createTestUser({ email: "owner@test.local", password: "owner-pass", role: "business_owner" });
    const coordinatorId = await createTestUser({
      email: "coordinator@test.local",
      password: "coordinator-pass",
      role: "event_coordinator",
    });
    const ownerToken = await loginAs("owner@test.local", "owner-pass");

    await request(app)
      .post(`/api/v1/users/${coordinatorId}/deactivate`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .expect(200);

    const loginAttempt = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "coordinator@test.local", password: "coordinator-pass" });

    expect(loginAttempt.status).toBe(403);
  });
});
