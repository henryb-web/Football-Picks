// Download HS team logos and self-host them under public/logos, then point
// Team.logo at the local path. Verifies each download is a real image so a bad
// URL is skipped (team keeps its colored dot).
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { db } from "@/lib/db";
import { HS_LOGOS } from "./data/hs-logos";

function slug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  const dir = path.join(process.cwd(), "public", "logos");
  fs.mkdirSync(dir, { recursive: true });

  let ok = 0;
  const skipped: string[] = [];
  for (const [name, url] of Object.entries(HS_LOGOS)) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "PickSix/0.1 (+local)" } });
      const type = res.headers.get("content-type") ?? "";
      if (!res.ok || !type.startsWith("image")) {
        skipped.push(`${name} (${res.status} ${type})`);
        continue;
      }
      const ext = type.includes("webp") ? "webp" : type.includes("svg") ? "svg" : "png";
      const file = `${slug(name)}.${ext}`;
      fs.writeFileSync(path.join(dir, file), Buffer.from(await res.arrayBuffer()));
      await db.team.updateMany({
        where: { league: "HS6A", displayName: name },
        data: { logo: `/logos/${file}` },
      });
      ok += 1;
    } catch (e) {
      skipped.push(`${name} (${e instanceof Error ? e.message : "error"})`);
    }
  }

  console.log(`Logos: ${ok} downloaded + set.`);
  if (skipped.length) console.log("Skipped:", skipped.join(", "));
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
