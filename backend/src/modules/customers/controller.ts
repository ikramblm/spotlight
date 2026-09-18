import type { Request, Response } from "express";
import { AppError } from "../../lib/AppError";
import * as customersService from "./service";
import type { ArchiveCustomerInput, CreateCustomerInput, ListCustomersQuery, UpdateCustomerInput } from "./schema";

function requireActor(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.id;
}

export async function createCustomer(req: Request, res: Response) {
  const customer = await customersService.createCustomer(req.body as CreateCustomerInput, requireActor(req));
  res.status(201).json({ data: customer });
}

export async function listCustomers(req: Request, res: Response) {
  const filters = req.query as unknown as ListCustomersQuery;
  const { rows, total } = await customersService.listCustomers(filters);
  res.status(200).json({ data: rows, meta: { page: filters.page, pageSize: filters.pageSize, total } });
}

export async function getCustomer(req: Request, res: Response) {
  const { customer, summary, bookings } = await customersService.getCustomerDetail(req.params.id as string);
  res.status(200).json({
    data: {
      ...customer,
      totalPaid: summary.total_paid,
      outstandingBalance: summary.outstanding_balance,
      bookingCount: Number(summary.booking_count),
      bookings,
    },
  });
}

export async function updateCustomer(req: Request, res: Response) {
  const customer = await customersService.updateCustomer(
    req.params.id as string,
    req.body as UpdateCustomerInput,
    requireActor(req)
  );
  res.status(200).json({ data: customer });
}

export async function archiveCustomer(req: Request, res: Response) {
  const { reason } = req.body as ArchiveCustomerInput;
  const customer = await customersService.archiveCustomer(req.params.id as string, requireActor(req), reason);
  res.status(200).json({ data: customer });
}
