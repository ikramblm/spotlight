import { AppError } from "../../lib/AppError";
import { recordAudit } from "../../lib/audit";
import * as employeesRepo from "../employees/repository";
import * as payrollRepo from "./repository";
import type { CreatePayrollInput, ListPayrollQuery, MarkPaidInput, UpdatePayrollInput } from "./schema";

const UNIQUE_VIOLATION = "23505";

function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === UNIQUE_VIOLATION;
}

function todayDateOnly(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function createPayroll(input: CreatePayrollInput, actorId: string) {
  const employee = await employeesRepo.getEmployeeById(input.employeeId);
  if (!employee) {
    throw AppError.notFound("Employee not found");
  }

  let payroll;
  try {
    payroll = await payrollRepo.insertPayroll({
      employeeId: input.employeeId,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      baseSalary: input.baseSalary ?? Number(employee.base_salary),
      bonuses: input.bonuses,
      deductions: input.deductions,
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw AppError.conflict("Payroll for this period already exists for this employee");
    }
    throw err;
  }

  await recordAudit({
    userId: actorId,
    action: "payroll.create",
    entityType: "payroll",
    entityId: payroll.id,
    metadata: { employeeId: input.employeeId, netPay: payroll.net_pay },
  });

  return payroll;
}

export async function listPayroll(filters: ListPayrollQuery) {
  return payrollRepo.listPayroll(filters);
}

export async function getPayroll(id: string) {
  const payroll = await payrollRepo.getPayrollById(id);
  if (!payroll) {
    throw AppError.notFound("Payroll record not found");
  }
  return payroll;
}

export async function updatePayroll(id: string, input: UpdatePayrollInput, actorId: string) {
  const existing = await getPayroll(id);
  if (existing.payment_status === "paid") {
    throw AppError.badRequest("This payroll run has already been paid and can no longer be edited");
  }

  const updated = await payrollRepo.updatePayroll(id, input);
  await recordAudit({ userId: actorId, action: "payroll.update", entityType: "payroll", entityId: id });
  return updated;
}

export async function markPaid(id: string, input: MarkPaidInput, actorId: string) {
  const existing = await getPayroll(id);
  if (existing.payment_status === "paid") {
    throw AppError.badRequest("This payroll run has already been paid");
  }

  const paymentDate = input.paymentDate ?? todayDateOnly();
  const updated = await payrollRepo.markPaid(id, paymentDate);

  await recordAudit({
    userId: actorId,
    action: "payroll.pay",
    entityType: "payroll",
    entityId: id,
    metadata: { employeeId: existing.employee_id, netPay: existing.net_pay },
  });

  return updated;
}
