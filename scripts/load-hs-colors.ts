// Set primary colors for Texas HS teams (researched from public sources).
// Logos aren't reliably hot-linkable for HS, so we rely on colored marks.
import "dotenv/config";
import { db } from "@/lib/db";

const COLORS: Record<string, string> = {
  Akins: "001F5B",
  Anderson: "00529B",
  "Antonian Prep": "C8102E",
  "Austin High": "800000",
  "Boerne-Champion": "001F3F",
  Bowie: "111111",
  "Brazos Christian": "001F5B",
  "Buda Johnson": "1A1A1A",
  "Cedar Creek": "1034A6",
  "Cedar Park": "14452F",
  "Cedar Ridge": "4B0082",
  "Cornerstone Christian": "001F5B",
  "Del Valle": "C8102E",
  "Dripping Springs": "800000",
  "East View": "C8102E",
  Episcopal: "00529B",
  "Euless Trinity": "111111",
  "Harker Heights": "C8102E",
  Harlan: "111111",
  Hays: "CE1126",
  Hutto: "D25D12",
  "Hyde Park": "1A2A4F",
  "Inglewood (CA)": "00543C",
  Jarrell: "4169E1",
  Johnson: "1A1A1A",
  Judson: "CE1126",
  Kinkaid: "4B2E83",
  "Lake Travis": "A6192E",
  Leander: "00338D",
  Lehman: "4169E1",
  "Liberty Hill": "4B0082",
  Lockhart: "800000",
  Manor: "CC0000",
  McCallum: "4169E1",
  McNeil: "1A2A4F",
  "Midland Legacy": "800000",
  Pflugerville: "00338D",
  Prosper: "2E7D32",
  Regents: "1F2D5A",
  "Round Rock": "7A0019",
  "Round Rock Westwood": "E87722",
  Rouse: "9E1B32",
  "San Antonio Brennan": "1A1A1A",
  "San Antonio Christian": "782F40",
  "San Antonio Wagner": "C8102E",
  Seguin: "1A1A1A",
  "Smithson Valley": "041E42",
  "St. Anthony": "FFCC00",
  "St. Joseph Academy": "C8102E",
  Steele: "1A1A1A",
  "Stony Point": "003087",
  "Texas Legacy Football Academy": "888888",
  Vandegrift: "1A1A1A",
  "Vista Ridge": "041E42",
  Weiss: "A6192E",
  Westlake: "092DDC",
  Westwood: "E87722",
};

async function main() {
  let updated = 0;
  for (const [name, color] of Object.entries(COLORS)) {
    const res = await db.team.updateMany({
      where: { league: "HS6A", displayName: name },
      data: { color },
    });
    updated += res.count;
  }
  console.log(`Set colors on ${updated} HS team rows (${Object.keys(COLORS).length} names).`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
