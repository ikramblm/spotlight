import request from "supertest";
import { createApp } from "../src/app";
import { truncateAllTables } from "./setup";
import { createTestCaterer, createTestUser, ensureRolesAndPermissions } from "./helpers";

const app = createApp();

async function loginAs(role: "business_owner" | "operations_manager") {
  const email = `${role}@test.local`;
  await createTestUser({ email, password: "test-pass", role });
  const res = await request(app).post("/api/v1/auth/login").send({ email, password: "test-pass" });
  return res.body.data.accessToken as string;
}

describe("Archives", () => {
  beforeAll(async () => {
    await ensureRolesAndPermissions();
  });

  beforeEach(async () => {
    await truncateAllTables();
  });

  it("records an archives row (with reason) whenever a module's archive endpoint is used", async () => {
    const ownerToken = await loginAs("business_owner");
    const catererId = await createTestCaterer("Archived Caterer");

    await request(app)
      .post(`/api/v1/caterers/${catererId}/archive`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ reason: "Business closed" })
      .expect(200);

    const res = await request(app)
      .get("/api/v1/archives")
      .set("Authorization", `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].entity_type).toBe("caterer");
    expect(res.body.data[0].entity_id).toBe(catererId);
    expect(res.body.data[0].reason).toBe("Business closed");
  });

  it("filters by entityType", async () => {
    const ownerToken = await loginAs("business_owner");
    const catererId = await createTestCaterer("Filtered Caterer");
    await request(app)
      .post(`/api/v1/caterers/${catererId}/archive`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({});

    const matching = await request(app)
      .get("/api/v1/archives?entityType=caterer")
      .set("Authorization", `Bearer ${ownerToken}`);
    expect(matching.body.data).toHaveLength(1);

    const notMatching = await request(app)
      .get("/api/v1/archives?entityType=hall")
      .set("Authorization", `Bearer ${ownerToken}`);
    expect(notMatching.body.data).toHaveLength(0);
  });

  it("forbids Operations Manager from browsing archives (BO-only per matrix)", async () => {
    const omToken = await loginAs("operations_manager");
    const res = await request(app).get("/api/v1/archives").set("Authorization", `Bearer ${omToken}`);
    expect(res.status).toBe(403);
  });
});
