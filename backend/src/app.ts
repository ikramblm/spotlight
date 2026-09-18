import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { defaultRateLimiter } from "./middleware/rateLimit";
import { archivesRouter } from "./modules/archives/routes";
import { auditLogsRouter } from "./modules/audit-logs/routes";
import { authRouter } from "./modules/auth/routes";
import { bookingRequestsRouter } from "./modules/booking-requests/routes";
import { bookingsRouter } from "./modules/bookings/routes";
import { calendarRouter } from "./modules/calendar/routes";
import { caterersRouter } from "./modules/caterers/routes";
import { checkinRouter } from "./modules/checkin/routes";
import { confiscationsRouter } from "./modules/confiscations/routes";
import { customersRouter } from "./modules/customers/routes";
import { dashboardRouter } from "./modules/dashboard/routes";
import { employeesRouter } from "./modules/employees/routes";
import { equipmentRouter } from "./modules/equipment/routes";
import { expenseCategoriesRouter, expensesRouter } from "./modules/expenses/routes";
import { eventGuestsRouter, guestsRouter } from "./modules/guests/routes";
import { hallsRouter } from "./modules/halls/routes";
import { invitationsRouter, publicRsvpRouter } from "./modules/invitations-rsvp/routes";
import { employeePayrollRouter, payrollRouter } from "./modules/payroll/routes";
import { servicesRouter } from "./modules/services/routes";
import { suppliersRouter } from "./modules/suppliers/routes";
import { usersRouter } from "./modules/users/routes";

export function createApp() {
  const app = express();

  app.use(
    helmet({
      // Helmet's v5+ default (same-origin) would let the browser block the Flutter web app -
      // running on its own origin - from loading the QR-code and confiscation-photo images this
      // API serves. Cross-origin is safe here: every route that returns real data is still
      // gated by `authenticate`/`requirePermission` or a public route's own token, so CORP
      // (which only affects who's allowed to *embed* a response) isn't doing any access-control
      // work in this API.
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(defaultRateLimiter);

  app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/users", usersRouter);
  app.use("/api/v1/customers", customersRouter);
  app.use("/api/v1/halls", hallsRouter);
  app.use("/api/v1/services", servicesRouter);
  app.use("/api/v1/booking-requests", bookingRequestsRouter);
  app.use("/api/v1/bookings", bookingsRouter);
  app.use("/api/v1/calendar", calendarRouter);
  app.use("/api/v1/events/:eventId/guests", eventGuestsRouter);
  app.use("/api/v1/guests", guestsRouter);
  app.use("/api/v1/invitations", invitationsRouter);
  app.use("/api/v1/public/rsvp", publicRsvpRouter);
  app.use("/api/v1/checkin", checkinRouter);
  app.use("/api/v1/confiscations", confiscationsRouter);
  app.use("/api/v1/expense-categories", expenseCategoriesRouter);
  app.use("/api/v1/expenses", expensesRouter);
  app.use("/api/v1/employees/:employeeId/payroll", employeePayrollRouter);
  app.use("/api/v1/employees", employeesRouter);
  app.use("/api/v1/payroll", payrollRouter);
  app.use("/api/v1/caterers", caterersRouter);
  app.use("/api/v1/suppliers", suppliersRouter);
  app.use("/api/v1/equipment", equipmentRouter);
  app.use("/api/v1/archives", archivesRouter);
  app.use("/api/v1/audit-logs", auditLogsRouter);
  app.use("/api/v1/dashboard", dashboardRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
