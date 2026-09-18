import request from "supertest";
import { createApp } from "../src/app";
import { truncateAllTables } from "./setup";
import {
  createTestBooking,
  createTestCustomer,
  createTestHall,
  createTestSupplier,
  createTestUser,
  ensureRolesAndPermissions,
} from "./helpers";

const app = createApp();

describe("Equipment", () => {
  let ownerToken: string;
  let ownerId: string;
  let bookingId: string;

  beforeAll(async () => {
    await ensureRolesAndPermissions();
  });

  beforeEach(async () => {
    await truncateAllTables();
    ownerId = await createTestUser({ email: "owner@test.local", password: "owner-pass", role: "business_owner" });
    const login = await request(app).post("/api/v1/auth/login").send({ email: "owner@test.local", password: "owner-pass" });
    ownerToken = login.body.data.accessToken;

    const customerId = await createTestCustomer({ phone: "0555777888" });
    const hallId = await createTestHall({ name: "Equipment Hall" });
    const start = new Date();
    start.setHours(18, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 0, 0, 0);
    const booking = await createTestBooking({ customerId, hallId, createdBy: ownerId, startTime: start, endTime: end });
    bookingId = booking.bookingId;
  });

  it("creates equipment with quantity_available equal to quantity_total", async () => {
    const res = await request(app)
      .post("/api/v1/equipment")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "Round tables", category: "Furniture", quantityTotal: 20 });

    expect(res.status).toBe(201);
    expect(res.body.data.quantity_total).toBe(20);
    expect(res.body.data.quantity_available).toBe(20);
  });

  it("links equipment to a supplier", async () => {
    const supplierId = await createTestSupplier("Setif Rentals");

    const res = await request(app)
      .post("/api/v1/equipment")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "Speakers", category: "Sound", quantityTotal: 4, supplierId });

    expect(res.status).toBe(201);
    expect(res.body.data.supplier_id).toBe(supplierId);
  });

  it("assigns equipment to a booking, decrementing availability", async () => {
    const created = await request(app)
      .post("/api/v1/equipment")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "Chairs", category: "Furniture", quantityTotal: 100 });

    const res = await request(app)
      .post(`/api/v1/equipment/${created.body.data.id}/assignments`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ bookingId, quantity: 60 });

    expect(res.status).toBe(201);

    const detail = await request(app)
      .get(`/api/v1/equipment/${created.body.data.id}`)
      .set("Authorization", `Bearer ${ownerToken}`);
    expect(detail.body.data.quantity_available).toBe(40);
    expect(detail.body.data.assignments).toHaveLength(1);
  });

  it("rejects assigning more than what's available", async () => {
    const created = await request(app)
      .post("/api/v1/equipment")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "Projectors", category: "AV", quantityTotal: 2 });

    const res = await request(app)
      .post(`/api/v1/equipment/${created.body.data.id}/assignments`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ bookingId, quantity: 5 });

    expect(res.status).toBe(409);
  });

  it("returns assigned equipment, incrementing availability back", async () => {
    const created = await request(app)
      .post("/api/v1/equipment")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "Tents", category: "Structures", quantityTotal: 10 });

    const assignment = await request(app)
      .post(`/api/v1/equipment/${created.body.data.id}/assignments`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ bookingId, quantity: 4 });

    const returned = await request(app)
      .post(`/api/v1/equipment/assignments/${assignment.body.data.id}/return`)
      .set("Authorization", `Bearer ${ownerToken}`);
    expect(returned.status).toBe(200);
    expect(returned.body.data.returned_at).not.toBeNull();

    const detail = await request(app)
      .get(`/api/v1/equipment/${created.body.data.id}`)
      .set("Authorization", `Bearer ${ownerToken}`);
    expect(detail.body.data.quantity_available).toBe(10);
  });

  it("rejects returning the same assignment twice", async () => {
    const created = await request(app)
      .post("/api/v1/equipment")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "Tents", category: "Structures", quantityTotal: 10 });

    const assignment = await request(app)
      .post(`/api/v1/equipment/${created.body.data.id}/assignments`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ bookingId, quantity: 4 });

    await request(app)
      .post(`/api/v1/equipment/assignments/${assignment.body.data.id}/return`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .expect(200);

    const res = await request(app)
      .post(`/api/v1/equipment/assignments/${assignment.body.data.id}/return`)
      .set("Authorization", `Bearer ${ownerToken}`);
    expect(res.status).toBe(400);
  });

  it("rejects lowering total quantity below what's currently assigned out", async () => {
    const created = await request(app)
      .post("/api/v1/equipment")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "Linens", category: "Decor", quantityTotal: 50 });

    await request(app)
      .post(`/api/v1/equipment/${created.body.data.id}/assignments`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ bookingId, quantity: 40 })
      .expect(201);

    const res = await request(app)
      .patch(`/api/v1/equipment/${created.body.data.id}`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ quantityTotal: 5 });

    expect(res.status).toBe(400);
  });

  it("archives an equipment item", async () => {
    const created = await request(app)
      .post("/api/v1/equipment")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "Old Lights", category: "AV", quantityTotal: 3 });

    const res = await request(app)
      .post(`/api/v1/equipment/${created.body.data.id}/archive`)
      .set("Authorization", `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("archived");
  });
});
