import type { Request, Response } from "express";
import { AppError } from "../../lib/AppError";
import * as employeesService from "./service";
import type { ArchiveEmployeeInput, CreateEmployeeInput, ListEmployeesQuery, UpdateEmployeeInput } from "./schema";

function requireActor(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.id;
}

export async function createEmployee(req: Request, res: Response) {
  const employee = await employeesService.createEmployee(req.body as CreateEmployeeInput, requireActor(req));
  res.status(201).json({ data: employee });
}

export async function listEmployees(req: Request, res: Response) {
  const filters = req.query as unknown as ListEmployeesQuery;
  const { rows, total } = await employeesService.listEmployees(filters);
  res.status(200).json({ data: rows, meta: { page: filters.page, pageSize: filters.pageSize, total } });
}

export async function getEmployee(req: Request, res: Response) {
  const employee = await employeesService.getEmployee(req.params.id as string);
  res.status(200).json({ data: employee });
}

export async function updateEmployee(req: Request, res: Response) {
  const employee = await employeesService.updateEmployee(
    req.params.id as string,
    req.body as UpdateEmployeeInput,
    requireActor(req)
  );
  res.status(200).json({ data: employee });
}

export async function archiveEmployee(req: Request, res: Response) {
  const { reason } = req.body as ArchiveEmployeeInput;
  const employee = await employeesService.archiveEmployee(req.params.id as string, requireActor(req), reason);
  res.status(200).json({ data: employee });
}
