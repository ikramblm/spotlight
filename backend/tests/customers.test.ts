import request from "supertest";
import { createApp } from "../src/app";
import { truncateAllTables } from "./setup";
import { createTestUser, ensureRolesAndPermissions } from "./helpers";

const app = createApp();

async function loginAs(role: "business_owner" | "operations_manager" | "security_staff") {
  const email = `${role}@test.local`;
  await createTestUser({ email, password: "test-pass", role });
  const res = await request(app).post("/api/v1/auth/login").send({ email, password: "test-pass" });
  return res.body.data.accessToken as string;
}

describe("Customers", () => {
  beforeAll(async () => {
    await ensureRolesAndPermissions();
  });

  beforeEach(async () => {
    await truncateAllTables();
  });

  it("allows Operations Manager to create a customer (spec §2: operational records)", async () => {
    const token = await loginAs("operations_manager");

    const res = await request(app)
      .post("/api/v1/customers")
      .set("Authorization", `Bearer ${token}`)
      .send({ fullName: "Amel Bensalem", phone: "0555123456", email: "amel@example.com" });

    expect(res.status).toBe(201);
    expect(res.body.data.full_name).toBe("Amel Bensalem");
  });

  it("rejects a duplicate phone number", async () => {
    const token = await loginAs("business_owner");
    await request(app)
      .post("/api/v1/customers")
      .set("Authorization", `Bearer ${token}`)
      .send({ fullName: "First", phone: "0555999888" })
      .expect(201);

    const res = await request(app)
      .post("/api/v1/customers")
      .set("Authorization", `Bearer ${token}`)
      .send({ fullName: "Second", phone: "0555999888" });

    expect(res.status).toBe(400);
    expect(res.body.error.fields.phone).toMatch(/already in use/i);
  });

  it("forbids Security Staff from viewing customers (spec §30 rule #4)", async () => {
    const token = await loginAs("security_staff");
    const res = await request(app).get("/api/v1/customers").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("forbids Operations Manager from archiving a customer (RW excludes archive per matrix)", async () => {
    const ownerToken = await loginAs("business_owner");
    const created = await request(app)
      .post("/api/v1/customers")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ fullName: "To Archive", phone: "0555777666" });

    const omToken = await loginAs("operations_manager");
    const res = await request(app)
      .post(`/api/v1/customers/${created.body.data.id}/archive`)
      .set("Authorization", `Bearer ${omToken}`);

    expect(res.status).toBe(403);
  });

  it("allows Business Owner to archive a customer", async () => {
    const token = await loginAs("business_owner");
    const created = await request(app)
      .post("/api/v1/customers")
      .set("Authorization", `Bearer ${token}`)
      .send({ fullName: "To Archive", phone: "0555777555" });

    const res = await request(app)
      .post(`/api/v1/customers/${created.body.data.id}/archive`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("archived");
  });

  it("404s for a customer that does not exist", async () => {
    const token = await loginAs("business_owner");
    const res = await request(app)
      .get("/api/v1/customers/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
