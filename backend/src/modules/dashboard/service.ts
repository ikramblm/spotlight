import { query } from "../../config/db";
import { VENUE_TIMEZONE } from "../../lib/timezone";

export interface DashboardSummary {
  todaysEventsCount?: number;
  upcomingBookingsCount?: number;
  pendingBookingRequestsCount?: number;
  activeConfiscationsCount?: number;
  financial?: {
    revenueThisMonth: string;
    outstandingBalance: string;
  };
}

// Same "venue-local calendar date" expression the calendar module's /calendar/today uses -
// deriving it from the DB session's implicit timezone instead would disagree by a day near
// midnight UTC (the exact bug documented in the Phase 3 notes).
const TODAY_EXPR = `(now() AT TIME ZONE '${VENUE_TIMEZONE}')::date`;

/**
 * Single round-trip aggregate for the dashboard (architecture doc §8). Which KPI blocks come
 * back depends on the requester's own finer-grained permissions, not a fixed shape - a Security
 * Staff account and a Business Owner account hitting the same endpoint get different summaries.
 */
export async function getDashboard(permissions: string[]): Promise<DashboardSummary> {
  const summary: DashboardSummary = {};
  const jobs: Promise<void>[] = [];

  if (permissions.includes("calendar.view") || permissions.includes("calendar.view_today")) {
    jobs.push(
      query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM bookings WHERE status = 'confirmed' AND event_date = ${TODAY_EXPR}`
      ).then((r) => {
        summary.todaysEventsCount = Number(r.rows[0]!.count);
      })
    );
  }

  if (permissions.includes("calendar.view")) {
    jobs.push(
      query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM bookings
         WHERE status = 'confirmed' AND event_date >= ${TODAY_EXPR} AND event_date < ${TODAY_EXPR} + INTERVAL '7 days'`
      ).then((r) => {
        summary.upcomingBookingsCount = Number(r.rows[0]!.count);
      })
    );
  }

  if (permissions.includes("booking_requests.view")) {
    jobs.push(
      query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM booking_requests WHERE status = 'pending'`
      ).then((r) => {
        summary.pendingBookingRequestsCount = Number(r.rows[0]!.count);
      })
    );
  }

  if (permissions.includes("confiscations.view")) {
    jobs.push(
      query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM confiscations WHERE status = 'holding'`
      ).then((r) => {
        summary.activeConfiscationsCount = Number(r.rows[0]!.count);
      })
    );
  }

  if (permissions.includes("expenses.view")) {
    jobs.push(
      (async () => {
        const [revenueResult, outstandingResult] = await Promise.all([
          query<{ revenue: string }>(
            `SELECT COALESCE(SUM(total_amount), 0)::text AS revenue FROM bookings
             WHERE status <> 'canceled'
               AND event_date >= date_trunc('month', ${TODAY_EXPR})::date
               AND event_date < (date_trunc('month', ${TODAY_EXPR}) + INTERVAL '1 month')::date`
          ),
          query<{ outstanding: string }>(
            `SELECT COALESCE(SUM(remaining_balance), 0)::text AS outstanding FROM bookings WHERE status <> 'canceled'`
          ),
        ]);
        summary.financial = {
          revenueThisMonth: revenueResult.rows[0]!.revenue,
          outstandingBalance: outstandingResult.rows[0]!.outstanding,
        };
      })()
    );
  }

  await Promise.all(jobs);
  return summary;
}
