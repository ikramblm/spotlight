import { parse } from "csv-parse/sync";
import { AppError } from "../../lib/AppError";
import type { BulkGuestRow } from "./repository";

function normalizeHeader(key: string): string {
  return key.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

// A guardrail, not a realistic guest-list size: without a cap, one oversized CSV would run
// thousands of sequential single-row INSERTs (see bulkInsertGuests) on the shared connection
// pool, starving every other request for however long that takes.
export const MAX_IMPORT_ROWS = 2000;

/** Accepts a "full_name,phone,email" style CSV (header names are matched loosely: spaces,
 * underscores and case are ignored, so "Full Name" / "full_name" / "fullname" all work).
 * Rows missing a name are skipped rather than failing the whole import; the import only fails
 * outright when nothing usable came out of it. */
export function parseGuestsCsv(csv: string): BulkGuestRow[] {
  let records: Record<string, string>[];
  try {
    records = parse(csv, { columns: true, skip_empty_lines: true, trim: true });
  } catch (err) {
    throw AppError.badRequest(`Could not parse CSV: ${(err as Error).message}`);
  }

  if (records.length > MAX_IMPORT_ROWS) {
    throw AppError.badRequest(`CSV has ${records.length} rows; the limit is ${MAX_IMPORT_ROWS} per import`);
  }

  const rows: BulkGuestRow[] = [];
  const errors: string[] = [];

  records.forEach((record, index) => {
    const normalized: Record<string, string> = {};
    for (const [key, value] of Object.entries(record)) {
      normalized[normalizeHeader(key)] = value;
    }

    const fullName = normalized["fullname"] || normalized["name"];
    if (!fullName) {
      errors.push(`Row ${index + 2}: missing full name`);
      return;
    }

    rows.push({
      fullName,
      phone: normalized["phone"] || undefined,
      email: normalized["email"] || undefined,
    });
  });

  if (rows.length === 0) {
    throw AppError.badRequest("No valid guest rows found in the CSV", {
      csv: errors.join("; ") || "no rows",
    });
  }

  return rows;
}
