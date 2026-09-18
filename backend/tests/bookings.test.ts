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

describe("Bookings", () => {
  let token: string;
  let hallId: string;
  let customerId: string;

  beforeAll(async () => {
    await ensureRolesAndPermissions();
  });

  beforeEach(async () => {
    await truncateAllTables();
    token = await loginAsOwner();
    hallId = await createTestHall({ name: "Grand Hall" });
    customerId = await createTestCustomer({ phone: "0555000111" });
  });

  describe("creation and remaining balance", () => {
    it("creates a booking and computes remaining balance = total - advance (spec §5)", async () => {
      const res = await request(app)
        .post("/api/v1/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({
          customerId,
          hallId,
          eventType: "wedding",
          startTime: iso(10, 18),
          endTime: iso(10, 23),
          totalAmount: 300000,
          advancePayment: 100000,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.remaining_balance).toBe("200000.00");
      expect(res.body.data.payment_status).toBe("partial");
    });

    it("marks payment_status as paid when advance equals the total", async () => {
      const res = await request(app)
        .post("/api/v1/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({
          customerId,
          hallId,
          eventType: "wedding",
          startTime: iso(11, 18),
          endTime: iso(11, 23),
          totalAmount: 150000,
          advancePayment: 150000,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.remaining_balance).toBe("0.00");
      expect(res.body.data.payment_status).toBe("paid");
    });

    it("rejects an advance payment greater than the total amount", async () => {
      const res = await request(app)
        .post("/api/v1/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({
          customerId,
          hallId,
          eventType: "wedding",
          startTime: iso(12, 18),
          endTime: iso(12, 23),
          totalAmount: 100000,
          advancePayment: 150000,
        });

      expect(res.status).toBe(400);
    });

    it("rejects an end time before the start time", async () => {
      const res = await request(app)
        .post("/api/v1/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({
          customerId,
          hallId,
          eventType: "wedding",
          startTime: iso(13, 18),
          endTime: iso(13, 10),
          totalAmount: 100000,
          advancePayment: 0,
        });

      expect(res.status).toBe(400);
    });
  });

  describe("booking-conflict prevention (spec §30 rule #1)", () => {
    it("rejects a second confirmed booking that overlaps the same hall and time", async () => {
      const first = await request(app)
        .post("/api/v1/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({
          customerId,
          hallId,
          eventType: "wedding",
          startTime: iso(20, 18),
          endTime: iso(20, 23),
          totalAmount: 100000,
          advancePayment: 0,
        });
      expect(first.status).toBe(201);

      const overlapping = await request(app)
        .post("/api/v1/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({
          customerId,
          hallId,
          eventType: "birthday",
          startTime: iso(20, 20), // overlaps 18:00-23:00
          endTime: iso(20, 22),
          totalAmount: 50000,
          advancePayment: 0,
        });

      expect(overlapping.status).toBe(409);
    });

    it("allows a second booking on the same hall for a non-overlapping time", async () => {
      const first = await request(app)
        .post("/api/v1/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({
          customerId,
          hallId,
          eventType: "wedding",
          startTime: iso(21, 12),
          endTime: iso(21, 16),
          totalAmount: 100000,
          advancePayment: 0,
        });
      expect(first.status).toBe(201);

      const separate = await request(app)
        .post("/api/v1/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({
          customerId,
          hallId,
          eventType: "birthday",
          startTime: iso(21, 18), // starts after the first one ends
          endTime: iso(21, 22),
          totalAmount: 50000,
          advancePayment: 0,
        });

      expect(separate.status).toBe(201);
    });

    it("allows a new booking to reuse a slot freed by canceling the conflicting booking", async () => {
      const first = await request(app)
        .post("/api/v1/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({
          customerId,
          hallId,
          eventType: "wedding",
          startTime: iso(22, 18),
          endTime: iso(22, 23),
          totalAmount: 100000,
          advancePayment: 0,
        });
      expect(first.status).toBe(201);

      await request(app)
        .post(`/api/v1/bookings/${first.body.data.id}/cancel`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      const second = await request(app)
        .post("/api/v1/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({
          customerId,
          hallId,
          eventType: "birthday",
          startTime: iso(22, 18),
          endTime: iso(22, 23),
          totalAmount: 80000,
          advancePayment: 0,
        });

      expect(second.status).toBe(201);
    });

    it("does not let editing a booking's time create an overlap with another booking", async () => {
      await request(app)
        .post("/api/v1/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({
          customerId,
          hallId,
          eventType: "wedding",
          startTime: iso(23, 18),
          endTime: iso(23, 23),
          totalAmount: 100000,
          advancePayment: 0,
        });

      const second = await request(app)
        .post("/api/v1/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({
          customerId,
          hallId,
          eventType: "birthday",
          startTime: iso(24, 12),
          endTime: iso(24, 16),
          totalAmount: 50000,
          advancePayment: 0,
        });
      expect(second.status).toBe(201);

      const edit = await request(app)
        .patch(`/api/v1/bookings/${second.body.data.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ startTime: iso(23, 20), endTime: iso(23, 22) });

      expect(edit.status).toBe(409);
    });
  });

  describe("payment updates", () => {
    it("updates advance payment and recomputes remaining balance + payment status", async () => {
      const created = await request(app)
        .post("/api/v1/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({
          customerId,
          hallId,
          eventType: "wedding",
          startTime: iso(30, 18),
          endTime: iso(30, 23),
          totalAmount: 200000,
          advancePayment: 0,
        });
      expect(created.body.data.payment_status).toBe("unpaid");

      const paid = await request(app)
        .patch(`/api/v1/bookings/${created.body.data.id}/payments`)
        .set("Authorization", `Bearer ${token}`)
        .send({ advancePayment: 200000 });

      expect(paid.status).toBe(200);
      expect(paid.body.data.remaining_balance).toBe("0.00");
      expect(paid.body.data.payment_status).toBe("paid");
    });

    it("rejects a payment update that would exceed the total amount", async () => {
      const created = await request(app)
        .post("/api/v1/bookings")
        .set("Authorization", `Bearer ${token}`)
        .send({
          customerId,
          hallId,
          eventType: "wedding",
          startTime: iso(31, 18),
          endTime: iso(31, 23),
          totalAmount: 100000,
          advancePayment: 0,
        });

      const res = await request(app)
        .patch(`/api/v1/bookings/${created.body.data.id}/payments`)
        .set("Authorization", `Bearer ${token}`)
        .send({ advancePayment: 150000 });

      expect(res.status).toBe(400);
    });
  });
});
