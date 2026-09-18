import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import sharp from "sharp";
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

describe("Confiscations and restitution", () => {
  let securityToken: string;
  let eventId: string;
  let guestId: string;
  let testImagePath: string;

  beforeAll(async () => {
    await ensureRolesAndPermissions();
    testImagePath = path.join(os.tmpdir(), "spotlight-test-photo.png");
    await sharp({ create: { width: 4, height: 4, channels: 3, background: { r: 200, g: 30, b: 30 } } })
      .png()
      .toFile(testImagePath);
  });

  afterAll(async () => {
    await fs.rm(testImagePath, { force: true });
  });

  beforeEach(async () => {
    await truncateAllTables();
    const ownerId = await createTestUser({ email: "owner@test.local", password: "owner-pass", role: "business_owner" });
    securityToken = await loginAs("security_staff");

    const customerId = await createTestCustomer({ phone: "0555666777" });
    const hallId = await createTestHall({ name: "Confiscation Hall" });
    const start = new Date();
    start.setHours(18, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 0, 0, 0);
    const booking = await createTestBooking({ customerId, hallId, createdBy: ownerId, startTime: start, endTime: end });
    eventId = booking.eventId;

    const guest = await request(app)
      .post(`/api/v1/events/${eventId}/guests`)
      .set("Authorization", `Bearer ${securityToken}`)
      .send({ fullName: "Item Owner" });
    guestId = guest.body.data.id;
  });

  it("records a confiscated item without a photo", async () => {
    const res = await request(app)
      .post("/api/v1/confiscations")
      .set("Authorization", `Bearer ${securityToken}`)
      .field("guestId", guestId)
      .field("itemType", "phone")
      .field("storageReference", "L-101");

    expect(res.status).toBe(201);
    expect(res.body.data.guest_name).toBe("Item Owner");
    expect(res.body.data.status).toBe("holding");
    expect(res.body.data.has_photo).toBe(false);
  });

  it("records a confiscated item with a photo, and serves it back as a JPEG", async () => {
    const created = await request(app)
      .post("/api/v1/confiscations")
      .set("Authorization", `Bearer ${securityToken}`)
      .field("guestId", guestId)
      .field("itemType", "phone")
      .field("storageReference", "L-102")
      .attach("photo", testImagePath);

    expect(created.status).toBe(201);
    expect(created.body.data.has_photo).toBe(true);

    const photo = await request(app)
      .get(`/api/v1/confiscations/${created.body.data.id}/photo`)
      .set("Authorization", `Bearer ${securityToken}`);
    expect(photo.status).toBe(200);
    expect(photo.headers["content-type"]).toBe("image/jpeg");
  });

  it("rejects a non-image file uploaded as the photo", async () => {
    const badFile = path.join(os.tmpdir(), "spotlight-test-not-an-image.txt");
    await fs.writeFile(badFile, "this is not an image");

    const res = await request(app)
      .post("/api/v1/confiscations")
      .set("Authorization", `Bearer ${securityToken}`)
      .field("guestId", guestId)
      .field("itemType", "phone")
      .field("storageReference", "L-103")
      .attach("photo", badFile);

    expect(res.status).toBe(400);
    await fs.rm(badFile, { force: true });
  });

  it("rejects a second item using the same storage tag while the first is still held", async () => {
    await request(app)
      .post("/api/v1/confiscations")
      .set("Authorization", `Bearer ${securityToken}`)
      .field("guestId", guestId)
      .field("itemType", "phone")
      .field("storageReference", "L-200")
      .expect(201);

    const res = await request(app)
      .post("/api/v1/confiscations")
      .set("Authorization", `Bearer ${securityToken}`)
      .field("guestId", guestId)
      .field("itemType", "other")
      .field("storageReference", "L-200");

    expect(res.status).toBe(409);
  });

  it("allows reusing a storage tag once the first item using it has been returned", async () => {
    const first = await request(app)
      .post("/api/v1/confiscations")
      .set("Authorization", `Bearer ${securityToken}`)
      .field("guestId", guestId)
      .field("itemType", "phone")
      .field("storageReference", "L-300");

    await request(app)
      .post(`/api/v1/confiscations/${first.body.data.id}/return`)
      .set("Authorization", `Bearer ${securityToken}`)
      .send({ returnedToNote: "guest in person" })
      .expect(200);

    const second = await request(app)
      .post("/api/v1/confiscations")
      .set("Authorization", `Bearer ${securityToken}`)
      .field("guestId", guestId)
      .field("itemType", "phone")
      .field("storageReference", "L-300");

    expect(second.status).toBe(201);
  });

  it("marks an item returned, recording who returned it and when (spec §12)", async () => {
    const created = await request(app)
      .post("/api/v1/confiscations")
      .set("Authorization", `Bearer ${securityToken}`)
      .field("guestId", guestId)
      .field("itemType", "phone")
      .field("storageReference", "L-400");

    const res = await request(app)
      .post(`/api/v1/confiscations/${created.body.data.id}/return`)
      .set("Authorization", `Bearer ${securityToken}`)
      .send({ returnedToNote: "guest in person" });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("returned");
    expect(res.body.data.restitution.returned_to_note).toBe("guest in person");
  });

  it("prevents an accidental duplicate restitution (spec §30 rule #7)", async () => {
    const created = await request(app)
      .post("/api/v1/confiscations")
      .set("Authorization", `Bearer ${securityToken}`)
      .field("guestId", guestId)
      .field("itemType", "phone")
      .field("storageReference", "L-500");

    await request(app)
      .post(`/api/v1/confiscations/${created.body.data.id}/return`)
      .set("Authorization", `Bearer ${securityToken}`)
      .send({})
      .expect(200);

    const second = await request(app)
      .post(`/api/v1/confiscations/${created.body.data.id}/return`)
      .set("Authorization", `Bearer ${securityToken}`)
      .send({});

    expect(second.status).toBe(400);
  });

  describe("role permissions (matrix §6: BO F, OM R, EC —, SS F)", () => {
    it("allows Operations Manager to view but not create or return", async () => {
      const created = await request(app)
        .post("/api/v1/confiscations")
        .set("Authorization", `Bearer ${securityToken}`)
        .field("guestId", guestId)
        .field("itemType", "phone")
        .field("storageReference", "L-600");

      const omToken = await loginAs("operations_manager");

      const view = await request(app).get(`/api/v1/confiscations/${created.body.data.id}`).set("Authorization", `Bearer ${omToken}`);
      expect(view.status).toBe(200);

      const create = await request(app)
        .post("/api/v1/confiscations")
        .set("Authorization", `Bearer ${omToken}`)
        .field("guestId", guestId)
        .field("itemType", "phone")
        .field("storageReference", "L-601");
      expect(create.status).toBe(403);

      const returnItem = await request(app)
        .post(`/api/v1/confiscations/${created.body.data.id}/return`)
        .set("Authorization", `Bearer ${omToken}`)
        .send({});
      expect(returnItem.status).toBe(403);
    });

    it("forbids Event Coordinator from any confiscation access", async () => {
      const ecToken = await loginAs("event_coordinator");
      const res = await request(app).get("/api/v1/confiscations").set("Authorization", `Bearer ${ecToken}`);
      expect(res.status).toBe(403);
    });
  });
});
