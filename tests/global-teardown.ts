// Playwright global teardown: remove the data the survivor suite creates each
// run — E2E-titled pools, plus the throwaway `e2e_` signup users (their pools
// cascade). Local DBs only, so a misconfigured run can't wipe a remote DB.
//
// Uses raw pg rather than the generated Prisma client — the latter relies on
// import.meta and won't load under Playwright's CJS transform.
import { Client } from "pg";
import dotenv from "dotenv";

// Match Next's env precedence so we hit the same DB the dev server uses.
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });

export default async function globalTeardown() {
  const connectionString = process.env.DATABASE_URL;
  let host = "";
  try {
    host = new URL(connectionString ?? "").host;
  } catch {
    /* ignore */
  }
  if (!host.startsWith("localhost") && !host.startsWith("127.0.0.1")) {
    console.log(`[teardown] skipping non-local DB (${host || "unset"})`);
    return;
  }

  const db = new Client({ connectionString });
  await db.connect();
  try {
    const pools = await db.query(`DELETE FROM "SurvivorPool" WHERE title LIKE 'E2E %'`);
    const users = await db.query(`DELETE FROM "User" WHERE username LIKE 'e2e\\_%'`);
    console.log(
      `[teardown] removed ${pools.rowCount} E2E pool(s), ${users.rowCount} e2e_ user(s)`,
    );
  } finally {
    await db.end();
  }
}
