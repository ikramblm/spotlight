import request from "supertest";
import { createApp } from "../src/app";
import { truncateAllTables } from "./setup";
import {
  createTestBooking,
  createTestCustomer,
  createTestHall,
  createTestUser,
  ensureRolesAndPermissions,
} from "./helpers";

const app = createApp();

async function loginAs(role: "business_owner" | "event_coordinator") {
  const email = `${role}@test.local`;
  await createTestUser({ email, password: "test-pass", role });
  const res = await request(app).post("/api/v1/auth/login").send({ email, password: "test-pass" });
  return res.body.data.accessToken as string;
}

describe("Caterers", () => {
  let ownerToken: string;
  let ownerId: string;

  beforeAll(async () => {
    await ensureRolesAndPermissions();
  });

  beforeEach(async () => {
    await truncateAllTables();
    ownerId = await createTestUser({ email: "owner@test.local", password: "owner-pass", role: "business_owner" });
    const login = await request(app).post("/api/v1/auth/login").send({ email: "owner@test.local", password: "owner-pass" });
    ownerToken = login.body.data.accessToken;
  });

  it("creates a caterer", async () => {
    const res = await request(app)
      .post("/api/v1/caterers")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "Saveurs d'Alger", services: ["buffet", "pastries"] });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe("Saveurs d'Alger");
    expect(res.body.data.services).toEqual(["buffet", "pastries"]);
  });

  it("assigns a caterer to a booking and shows it in the caterer's detail view", async () => {
    const created = await request(app)
      .post("/api/v1/caterers")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "Le Traiteur" });

    const customerId = await createTestCustomer({ phone: "0555123123" });
    const hallId = await createTestHall({ name: "Caterer Hall" });
    const start = new Date();
    start.setHours(18, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 0, 0, 0);
    const { bookingId } = await createTestBooking({ customerId, hallId, createdBy: ownerId, startTime: start, endTime: end });

    await request(app)
      .post(`/api/v1/caterers/${created.body.data.id}/bookings`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ bookingId })
      .expect(204);

    const detail = await request(app)
      .get(`/api/v1/caterers/${created.body.data.id}`)
      .set("Authorization", `Bearer ${ownerToken}`);

    expect(detail.status).toBe(200);
    expect(detail.body.data.assignedBookings).toHaveLength(1);
    expect(detail.body.data.assignedBookings[0].booking_id).toBe(bookingId);
  });

  it("unassigns a caterer from a booking", async () => {
    const created = await request(app)
      .post("/api/v1/caterers")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "Le Traiteur" });

    const customerId = await createTestCustomer({ phone: "0555456456" });
    const hallId = await createTestHall({ name: "Caterer Hall 2" });
    const start = new Date();
    start.setHours(18, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 0, 0, 0);
    const { bookingId } = await createTestBooking({ customerId, hallId, createdBy: ownerId, startTime: start, endTime: end });

    await request(app)
      .post(`/api/v1/caterers/${created.body.data.id}/bookings`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ bookingId })
      .expect(204);

    await request(app)
      .delete(`/api/v1/caterers/${created.body.data.id}/bookings/${bookingId}`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .expect(204);

    const detail = await request(app)
      .get(`/api/v1/caterers/${created.body.data.id}`)
      .set("Authorization", `Bearer ${ownerToken}`);
    expect(detail.body.data.assignedBookings).toHaveLength(0);
  });

  it("forbids Event Coordinator from creating a caterer (read-only per matrix)", async () => {
    const ecToken = await loginAs("event_coordinator");
    const res = await request(app)
      .post("/api/v1/caterers")
      .set("Authorization", `Bearer ${ecToken}`)
      .send({ name: "Should Fail" });
    expect(res.status).toBe(403);
  });

  it("allows Event Coordinator to view caterers", async () => {
    const ecToken = await loginAs("event_coordinator");
    const res = await request(app).get("/api/v1/caterers").set("Authorization", `Bearer ${ecToken}`);
    expect(res.status).toBe(200);
  });
});
