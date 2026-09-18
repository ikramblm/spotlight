import request from "supertest";
import { createApp } from "../src/app";
import { truncateAllTables } from "./setup";
import { createTestCustomer, createTestHall, createTestUser, ensureRolesAndPermissions } from "./helpers";

const app = createApp();

async function loginAsOwner() {
  await createTestUser({ email: "owner@test.local", password: "owner-pass", role: "business_owner" });
  const res = await request(app).post("/api/v1/auth/login").send({ email: "owner@test.local", password: "owner-pass" });
  return res.body.data.accessToken as string;
}

function iso(daysFromNow: number, hour: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysFromNow);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
}

describe("Booking requests", () => {
  let token: string;
  let hallId: string;
  let customerId: string;

  beforeAll(async () => {
    await ensureRolesAndPermissions();
  });

  beforeEach(async () => {
    await truncateAllTables();
    token = await loginAsOwner();
    hallId = await createTestHall({ name: "Request Hall" });
    customerId = await createTestCustomer({ phone: "0555222333" });
  });

  async function createRequest(overrides: Partial<Record<string, unknown>> = {}) {
    return request(app)
      .post("/api/v1/booking-requests")
      .set("Authorization", `Bearer ${token}`)
      .send({
        customerId,
        hallId,
        eventType: "wedding",
        startTime: iso(40, 18),
        endTime: iso(40, 23),
        requestedServices: ["catering"],
        ...overrides,
      });
  }

  it("creates a booking request in pending status", async () => {
    const res = await createRequest();
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("pending");
  });

  it("cannot be approved or rejected twice", async () => {
    const created = await createRequest();
    const id = created.body.data.id;

    const approved = await request(app)
      .post(`/api/v1/booking-requests/${id}/approve`)
      .set("Authorization", `Bearer ${token}`);
    expect(approved.status).toBe(200);
    expect(approved.body.data.status).toBe("approved");

    const secondApprove = await request(app)
      .post(`/api/v1/booking-requests/${id}/approve`)
      .set("Authorization", `Bearer ${token}`);
    expect(secondApprove.status).toBe(400);
  });

  it("rejects a request and records the decision", async () => {
    const created = await createRequest();
    const res = await request(app)
      .post(`/api/v1/booking-requests/${created.body.data.id}/reject`)
      .set("Authorization", `Bearer ${token}`)
      .send({ reason: "Hall unavailable that day" });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("rejected");
  });

  it("converts an approved request into a confirmed booking", async () => {
    const created = await createRequest();
    await request(app)
      .post(`/api/v1/booking-requests/${created.body.data.id}/approve`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    const converted = await request(app)
      .post(`/api/v1/booking-requests/${created.body.data.id}/convert`)
      .set("Authorization", `Bearer ${token}`)
      .send({ totalAmount: 250000, advancePayment: 50000, guestCount: 150 });

    expect(converted.status).toBe(201);
    expect(converted.body.data.status).toBe("confirmed");
    expect(converted.body.data.remaining_balance).toBe("200000.00");
    expect(converted.body.data.hall_id).toBe(hallId);
  });

  it("cannot convert a request that is still pending", async () => {
    const created = await createRequest();
    const res = await request(app)
      .post(`/api/v1/booking-requests/${created.body.data.id}/convert`)
      .set("Authorization", `Bearer ${token}`)
      .send({ totalAmount: 100000, advancePayment: 0 });

    expect(res.status).toBe(400);
  });

  it("cannot convert the same approved request twice (spec §4: prevent invalid bookings)", async () => {
    const created = await createRequest();
    await request(app)
      .post(`/api/v1/booking-requests/${created.body.data.id}/approve`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    await request(app)
      .post(`/api/v1/booking-requests/${created.body.data.id}/convert`)
      .set("Authorization", `Bearer ${token}`)
      .send({ totalAmount: 250000, advancePayment: 0 })
      .expect(201);

    const secondConvert = await request(app)
      .post(`/api/v1/booking-requests/${created.body.data.id}/convert`)
      .set("Authorization", `Bearer ${token}`)
      .send({ totalAmount: 250000, advancePayment: 0 });

    expect(secondConvert.status).toBe(409);
  });

  it("converting into an already-booked slot on the hall still fails with a conflict", async () => {
    // Someone else books the hall directly for the same slot after the request was made.
    await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({
        customerId,
        hallId,
        eventType: "birthday",
        startTime: iso(40, 18),
        endTime: iso(40, 23),
        totalAmount: 50000,
        advancePayment: 0,
      })
      .expect(201);

    const created = await createRequest();
    await request(app)
      .post(`/api/v1/booking-requests/${created.body.data.id}/approve`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    const converted = await request(app)
      .post(`/api/v1/booking-requests/${created.body.data.id}/convert`)
      .set("Authorization", `Bearer ${token}`)
      .send({ totalAmount: 250000, advancePayment: 0 });

    expect(converted.status).toBe(409);
  });
});
