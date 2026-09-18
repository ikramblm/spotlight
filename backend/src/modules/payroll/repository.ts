import { query } from "../../config/db";
import type { ListPayrollQuery } from "./schema";

export interface PayrollRow {
  id: string;
  employee_id: string;
  employee_name: string;
  period_start: string;
  period_end: string;
  base_salary: string;
  bonuses: string;
  deductions: string;
  net_pay: string;
  payment_date: string | null;
  payment_status: "unpaid" | "partial" | "paid";
  created_at: Date;
}

const COLUMNS = `
  p.id, p.employee_id, e.full_name AS employee_name, p.period_start, p.period_end,
  p.base_salary, p.bonuses, p.deductions, p.net_pay, p.payment_date, p.payment_status, p.created_at
`;

const JOINS = `FROM payroll p JOIN employees e ON e.id = p.employee_id`;

export interface InsertPayrollParams {
  employeeId: string;
  periodStart: string;
  periodEnd: string;
  baseSalary: number;
  bonuses: number;
  deductions: number;
}

export async function insertPayroll(input: InsertPayrollParams): Promise<PayrollRow> {
  const result = await query<{ id: string }>(
    `INSERT INTO payroll (employee_id, period_start, period_end, base_salary, bonuses, deductions)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [input.employeeId, input.periodStart, input.periodEnd, input.baseSalary, input.bonuses, input.deductions]
  );
  return getPayrollById(result.rows[0]!.id) as Promise<PayrollRow>;
}

export async function getPayrollById(id: string): Promise<PayrollRow | null> {
  const result = await query<PayrollRow>(`SELECT ${COLUMNS} ${JOINS} WHERE p.id = $1`, [id]);
  return result.rows[0] ?? null;
}

export async function listPayroll(filters: ListPayrollQuery): Promise<{ rows: PayrollRow[]; total: number }> {
  const conditions: string[] = ["1=1"];
  const params: unknown[] = [];

  if (filters.employeeId) {
    params.push(filters.employeeId);
    conditions.push(`p.employee_id = $${params.length}`);
  }
  if (filters.from) {
    params.push(filters.from);
    conditions.push(`p.period_start >= $${params.length}`);
  }
  if (filters.to) {
    params.push(filters.to);
    conditions.push(`p.period_end <= $${params.length}`);
  }

  const whereClause = `WHERE ${conditions.join(" AND ")}`;

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM payroll p ${whereClause}`,
    params
  );

  const limit = filters.pageSize;
  const offset = (filters.page - 1) * filters.pageSize;
  params.push(limit, offset);

  const rowsResult = await query<PayrollRow>(
    `SELECT ${COLUMNS} ${JOINS} ${whereClause}
     ORDER BY p.period_start DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return { rows: rowsResult.rows, total: Number(countResult.rows[0]!.count) };
}

export async function updatePayroll(
  id: string,
  input: { bonuses?: number; deductions?: number }
): Promise<PayrollRow | null> {
  const sets: string[] = [];
  const params: unknown[] = [];

  if (input.bonuses !== undefined) {
    params.push(input.bonuses);
    sets.push(`bonuses = $${params.length}`);
  }
  if (input.deductions !== undefined) {
    params.push(input.deductions);
    sets.push(`deductions = $${params.length}`);
  }

  if (sets.length === 0) {
    return getPayrollById(id);
  }

  params.push(id);
  await query(`UPDATE payroll SET ${sets.join(", ")} WHERE id = $${params.length}`, params);
  return getPayrollById(id);
}

export async function markPaid(id: string, paymentDate: string): Promise<PayrollRow | null> {
  await query(`UPDATE payroll SET payment_status = 'paid', payment_date = $1 WHERE id = $2`, [paymentDate, id]);
  return getPayrollById(id);
}
