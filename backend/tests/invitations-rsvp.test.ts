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

describe("Invitations and RSVP", () => {
  let ownerToken: string;
  let eventId: string;
  let guestId: string;

  beforeAll(async () => {
    await ensureRolesAndPermissions();
  });

  beforeEach(async () => {
    await truncateAllTables();
    const ownerId = await createTestUser({ email: "owner@test.local", password: "owner-pass", role: "business_owner" });
    const login = await request(app).post("/api/v1/auth/login").send({ email: "owner@test.local", password: "owner-pass" });
    ownerToken = login.body.data.accessToken;

    const customerId = await createTestCustomer({ phone: "0555333444" });
    const hallId = await createTestHall({ name: "Invitation Hall" });
    const start = new Date();
    start.setHours(18, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 0, 0, 0);
    const booking = await createTestBooking({ customerId, hallId, createdBy: ownerId, startTime: start, endTime: end });
    eventId = booking.eventId;

    const guest = await request(app)
      .post(`/api/v1/events/${eventId}/guests`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ fullName: "Invitee One" });
    guestId = guest.body.data.id;
  });

  it("generates an invitation with a public token for a guest", async () => {
    const res = await request(app)
      .post(`/api/v1/invitations/guest/${guestId}`)
      .set("Authorization", `Bearer ${ownerToken}`);

    expect(res.status).toBe(201);
    expect(res.body.data.public_token).toEqual(expect.any(String));
    expect(res.body.data.public_token.length).toBeGreaterThanOrEqual(40);
  });

  it("refuses to generate a second invitation for the same guest", async () => {
    await request(app).post(`/api/v1/invitations/guest/${guestId}`).set("Authorization", `Bearer ${ownerToken}`).expect(201);

    const second = await request(app)
      .post(`/api/v1/invitations/guest/${guestId}`)
      .set("Authorization", `Bearer ${ownerToken}`);

    expect(second.status).toBe(409);
  });

  it("marks an invitation as sent", async () => {
    const created = await request(app).post(`/api/v1/invitations/guest/${guestId}`).set("Authorization", `Bearer ${ownerToken}`);

    const res = await request(app)
      .post(`/api/v1/invitations/${created.body.data.id}/send`)
      .set("Authorization", `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.sent_at).not.toBeNull();
  });

  it("serves a PNG QR code for the invitation", async () => {
    const created = await request(app).post(`/api/v1/invitations/guest/${guestId}`).set("Authorization", `Bearer ${ownerToken}`);

    const res = await request(app)
      .get(`/api/v1/invitations/${created.body.data.id}/qr.png`)
      .set("Authorization", `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("image/png");
  });

  describe("public RSVP flow (spec §10: no internal account needed)", () => {
    it("looks up an invitation by token without authentication", async () => {
      const created = await request(app).post(`/api/v1/invitations/guest/${guestId}`).set("Authorization", `Bearer ${ownerToken}`);
      const token = created.body.data.public_token;

      const res = await request(app).get(`/api/v1/public/rsvp/${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.guest_name).toBe("Invitee One");
      expect(res.body.data.rsvp_status).toBe("pending");
    });

    it("lets a guest accept, recording a response date", async () => {
      const created = await request(app).post(`/api/v1/invitations/guest/${guestId}`).set("Authorization", `Bearer ${ownerToken}`);
      const token = created.body.data.public_token;

      const res = await request(app).post(`/api/v1/public/rsvp/${token}`).send({ status: "accepted", partySize: 2 });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("accepted");
      expect(res.body.data.responded_at).not.toBeNull();

      const view = await request(app).get(`/api/v1/public/rsvp/${token}`);
      expect(view.body.data.rsvp_status).toBe("accepted");
    });

    it("404s for an unknown token", async () => {
      const res = await request(app).get(`/api/v1/public/rsvp/not-a-real-token`);
      expect(res.status).toBe(404);
    });
  });
});
