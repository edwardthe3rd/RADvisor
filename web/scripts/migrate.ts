/**
 * Apply SQL migrations from supabase/migrations/ to the linked Supabase project.
 *
 * Requires a direct Postgres connection string (Dashboard → Settings → Database):
 *
 *   SUPABASE_DB_URL=postgresql://postgres.[ref]:[password]@...pooler.supabase.com:6543/postgres
 *
 *   cd web && npm run migrate
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const migrationsDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../supabase/migrations",
);

const dbUrl = process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL;
if (!dbUrl) {
  console.error(
    "SUPABASE_DB_URL (or DATABASE_URL) is required.\n" +
      "Supabase dashboard → Settings → Database → Connection string (URI).",
  );
  process.exit(1);
}

async function main() {
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    for (const file of files) {
      const sql = readFileSync(join(migrationsDir, file), "utf8");
      console.log(`applying ${file}...`);
      await client.query(sql);
    }
    console.log(`migrations complete (${files.length} file(s))`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
