import request from "supertest";
import { createApp } from "../src/app";
import { truncateAllTables } from "./setup";
import { createTestUser, ensureRolesAndPermissions } from "./helpers";

const app = createApp();

async function loginAs(role: "business_owner" | "operations_manager", email: string) {
  await createTestUser({ email, password: "test-pass", role });
  const res = await request(app).post("/api/v1/auth/login").send({ email, password: "test-pass" });
  return res.body.data.accessToken as string;
}

describe("Audit logs", () => {
  beforeAll(async () => {
    await ensureRolesAndPermissions();
  });

  beforeEach(async () => {
    await truncateAllTables();
  });

  it("records a login and lists it for the owner", async () => {
    const ownerToken = await loginAs("business_owner", "owner@test.local");

    const res = await request(app).get("/api/v1/audit-logs").set("Authorization", `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.some((row: { action: string }) => row.action === "auth.login")).toBe(true);
  });

  it("filters by action", async () => {
    const ownerToken = await loginAs("business_owner", "owner2@test.local");

    const res = await request(app)
      .get("/api/v1/audit-logs?action=auth.login")
      .set("Authorization", `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    for (const row of res.body.data) {
      expect(row.action).toBe("auth.login");
    }
  });

  it("forbids Operations Manager from reading the audit log (owner-only per matrix)", async () => {
    const omToken = await loginAs("operations_manager", "om@test.local");
    const res = await request(app).get("/api/v1/audit-logs").set("Authorization", `Bearer ${omToken}`);
    expect(res.status).toBe(403);
  });
});
