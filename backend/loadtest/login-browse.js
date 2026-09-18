// k6 load test: logs in once per virtual user, then repeatedly hits the read-heavy endpoints
// real usage leans on hardest - the calendar, the dashboard, and a paginated list - to see how
// the API holds up under concurrent load before this build goes anywhere near production.
//
// Run (k6 itself isn't a Node dependency - install separately, https://k6.io/docs/get-started/installation/):
//
//   k6 run -e BASE_URL=http://localhost:4000/api/v1 -e EMAIL=owner@spotlight.local -e PASSWORD=... backend/loadtest/login-browse.js
//
// Point BASE_URL/EMAIL/PASSWORD at a real, seeded, non-production environment - this script
// logs in and generates read traffic repeatedly; never run it against production data.

import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:4000/api/v1";
const EMAIL = __ENV.EMAIL || "owner@spotlight.local";
const PASSWORD = __ENV.PASSWORD || "ChangeMe123!";

export const options = {
  scenarios: {
    ramping: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 20 },
        { duration: "1m", target: 20 },
        { duration: "30s", target: 50 },
        { duration: "1m", target: 50 },
        { duration: "30s", target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<800"],
  },
};

export default function () {
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: EMAIL, password: PASSWORD }),
    { headers: { "Content-Type": "application/json" } }
  );
  const loggedIn = check(loginRes, { "login succeeded": (r) => r.status === 200 });
  if (!loggedIn) {
    sleep(1);
    return;
  }

  const token = loginRes.json("data.accessToken");
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const today = new Date().toISOString().slice(0, 10);
  const inAWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const calendarRes = http.get(`${BASE_URL}/calendar?from=${today}&to=${inAWeek}`, authHeaders);
  check(calendarRes, { "calendar 200": (r) => r.status === 200 });

  const dashboardRes = http.get(`${BASE_URL}/dashboard`, authHeaders);
  check(dashboardRes, { "dashboard 200": (r) => r.status === 200 });

  const customersRes = http.get(`${BASE_URL}/customers?pageSize=25`, authHeaders);
  check(customersRes, { "customers 200": (r) => r.status === 200 });

  sleep(1);
}
