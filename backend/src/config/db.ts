import { Pool, type PoolClient } from "pg";
import { env } from "./env";

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

pool.on("error", (err) => {
  // eslint-disable-next-line no-console
  console.error("Unexpected error on idle Postgres client", err);
});

export interface Result<T> {
  rows: T[];
  rowCount: number | null;
}

export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<Result<T>> {
  const result = await pool.query(text, params);
  return result as unknown as Result<T>;
}

/** Runs `work` inside a BEGIN/COMMIT, rolling back and releasing the client on any error.
 * Prefer this over hand-rolling BEGIN/COMMIT/ROLLBACK per call site (several modules already
 * did, before this existed - not worth touching now that they work, but this is the pattern
 * for anything new that needs multi-statement atomicity or a row lock). */
export async function withTransaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
