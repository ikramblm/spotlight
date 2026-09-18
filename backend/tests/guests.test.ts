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

async function loginAs(role: "business_owner" | "security_staff") {
  const email = `${role}@test.local`;
  await createTestUser({ email, password: "test-pass", role });
  const res = await request(app).post("/api/v1/auth/login").send({ email, password: "test-pass" });
  return res.body.data.accessToken as string;
}

describe("Guests", () => {
  let ownerToken: string;
  let eventId: string;

  beforeAll(async () => {
    await ensureRolesAndPermissions();
  });

  beforeEach(async () => {
    await truncateAllTables();
    const ownerId = await createTestUser({ email: "owner@test.local", password: "owner-pass", role: "business_owner" });
    const login = await request(app).post("/api/v1/auth/login").send({ email: "owner@test.local", password: "owner-pass" });
    ownerToken = login.body.data.accessToken;

    const customerId = await createTestCustomer({ phone: "0555111222" });
    const hallId = await createTestHall({ name: "Guest Hall" });
    const start = new Date();
    start.setHours(18, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 0, 0, 0);
    const booking = await createTestBooking({ customerId, hallId, createdBy: ownerId, startTime: start, endTime: end });
    eventId = booking.eventId;
  });

  it("adds a guest to an event", async () => {
    const res = await request(app)
      .post(`/api/v1/events/${eventId}/guests`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ fullName: "Yacine Kaddour", phone: "0555000111" });

    expect(res.status).toBe(201);
    expect(res.body.data.full_name).toBe("Yacine Kaddour");
    expect(res.body.data.rsvp_status).toBeNull();
    expect(res.body.data.checked_in).toBe(false);
  });

  it("imports guests from CSV, tolerating a missing-name row", async () => {
    const csv = "full_name,phone,email\nSarah Amrani,0555222333,sarah@example.com\n,0555000000,\nKarim Belaid,,karim@example.com";

    const res = await request(app)
      .post(`/api/v1/events/${eventId}/guests/import`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ csv });

    expect(res.status).toBe(201);
    expect(res.body.data.imported).toBe(2);

    const list = await request(app)
      .get(`/api/v1/events/${eventId}/guests`)
      .set("Authorization", `Bearer ${ownerToken}`);
    expect(list.body.data).toHaveLength(2);
  });

  it("rejects a CSV with no valid rows", async () => {
    const res = await request(app)
      .post(`/api/v1/events/${eventId}/guests/import`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ csv: "full_name,phone\n,0555000000" });

    expect(res.status).toBe(400);
  });

  it("rejects a CSV over MAX_IMPORT_ROWS instead of running thousands of sequential inserts", async () => {
    const rows = Array.from({ length: 2001 }, (_, i) => `Guest ${i}`).join("\n");
    const res = await request(app)
      .post(`/api/v1/events/${eventId}/guests/import`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ csv: `full_name\n${rows}` });

    expect(res.status).toBe(400);
  });

  it("computes attendance stats across invited/rsvp/checked-in guests", async () => {
    await request(app)
      .post(`/api/v1/events/${eventId}/guests`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ fullName: "Guest One" })
      .expect(201);

    const stats = await request(app)
      .get(`/api/v1/events/${eventId}/guests/stats`)
      .set("Authorization", `Bearer ${ownerToken}`);

    expect(stats.status).toBe(200);
    expect(stats.body.data.total_guests).toBe("1");
    expect(stats.body.data.invited).toBe("0");
  });

  it("forbids Security Staff from browsing the guest list (spec §2: no unrelated info)", async () => {
    const securityToken = await loginAs("security_staff");
    const res = await request(app)
      .get(`/api/v1/events/${eventId}/guests`)
      .set("Authorization", `Bearer ${securityToken}`);
    expect(res.status).toBe(403);
  });

  it("edits a guest's details", async () => {
    const created = await request(app)
      .post(`/api/v1/events/${eventId}/guests`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ fullName: "Old Name" });

    const res = await request(app)
      .patch(`/api/v1/guests/${created.body.data.id}`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ fullName: "New Name" });

    expect(res.status).toBe(200);
    expect(res.body.data.full_name).toBe("New Name");
  });

  it("exports the guest list as CSV", async () => {
    await request(app)
      .post(`/api/v1/events/${eventId}/guests`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ fullName: "Exported Guest", phone: "0555999888" });

    const res = await request(app)
      .get(`/api/v1/events/${eventId}/guests/export`)
      .set("Authorization", `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/csv");
    expect(res.text).toContain("Exported Guest");
    expect(res.text.split("\r\n")[0]).toBe("Name,Phone,Email,RSVP status,Checked in,Notes");
  });
});
