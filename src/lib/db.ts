import { Pool } from "pg";
import { env } from "./env";

// Reuse one pool across hot reloads / warm serverless invocations.
const g = globalThis as unknown as { __pgPool?: Pool };

function pool(): Pool {
  if (!g.__pgPool) {
    g.__pgPool = new Pool({
      connectionString: env("DATABASE_URL"),
      // Set DATABASE_SSL=true for hosted DBs whose URL has no sslmode (Neon URLs already include it).
      ssl: env("DATABASE_SSL", true) === "true" ? { rejectUnauthorized: false } : undefined,
      max: 5,
      idleTimeoutMillis: 10_000,
    });
  }
  return g.__pgPool;
}

/** Run a parameterised query. Always use $1, $2 ... placeholders, never string concatenation. */
export async function q<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  const r = await pool().query(text, params);
  return r.rows as T[];
}
