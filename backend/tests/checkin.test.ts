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

async function loginAs(role: "business_owner" | "operations_manager" | "event_coordinator" | "security_staff") {
  const email = `${role}@test.local`;
  await createTestUser({ email, password: "test-pass", role });
  const res = await request(app).post("/api/v1/auth/login").send({ email, password: "test-pass" });
  return res.body.data.accessToken as string;
}

describe("QR check-in", () => {
  let ownerToken: string;
  let ownerId: string;
  let customerId: string;
  let hallId: string;

  beforeAll(async () => {
    await ensureRolesAndPermissions();
  });

  beforeEach(async () => {
    await truncateAllTables();
    ownerId = await createTestUser({ email: "owner@test.local", password: "owner-pass", role: "business_owner" });
    const login = await request(app).post("/api/v1/auth/login").send({ email: "owner@test.local", password: "owner-pass" });
    ownerToken = login.body.data.accessToken;

    customerId = await createTestCustomer({ phone: "0555555666" });
    hallId = await createTestHall({ name: "Checkin Hall" });
  });

  async function inviteAcceptedGuestToday() {
    const start = new Date();
    start.setHours(18, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 0, 0, 0);
    const { eventId } = await createTestBooking({ customerId, hallId, createdBy: ownerId, startTime: start, endTime: end });

    const guest = await request(app)
      .post(`/api/v1/events/${eventId}/guests`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ fullName: "Accepted Guest" });

    const invitation = await request(app)
      .post(`/api/v1/invitations/guest/${guest.body.data.id}`)
      .set("Authorization", `Bearer ${ownerToken}`);
    const token = invitation.body.data.public_token as string;

    await request(app).post(`/api/v1/public/rsvp/${token}`).send({ status: "accepted", partySize: 1 }).expect(200);

    return { eventId, guestId: guest.body.data.id as string, token };
  }

  it("grants access on first scan for an accepted RSVP on today's event", async () => {
    const { token } = await inviteAcceptedGuestToday();

    const res = await request(app)
      .post("/api/v1/checkin/scan")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ token });

    expect(res.status).toBe(200);
    expect(res.body.data.accessResult).toBe("granted");
    expect(res.body.data.guestName).toBe("Accepted Guest");
  });

  it("denies a scan when the guest never RSVP'd (spec §11: verify invitation/access status)", async () => {
    const start = new Date();
    start.setHours(18, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 0, 0, 0);
    const { eventId } = await createTestBooking({ customerId, hallId, createdBy: ownerId, startTime: start, endTime: end });

    const guest = await request(app)
      .post(`/api/v1/events/${eventId}/guests`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ fullName: "No RSVP Guest" });
    const invitation = await request(app)
      .post(`/api/v1/invitations/guest/${guest.body.data.id}`)
      .set("Authorization", `Bearer ${ownerToken}`);

    const res = await request(app)
      .post("/api/v1/checkin/scan")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ token: invitation.body.data.public_token });

    expect(res.status).toBe(200);
    expect(res.body.data.accessResult).toBe("denied_no_rsvp");
  });

  it("denies a scan for an invitation belonging to a different day's event", async () => {
    const inFiveDays = new Date();
    inFiveDays.setDate(inFiveDays.getDate() + 5);
    inFiveDays.setHours(18, 0, 0, 0);
    const end = new Date(inFiveDays);
    end.setHours(23, 0, 0, 0);

    const { eventId } = await createTestBooking({ customerId, hallId, createdBy: ownerId, startTime: inFiveDays, endTime: end });
    const guest = await request(app)
      .post(`/api/v1/events/${eventId}/guests`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ fullName: "Future Guest" });
    const invitation = await request(app)
      .post(`/api/v1/invitations/guest/${guest.body.data.id}`)
      .set("Authorization", `Bearer ${ownerToken}`);
    await request(app)
      .post(`/api/v1/public/rsvp/${invitation.body.data.public_token}`)
      .send({ status: "accepted" })
      .expect(200);

    const res = await request(app)
      .post("/api/v1/checkin/scan")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ token: invitation.body.data.public_token });

    expect(res.body.data.accessResult).toBe("denied_wrong_event");
  });

  it("rejects an unrecognized QR token", async () => {
    const res = await request(app)
      .post("/api/v1/checkin/scan")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ token: "totally-made-up-token" });

    expect(res.status).toBe(404);
  });

  it("rejects a duplicate scan of an already-checked-in guest (spec §30 rule #5)", async () => {
    const { token } = await inviteAcceptedGuestToday();

    await request(app).post("/api/v1/checkin/scan").set("Authorization", `Bearer ${ownerToken}`).send({ token }).expect(200);

    const second = await request(app)
      .post("/api/v1/checkin/scan")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ token });

    expect(second.status).toBe(409);
  });

  it("allows a re-check-in through the explicit override workflow, recorded as its own row", async () => {
    const { token, eventId } = await inviteAcceptedGuestToday();

    await request(app).post("/api/v1/checkin/scan").set("Authorization", `Bearer ${ownerToken}`).send({ token }).expect(200);

    const overridden = await request(app)
      .post("/api/v1/checkin/override")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ token });

    expect(overridden.status).toBe(200);
    expect(overridden.body.data.accessResult).toBe("override");

    const list = await request(app)
      .get(`/api/v1/checkin/event/${eventId}`)
      .set("Authorization", `Bearer ${ownerToken}`);
    expect(list.body.data).toHaveLength(2);
  });

  it("checks a guest in manually by id, without a QR scan (spec §9)", async () => {
    const { guestId } = await inviteAcceptedGuestToday();

    const res = await request(app)
      .post(`/api/v1/checkin/guest/${guestId}`)
      .set("Authorization", `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.accessResult).toBe("granted");
  });

  describe("role permissions (matrix §6: QR check-in - BO F, OM R, EC RW, SS F)", () => {
    it("allows Operations Manager to view check-ins but not scan", async () => {
      const { token, eventId } = await inviteAcceptedGuestToday();
      const omToken = await loginAs("operations_manager");

      const scan = await request(app).post("/api/v1/checkin/scan").set("Authorization", `Bearer ${omToken}`).send({ token });
      expect(scan.status).toBe(403);

      const view = await request(app).get(`/api/v1/checkin/event/${eventId}`).set("Authorization", `Bearer ${omToken}`);
      expect(view.status).toBe(200);
    });

    it("allows Event Coordinator to scan but not override", async () => {
      const { token } = await inviteAcceptedGuestToday();
      const ecToken = await loginAs("event_coordinator");

      const scan = await request(app).post("/api/v1/checkin/scan").set("Authorization", `Bearer ${ecToken}`).send({ token });
      expect(scan.status).toBe(200);

      const override = await request(app)
        .post("/api/v1/checkin/override")
        .set("Authorization", `Bearer ${ecToken}`)
        .send({ token });
      expect(override.status).toBe(403);
    });

    it("allows Security Staff to scan and override, but not browse the guest list", async () => {
      const { token, eventId } = await inviteAcceptedGuestToday();
      const securityToken = await loginAs("security_staff");

      const scan = await request(app).post("/api/v1/checkin/scan").set("Authorization", `Bearer ${securityToken}`).send({ token });
      expect(scan.status).toBe(200);

      const override = await request(app)
        .post("/api/v1/checkin/override")
        .set("Authorization", `Bearer ${securityToken}`)
        .send({ token });
      expect(override.status).toBe(200);

      const guests = await request(app)
        .get(`/api/v1/events/${eventId}/guests`)
        .set("Authorization", `Bearer ${securityToken}`);
      expect(guests.status).toBe(403);
    });
  });
});
