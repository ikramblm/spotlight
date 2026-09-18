import request from "supertest";
import { createApp } from "../src/app";
import { truncateAllTables } from "./setup";
import { createTestExpenseCategory, createTestUser, ensureRolesAndPermissions } from "./helpers";

const app = createApp();

describe("Suppliers", () => {
  let ownerToken: string;

  beforeAll(async () => {
    await ensureRolesAndPermissions();
  });

  beforeEach(async () => {
    await truncateAllTables();
    await createTestUser({ email: "owner@test.local", password: "owner-pass", role: "business_owner" });
    const login = await request(app).post("/api/v1/auth/login").send({ email: "owner@test.local", password: "owner-pass" });
    ownerToken = login.body.data.accessToken;
  });

  it("creates a supplier", async () => {
    const res = await request(app)
      .post("/api/v1/suppliers")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "Fournitures Setif", products: ["linens", "chairs"] });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe("Fournitures Setif");
  });

  it("shows purchase history from linked expenses", async () => {
    const supplier = await request(app)
      .post("/api/v1/suppliers")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "Fournitures Setif" });
    const categoryId = await createTestExpenseCategory("Decoration");

    await request(app)
      .post("/api/v1/expenses")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        categoryId,
        supplierId: supplier.body.data.id,
        amount: 12000,
        expenseDate: "2026-03-10",
        paymentMethod: "cash",
      })
      .expect(201);

    const detail = await request(app)
      .get(`/api/v1/suppliers/${supplier.body.data.id}`)
      .set("Authorization", `Bearer ${ownerToken}`);

    expect(detail.status).toBe(200);
    expect(detail.body.data.purchaseHistory).toHaveLength(1);
    expect(detail.body.data.purchaseHistory[0].amount).toBe("12000.00");
  });

  it("archives a supplier", async () => {
    const created = await request(app)
      .post("/api/v1/suppliers")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "To Archive" });

    const res = await request(app)
      .post(`/api/v1/suppliers/${created.body.data.id}/archive`)
      .set("Authorization", `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("archived");
  });
});
