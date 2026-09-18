import { query } from "../../config/db";
import type { CreateExpenseCategoryInput, CreateExpenseInput, ListExpensesQuery, UpdateExpenseInput } from "./schema";

export interface ExpenseCategoryRow {
  id: number;
  name: string;
}

export async function listCategories(): Promise<ExpenseCategoryRow[]> {
  const result = await query<ExpenseCategoryRow>(`SELECT id, name FROM expense_categories ORDER BY name ASC`);
  return result.rows;
}

export async function insertCategory(input: CreateExpenseCategoryInput): Promise<ExpenseCategoryRow> {
  const result = await query<ExpenseCategoryRow>(
    `INSERT INTO expense_categories (name) VALUES ($1) RETURNING id, name`,
    [input.name]
  );
  return result.rows[0]!;
}

export interface ExpenseRow {
  id: string;
  category_id: number;
  category_name: string;
  booking_id: string | null;
  supplier_id: string | null;
  supplier_name: string | null;
  amount: string;
  expense_date: string;
  payment_method: string;
  description: string | null;
  created_by: string;
  created_by_name: string;
  created_at: Date;
}

const COLUMNS = `
  e.id, e.category_id, c.name AS category_name, e.booking_id, e.supplier_id, s.name AS supplier_name,
  e.amount, e.expense_date, e.payment_method, e.description, e.created_by, u.full_name AS created_by_name,
  e.created_at
`;

const JOINS = `
  FROM expenses e
  JOIN expense_categories c ON c.id = e.category_id
  JOIN users u ON u.id = e.created_by
  LEFT JOIN suppliers s ON s.id = e.supplier_id
`;

