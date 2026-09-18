import request from "supertest";
import { createApp } from "../src/app";
import { truncateAllTables } from "./setup";
import { createTestCustomer, createTestHall, createTestUser, ensureRolesAndPermissions } from "./helpers";

const app = createApp();

async function loginAs(role: "business_owner" | "security_staff") {
  const email = `${role}@test.local`;
  await createTestUser({ email, password: "test-pass", role });
  const res = await request(app).post("/api/v1/auth/login").send({ email, password: "test-pass" });
  return res.body.data.accessToken as string;
}

function iso(daysFromNow: number, hour: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysFromNow);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
}

describe("Calendar", () => {
  let ownerToken: string;
  let hallId: string;
  let customerId: string;

  beforeAll(async () => {
    await ensureRolesAndPermissions();
  });

  beforeEach(async () => {
    await truncateAllTables();
    ownerToken = await loginAs("business_owner");
    hallId = await createTestHall({ name: "Calendar Hall" });
    customerId = await createTestCustomer({ phone: "0555444333" });
  });

  it("lists a booking on the calendar within its date range, with hall and customer names joined in", async () => {
    await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        customerId,
        hallId,
        eventType: "wedding",
        startTime: iso(5, 18),
        endTime: iso(5, 23),
        totalAmount: 100000,
        advancePayment: 0,
      })
      .expect(201);

    const from = new Date();
    from.setUTCDate(from.getUTCDate() + 1);
    const to = new Date();
    to.setUTCDate(to.getUTCDate() + 10);

    const res = await request(app)
      .get("/api/v1/calendar")
      .query({ from: from.toISOString(), to: to.toISOString() })
      .set("Authorization", `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].hall_name).toBe("Calendar Hall");
    expect(res.body.data[0].status).toBe("confirmed");
    expect(res.body.data[0].event_id).toEqual(expect.any(String));
  });

  it("excludes bookings outside the requested date range", async () => {
    await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        customerId,
        hallId,
        eventType: "wedding",
        startTime: iso(60, 18),
        endTime: iso(60, 23),
        totalAmount: 100000,
        advancePayment: 0,
      })
      .expect(201);

    const from = new Date();
    from.setUTCDate(from.getUTCDate() + 1);
    const to = new Date();
    to.setUTCDate(to.getUTCDate() + 10);

    const res = await request(app)
      .get("/api/v1/calendar")
      .query({ from: from.toISOString(), to: to.toISOString() })
      .set("Authorization", `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it("reflects a cancellation immediately (spec §6: calendar reflects booking changes immediately)", async () => {
    const created = await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        customerId,
        hallId,
        eventType: "wedding",
        startTime: iso(6, 18),
        endTime: iso(6, 23),
        totalAmount: 100000,
        advancePayment: 0,
      });

    await request(app)
      .post(`/api/v1/bookings/${created.body.data.id}/cancel`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .expect(200);

    const from = new Date();
    const to = new Date();
    to.setUTCDate(to.getUTCDate() + 10);

    const res = await request(app)
      .get("/api/v1/calendar")
      .query({ from: from.toISOString(), to: to.toISOString() })
      .set("Authorization", `Bearer ${ownerToken}`);

    expect(res.body.data[0].status).toBe("canceled");
  });

  it("shows today's booking on /calendar/today", async () => {
    await request(app)
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        customerId,
        hallId,
        eventType: "wedding",
        startTime: iso(0, 12),
        endTime: iso(0, 16),
        totalAmount: 100000,
        advancePayment: 0,
      })
      .expect(201);

    const res = await request(app).get("/api/v1/calendar/today").set("Authorization", `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it("forbids Security Staff from the full calendar but allows /calendar/today (matrix §6)", async () => {
    const securityToken = await loginAs("security_staff");

    const full = await request(app)
      .get("/api/v1/calendar")
      .query({ from: new Date().toISOString(), to: new Date().toISOString() })
      .set("Authorization", `Bearer ${securityToken}`);
    expect(full.status).toBe(403);

    const today = await request(app).get("/api/v1/calendar/today").set("Authorization", `Bearer ${securityToken}`);
    expect(today.status).toBe(200);
  });
});
