// Creates tables. Run: npm run db:setup  (reads DATABASE_URL from .env.local)
import { readFileSync } from "node:fs";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is empty. Fill it in .env.local first.");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: url,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});

const statements = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8")
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

try {
  await client.connect();
  for (const s of statements) await client.query(s);
  console.log(`OK: ran ${statements.length} statements.`);
} catch (e) {
  console.error("Database setup failed:", e.message);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