export async function insertExpense(
  input: CreateExpenseInput & { createdBy: string }
): Promise<ExpenseRow> {
  const result = await query<{ id: string }>(
    `INSERT INTO expenses (category_id, booking_id, supplier_id, amount, expense_date, payment_method, description, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    [
      input.categoryId,
      input.bookingId ?? null,
      input.supplierId ?? null,
      input.amount,
      input.expenseDate,
      input.paymentMethod,
      input.description ?? null,
      input.createdBy,
    ]
  );
  return getExpenseById(result.rows[0]!.id) as Promise<ExpenseRow>;
}

export async function getExpenseById(id: string): Promise<ExpenseRow | null> {
  const result = await query<ExpenseRow>(`SELECT ${COLUMNS} ${JOINS} WHERE e.id = $1`, [id]);
  return result.rows[0] ?? null;
}

function buildFilterConditions(filters: {
  from?: string;
  to?: string;
  categoryId?: number;
}): { conditions: string[]; params: unknown[] } {
  const conditions: string[] = ["1=1"];
  const params: unknown[] = [];

  if (filters.from) {
    params.push(filters.from);
    conditions.push(`e.expense_date >= $${params.length}`);
  }
  if (filters.to) {
    params.push(filters.to);
    conditions.push(`e.expense_date <= $${params.length}`);
  }
  if (filters.categoryId) {
    params.push(filters.categoryId);
    conditions.push(`e.category_id = $${params.length}`);
  }

  return { conditions, params };
}

export async function listExpenses(
  filters: ListExpensesQuery
): Promise<{ rows: ExpenseRow[]; total: number }> {
  const { conditions, params } = buildFilterConditions(filters);
  const whereClause = `WHERE ${conditions.join(" AND ")}`;

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM expenses e ${whereClause}`,
    params
  );

  const limit = filters.pageSize;
  const offset = (filters.page - 1) * filters.pageSize;
  params.push(limit, offset);

  const rowsResult = await query<ExpenseRow>(
    `SELECT ${COLUMNS} ${JOINS} ${whereClause}
     ORDER BY e.expense_date DESC, e.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return { rows: rowsResult.rows, total: Number(countResult.rows[0]!.count) };
}

export async function listExpensesForExport(filters: {
  from?: string;
  to?: string;
  categoryId?: number;
}): Promise<ExpenseRow[]> {
  const { conditions, params } = buildFilterConditions(filters);
  const result = await query<ExpenseRow>(
    `SELECT ${COLUMNS} ${JOINS} WHERE ${conditions.join(" AND ")} ORDER BY e.expense_date DESC`,
    params
  );
  return result.rows;
}

export async function updateExpense(id: string, input: UpdateExpenseInput): Promise<ExpenseRow | null> {
  const sets: string[] = [];
  const params: unknown[] = [];

  for (const [key, column] of [
    ["categoryId", "category_id"],
    ["bookingId", "booking_id"],
    ["supplierId", "supplier_id"],
    ["amount", "amount"],
    ["expenseDate", "expense_date"],
    ["paymentMethod", "payment_method"],
    ["description", "description"],
  ] as const) {
    const value = input[key];
    if (value !== undefined) {
      params.push(value);
      sets.push(`${column} = $${params.length}`);
    }
  }

  if (sets.length === 0) {
    return getExpenseById(id);
  }

  params.push(id);
  await query(`UPDATE expenses SET ${sets.join(", ")} WHERE id = $${params.length}`, params);
  return getExpenseById(id);
}

export interface FinancialSummary {
  revenue: string;
  expenses: string;
  payments_received: string;
  outstanding_balance: string;
}

export async function getFinancialSummary(filters: { from?: string; to?: string }): Promise<FinancialSummary> {
  const bookingConditions: string[] = [`status <> 'canceled'`];
  const bookingParams: unknown[] = [];
  if (filters.from) {
    bookingParams.push(filters.from);
    bookingConditions.push(`event_date >= $${bookingParams.length}`);
  }
  if (filters.to) {
    bookingParams.push(filters.to);
    bookingConditions.push(`event_date <= $${bookingParams.length}`);
  }

  const revenueResult = await query<{ revenue: string; payments_received: string }>(
    `SELECT COALESCE(SUM(total_amount), 0)::text AS revenue,
            COALESCE(SUM(advance_payment), 0)::text AS payments_received
     FROM bookings WHERE ${bookingConditions.join(" AND ")}`,
    bookingParams
  );

  const { conditions: expenseConditions, params: expenseParams } = buildFilterConditions(filters);
  const expensesResult = await query<{ total: string }>(
    `SELECT COALESCE(SUM(amount), 0)::text AS total FROM expenses e WHERE ${expenseConditions.join(" AND ")}`,
    expenseParams
  );

  // Outstanding balance is a snapshot of money currently owed, not a date-ranged figure -
  // filtering it by event_date would hide balances from past events that are still unpaid.
  const outstandingResult = await query<{ outstanding: string }>(
    `SELECT COALESCE(SUM(remaining_balance), 0)::text AS outstanding FROM bookings WHERE status <> 'canceled'`
  );

  return {
    revenue: revenueResult.rows[0]!.revenue,
    payments_received: revenueResult.rows[0]!.payments_received,
    expenses: expensesResult.rows[0]!.total,
    outstanding_balance: outstandingResult.rows[0]!.outstanding,
  };
}

export interface CategoryBreakdownRow {
  category_id: number;
  category_name: string;
  total: string;
}

export async function getExpensesByCategory(filters: {
  from?: string;
  to?: string;
}): Promise<CategoryBreakdownRow[]> {
  const { conditions, params } = buildFilterConditions(filters);
  const result = await query<CategoryBreakdownRow>(
    `SELECT c.id AS category_id, c.name AS category_name, COALESCE(SUM(e.amount), 0)::text AS total
     FROM expense_categories c
     LEFT JOIN expenses e ON e.category_id = c.id AND ${conditions.join(" AND ")}
     GROUP BY c.id, c.name
     ORDER BY c.name ASC`,
    params
  );
  return result.rows;
}
