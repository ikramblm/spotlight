import request from "supertest";
import { createApp } from "../src/app";
import { truncateAllTables } from "./setup";
import { createTestUser, ensureRolesAndPermissions } from "./helpers";

const app = createApp();

describe("Auth", () => {
  beforeAll(async () => {
    await ensureRolesAndPermissions();
  });

  beforeEach(async () => {
    await truncateAllTables();
  });

  describe("POST /api/v1/auth/login", () => {
    it("logs in with correct credentials and returns tokens + user", async () => {
      await createTestUser({ email: "owner@test.local", password: "correct-horse", role: "business_owner" });

      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "owner@test.local", password: "correct-horse" });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toEqual(expect.any(String));
      expect(res.body.data.refreshToken).toEqual(expect.any(String));
      expect(res.body.data.user.email).toBe("owner@test.local");
      expect(res.body.data.user.role).toBe("business_owner");
    });

    it("rejects an incorrect password without revealing which part was wrong", async () => {
      await createTestUser({ email: "owner@test.local", password: "correct-horse", role: "business_owner" });

      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "owner@test.local", password: "wrong-password" });

      expect(res.status).toBe(401);
      expect(res.body.error.message).toMatch(/invalid email or password/i);
    });

    it("rejects login for an email that does not exist, with the same generic message", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "nobody@test.local", password: "whatever" });

      expect(res.status).toBe(401);
      expect(res.body.error.message).toMatch(/invalid email or password/i);
    });

    it("rejects login for a deactivated account", async () => {
      await createTestUser({
        email: "inactive@test.local",
        password: "correct-horse",
        role: "business_owner",
        isActive: false,
      });

      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "inactive@test.local", password: "correct-horse" });

      expect(res.status).toBe(403);
    });

    it("rejects a malformed request body", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({ email: "not-an-email" });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("bad_request");
    });
  });

  describe("POST /api/v1/auth/refresh", () => {
    it("rotates the refresh token and issues a new access token", async () => {
      await createTestUser({ email: "owner@test.local", password: "correct-horse", role: "business_owner" });
      const login = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "owner@test.local", password: "correct-horse" });

      const res = await request(app)
        .post("/api/v1/auth/refresh")
        .send({ refreshToken: login.body.data.refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.data.refreshToken).not.toBe(login.body.data.refreshToken);

      // The old refresh token must no longer work (single-use rotation).
      const reuse = await request(app)
        .post("/api/v1/auth/refresh")
        .send({ refreshToken: login.body.data.refreshToken });
      expect(reuse.status).toBe(401);
    });

    it("rejects an unknown refresh token", async () => {
      const res = await request(app).post("/api/v1/auth/refresh").send({ refreshToken: "not-a-real-token" });
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/v1/auth/logout", () => {
    it("revokes the refresh token so it can no longer be used", async () => {
      await createTestUser({ email: "owner@test.local", password: "correct-horse", role: "business_owner" });
      const login = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "owner@test.local", password: "correct-horse" });

      const logout = await request(app)
        .post("/api/v1/auth/logout")
        .send({ refreshToken: login.body.data.refreshToken });
      expect(logout.status).toBe(204);

      const res = await request(app)
        .post("/api/v1/auth/refresh")
        .send({ refreshToken: login.body.data.refreshToken });
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/v1/auth/me", () => {
    it("rejects a request with no access token", async () => {
      const res = await request(app).get("/api/v1/auth/me");
      expect(res.status).toBe(401);
    });

    it("returns the authenticated user for a valid access token", async () => {
      await createTestUser({ email: "owner@test.local", password: "correct-horse", role: "business_owner" });
      const login = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "owner@test.local", password: "correct-horse" });

      const res = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${login.body.data.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe("owner@test.local");
    });
  });
});
