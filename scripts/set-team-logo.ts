// Dev helper: set a team's logo URL by (partial) display-name match.
// Refuses a non-local DB unless --force-remote, so it can't hit prod by accident.
//
//   npx tsx scripts/set-team-logo.ts "Inglewood" "https://…logo.png"
//   npx tsx scripts/set-team-logo.ts "Inglewood" "https://…" --force-remote
import dotenv from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

// If DATABASE_URL is passed inline (e.g. a prod run), respect it. Otherwise
// match Next's env precedence so we hit the same DB the dev server uses.
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: ".env" });
  dotenv.config({ path: ".env.local", override: true });
}

const args = process.argv.slice(2).filter((a) => a !== "--force-remote");
const forceRemote = process.argv.includes("--force-remote");
const [needle, url] = args;

function host(u?: string) {
  try {
    return new URL(u ?? "").host;
  } catch {
    return "(unparseable)";
  }
}
const isLocal = (u?: string) => {
  const h = host(u);
  return h.startsWith("localhost") || h.startsWith("127.0.0.1");
};

async function main() {
  if (!needle || !url) {
    console.error('Usage: set-team-logo.ts "<name match>" "<logo url>"');
    process.exitCode = 1;
    return;
  }
  const connectionString = process.env.DATABASE_URL;
  console.log(`Target DB host: ${host(connectionString)}`);
  if (!isLocal(connectionString) && !forceRemote) {
    console.error(
      "REFUSING: non-local DB. Re-run with --force-remote if you really mean it.",
    );
    process.exitCode = 1;
    return;
  }

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    const matches = await db.team.findMany({
      where: { displayName: { contains: needle, mode: "insensitive" } },
      select: { id: true, displayName: true, league: true, logo: true },
    });
    if (matches.length === 0) {
      console.error(`No team matching "${needle}".`);
      process.exitCode = 1;
      return;
    }
    if (matches.length > 1) {
      console.error(
        `Ambiguous — ${matches.length} teams match "${needle}":\n` +
          matches.map((m) => `  ${m.league}  ${m.displayName}`).join("\n"),
      );
      process.exitCode = 1;
      return;
    }
    const t = matches[0];
    console.log(`Match: ${t.league} · ${t.displayName}`);
    console.log(`  old logo: ${t.logo ?? "(none)"}`);
    await db.team.update({ where: { id: t.id }, data: { logo: url } });
    console.log(`  new logo: ${url}`);
    console.log("Updated.");
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
