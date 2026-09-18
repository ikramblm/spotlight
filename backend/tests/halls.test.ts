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

describe("Halls", () => {
  beforeAll(async () => {
    await ensureRolesAndPermissions();
  });

  beforeEach(async () => {
    await truncateAllTables();
  });

  it("creates a hall with valid data", async () => {
    const token = await loginAs("operations_manager");

    const res = await request(app)
      .post("/api/v1/halls")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Salle Émeraude", capacity: 250, basePrice: 80000, features: ["parking", "sound_system"] });

    expect(res.status).toBe(201);
    expect(res.body.data.capacity).toBe(250);
    expect(res.body.data.features).toEqual(["parking", "sound_system"]);
  });

  it("rejects a non-positive capacity", async () => {
    const token = await loginAs("business_owner");
    const res = await request(app)
      .post("/api/v1/halls")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Bad Hall", capacity: 0, basePrice: 1000 });

    expect(res.status).toBe(400);
  });

  it("forbids Operations Manager from archiving a hall (Business Owner only per matrix)", async () => {
    const ownerToken = await loginAs("business_owner");
    const created = await request(app)
      .post("/api/v1/halls")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "To Archive", capacity: 100, basePrice: 5000 });

    const omToken = await loginAs("operations_manager");
    const res = await request(app)
      .post(`/api/v1/halls/${created.body.data.id}/archive`)
      .set("Authorization", `Bearer ${omToken}`);

    expect(res.status).toBe(403);
  });

  it("allows Business Owner to archive a hall", async () => {
    const token = await loginAs("business_owner");
    const created = await request(app)
      .post("/api/v1/halls")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "To Archive", capacity: 100, basePrice: 5000 });

    const res = await request(app)
      .post(`/api/v1/halls/${created.body.data.id}/archive`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("archived");
  });
});
