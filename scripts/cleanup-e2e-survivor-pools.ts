// Dev helper: remove leftover E2E survivor pools created by the Playwright
// bot (owner "testplaywright", titles starting with "E2E ").
//
// Dry-run by default (lists what WOULD be deleted). Pass --delete to remove.
// Refuses to delete from a non-local (e.g. Neon) host unless --force-remote,
// so it can't accidentally nuke the production DB.
//
//   npx tsx scripts/cleanup-e2e-survivor-pools.ts            # dry run
//   npx tsx scripts/cleanup-e2e-survivor-pools.ts --delete   # delete (local only)
import dotenv from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

// Mirror Next.js env precedence so we hit the same DB the dev server uses:
// .env first, then .env.local overrides it.
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });

const BOT_USERNAME = "testplaywright";
const TITLE_PREFIX = "E2E ";

const doDelete = process.argv.includes("--delete");
const forceRemote = process.argv.includes("--force-remote");

function hostOf(url: string | undefined): string {
  if (!url) return "(DATABASE_URL not set)";
  try {
    return new URL(url).host; // host:port only — no credentials
  } catch {
    return "(unparseable DATABASE_URL)";
  }
}

function isLocal(url: string | undefined): boolean {
  const h = hostOf(url);
  return h.startsWith("localhost") || h.startsWith("127.0.0.1");
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const host = hostOf(connectionString);
  console.log(`Target DB host: ${host}`);
  console.log(`Mode: ${doDelete ? "DELETE" : "dry run"}\n`);

  const adapter = new PrismaPg({ connectionString });
  const db = new PrismaClient({ adapter });

  try {
    const pools = await db.survivorPool.findMany({
      where: {
        title: { startsWith: TITLE_PREFIX },
        owner: { username: BOT_USERNAME },
      },
      select: {
        id: true,
        title: true,
        joinCode: true,
        createdAt: true,
        _count: { select: { members: true, picks: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    console.log(
      `Found ${pools.length} pool(s) owned by "${BOT_USERNAME}" with title starting "${TITLE_PREFIX}":`,
    );
    for (const p of pools) {
      console.log(
        `  ${p.joinCode}  ${p.title}  (members: ${p._count.members}, picks: ${p._count.picks})`,
      );
    }

    if (pools.length === 0) {
      console.log("\nNothing to do.");
      return;
    }

    if (!doDelete) {
      console.log("\nDry run — pass --delete to remove these (cascades to their entries & picks).");
      return;
    }

    if (!isLocal(connectionString) && !forceRemote) {
      console.error(
        `\nREFUSING to delete: host "${host}" is not local. ` +
          `Re-run with --force-remote only if you are certain you want to delete from this DB.`,
      );
      process.exitCode = 1;
      return;
    }

    const ids = pools.map((p) => p.id);
    const res = await db.survivorPool.deleteMany({ where: { id: { in: ids } } });
    console.log(`\nDeleted ${res.count} pool(s). Their SurvivorEntry/SurvivorPick rows cascaded.`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
