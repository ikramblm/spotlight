import { AppError } from "../../lib/AppError";
import { recordArchive } from "../../lib/archive";
import { recordAudit } from "../../lib/audit";
import * as employeesRepo from "./repository";
import type { CreateEmployeeInput, ListEmployeesQuery, UpdateEmployeeInput } from "./schema";

const FOREIGN_KEY_VIOLATION = "23503";
const UNIQUE_VIOLATION = "23505";

function friendlyDbError(err: unknown): AppError | null {
  if (typeof err !== "object" || err === null) return null;
  const code = (err as { code?: string }).code;
  if (code === FOREIGN_KEY_VIOLATION) {
    return AppError.badRequest("That user account does not exist", { userId: "not found" });
  }
  if (code === UNIQUE_VIOLATION) {
    return AppError.conflict("That user account is already linked to another employee");
  }
  return null;
}

export async function createEmployee(input: CreateEmployeeInput, actorId: string) {
  let employee;
  try {
    employee = await employeesRepo.insertEmployee(input);
  } catch (err) {
    throw friendlyDbError(err) ?? err;
  }

  await recordAudit({ userId: actorId, action: "employee.create", entityType: "employee", entityId: employee.id });
  return employee;
}

export async function listEmployees(filters: ListEmployeesQuery) {
  return employeesRepo.listEmployees(filters);
}

export async function getEmployee(id: string) {
  const employee = await employeesRepo.getEmployeeById(id);
  if (!employee) {
    throw AppError.notFound("Employee not found");
  }
  return employee;
}

export async function updateEmployee(id: string, input: UpdateEmployeeInput, actorId: string) {
  await getEmployee(id);

  let updated;
  try {
    updated = await employeesRepo.updateEmployee(id, input);
  } catch (err) {
    throw friendlyDbError(err) ?? err;
  }

  await recordAudit({ userId: actorId, action: "employee.update", entityType: "employee", entityId: id });
  return updated;
}

export async function archiveEmployee(id: string, actorId: string, reason?: string) {
  await getEmployee(id);
  const archived = await employeesRepo.archiveEmployee(id);
  await recordAudit({ userId: actorId, action: "employee.archive", entityType: "employee", entityId: id });
  await recordArchive({ entityType: "employee", entityId: id, reason, archivedBy: actorId });
  return archived;
}
