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

async function loginAs(role: "business_owner" | "security_staff", email: string) {
  const userId = await createTestUser({ email, password: "test-pass", role });
  const res = await request(app).post("/api/v1/auth/login").send({ email, password: "test-pass" });
  return { token: res.body.data.accessToken as string, userId };
}

describe("Dashboard", () => {
  beforeAll(async () => {
    await ensureRolesAndPermissions();
  });

  beforeEach(async () => {
    await truncateAllTables();
  });

  it("returns the full KPI set for Business Owner, including today's events and financials", async () => {
    const { token, userId } = await loginAs("business_owner", "owner@test.local");
    const customerId = await createTestCustomer({ phone: "0555000111" });
    const hallId = await createTestHall({ name: "Dashboard Hall" });
    const start = new Date();
    start.setHours(18, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 0, 0, 0);
    await createTestBooking({ customerId, hallId, createdBy: userId, startTime: start, endTime: end });

    const res = await request(app).get("/api/v1/dashboard").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.todaysEventsCount).toBe(1);
    expect(res.body.data.upcomingBookingsCount).toBe(1);
    expect(res.body.data.financial).toBeDefined();
    expect(res.body.data.financial.revenueThisMonth).toBeDefined();
  });

  it("returns a narrower KPI set for Security Staff (no financials, no booking-request count)", async () => {
    const { token } = await loginAs("security_staff", "security@test.local");

    const res = await request(app).get("/api/v1/dashboard").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.financial).toBeUndefined();
    expect(res.body.data.pendingBookingRequestsCount).toBeUndefined();
    expect(res.body.data.activeConfiscationsCount).toBeDefined();
  });
});
