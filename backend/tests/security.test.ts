import jwt from "jsonwebtoken";
import request from "supertest";
import { createApp } from "../src/app";
import { truncateAllTables } from "./setup";
import { createTestUser, ensureRolesAndPermissions } from "./helpers";

const app = createApp();

// Any authenticated route works for testing the `authenticate` middleware itself - the 401s
// below happen before permission checks ever run, so the specific resource doesn't matter.
const PROTECTED_ROUTE = "/api/v1/customers";

describe("Security hardening", () => {
  beforeAll(async () => {
    await ensureRolesAndPermissions();
  });

  beforeEach(async () => {
    await truncateAllTables();
  });

  describe("JWT verification", () => {
    it("rejects a request with no Authorization header", async () => {
      const res = await request(app).get(PROTECTED_ROUTE);
      expect(res.status).toBe(401);
    });

    it("rejects a malformed Authorization header (missing 'Bearer ' prefix)", async () => {
      const res = await request(app).get(PROTECTED_ROUTE).set("Authorization", "not-a-bearer-token");
      expect(res.status).toBe(401);
    });

    it("rejects a token signed with the wrong secret", async () => {
      const forged = jwt.sign(
        { sub: "00000000-0000-0000-0000-000000000000", email: "x@x.local", role: "business_owner", permissions: [] },
        "a-completely-different-secret",
        { algorithm: "HS256", expiresIn: "15m" }
      );
      const res = await request(app).get(PROTECTED_ROUTE).set("Authorization", `Bearer ${forged}`);
      expect(res.status).toBe(401);
    });

    it("rejects an expired token, even signed with the real secret", async () => {
      const expired = jwt.sign(
        { sub: "00000000-0000-0000-0000-000000000000", email: "x@x.local", role: "business_owner", permissions: [] },
        process.env.JWT_ACCESS_SECRET!,
        { algorithm: "HS256", expiresIn: -10 }
      );
      const res = await request(app).get(PROTECTED_ROUTE).set("Authorization", `Bearer ${expired}`);
      expect(res.status).toBe(401);
    });

    it("rejects an unsigned token (alg: none) even when it claims full permissions - the classic algorithm-confusion attack", async () => {
      const noneAlgToken = jwt.sign(
        { sub: "00000000-0000-0000-0000-000000000000", email: "x@x.local", role: "business_owner", permissions: ["customers.view"] },
        "",
        { algorithm: "none" }
      );
      const res = await request(app).get(PROTECTED_ROUTE).set("Authorization", `Bearer ${noneAlgToken}`);
      expect(res.status).toBe(401);
    });

    it("accepts a validly signed, unexpired token", async () => {
      await createTestUser({ email: "owner@test.local", password: "owner-pass", role: "business_owner" });
      const login = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "owner@test.local", password: "owner-pass" });
      const res = await request(app)
        .get(PROTECTED_ROUTE)
        .set("Authorization", `Bearer ${login.body.data.accessToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe("request body limits", () => {
    it("rejects a JSON body over the 1MB limit with 413, not a generic 500", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "x@x.local", password: "x", padding: "a".repeat(2 * 1024 * 1024) });
      expect(res.status).toBe(413);
      expect(res.body.error.code).toBe("payload_too_large");
    });

    it("rejects malformed JSON with 400, not a generic 500", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .set("Content-Type", "application/json")
        .send("{not valid json");
      expect(res.status).toBe(400);
    });
  });

  describe("rate limiting", () => {
    it("locks out further login attempts after RATE_LIMIT_AUTH_MAX failures", async () => {
      await createTestUser({ email: "owner@test.local", password: "owner-pass", role: "business_owner" });

      const max = Number(process.env.RATE_LIMIT_AUTH_MAX ?? 5);
      let lastStatus = 0;
      for (let i = 0; i < max + 1; i += 1) {
        const res = await request(app)
          .post("/api/v1/auth/login")
          .send({ email: "owner@test.local", password: "wrong-password" });
        lastStatus = res.status;
      }
      expect(lastStatus).toBe(429);
    });
  });
});
