import type { Request, Response } from "express";
import { AppError } from "../../lib/AppError";
import * as payrollService from "./service";
import type { CreatePayrollInput, ListPayrollQuery, MarkPaidInput, UpdatePayrollInput } from "./schema";

function requireActor(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.id;
}

export async function createPayroll(req: Request, res: Response) {
  const payroll = await payrollService.createPayroll(req.body as CreatePayrollInput, requireActor(req));
  res.status(201).json({ data: payroll });
}

export async function listPayroll(req: Request, res: Response) {
  const filters = req.query as unknown as ListPayrollQuery;
  const { rows, total } = await payrollService.listPayroll(filters);
  res.status(200).json({ data: rows, meta: { page: filters.page, pageSize: filters.pageSize, total } });
}

export async function listPayrollForEmployee(req: Request, res: Response) {
  const filters = { ...(req.query as unknown as ListPayrollQuery), employeeId: req.params.employeeId as string };
  const { rows, total } = await payrollService.listPayroll(filters);
  res.status(200).json({ data: rows, meta: { page: filters.page, pageSize: filters.pageSize, total } });
}

export async function getPayroll(req: Request, res: Response) {
  const payroll = await payrollService.getPayroll(req.params.id as string);
  res.status(200).json({ data: payroll });
}

export async function updatePayroll(req: Request, res: Response) {
  const payroll = await payrollService.updatePayroll(
    req.params.id as string,
    req.body as UpdatePayrollInput,
    requireActor(req)
  );
  res.status(200).json({ data: payroll });
}

export async function markPaid(req: Request, res: Response) {
  const payroll = await payrollService.markPaid(req.params.id as string, req.body as MarkPaidInput, requireActor(req));
  res.status(200).json({ data: payroll });
}
