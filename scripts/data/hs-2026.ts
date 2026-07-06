// Researched 2026 schedules for the tracked Texas high schools (compiled from
// public/official sources, June 2026). The loader flattens these per-school
// lists and dedupes head-to-head games by date + team pair.
//
// Westlake is intentionally omitted (already entered manually). Hyde Park is
// incomplete — its full TAPPS slate isn't published yet.

export type SchoolGame = {
  opponent: string;
  homeaway: "home" | "away";
  date: string; // YYYY-MM-DD (2026)
  time: string; // HH:MM, 24h Central
};
export type SchoolSchedule = { school: string; games: SchoolGame[] };

export const HS_2026: SchoolSchedule[] = [
  {
    school: "Austin High",
    games: [
      { opponent: "San Antonio Wagner", homeaway: "away", date: "2026-08-28", time: "19:00" },
      { opponent: "Westwood", homeaway: "home", date: "2026-09-03", time: "19:00" },
      { opponent: "Jarrell", homeaway: "home", date: "2026-09-11", time: "19:00" },
      { opponent: "East View", homeaway: "home", date: "2026-09-18", time: "19:00" },
      { opponent: "Bowie", homeaway: "home", date: "2026-09-25", time: "19:30" },
      { opponent: "Hays", homeaway: "away", date: "2026-10-02", time: "19:00" },
      { opponent: "Dripping Springs", homeaway: "home", date: "2026-10-08", time: "19:30" },
      { opponent: "Del Valle", homeaway: "away", date: "2026-10-16", time: "19:00" },
      { opponent: "Akins", homeaway: "home", date: "2026-10-22", time: "19:00" },
      { opponent: "Buda Johnson", homeaway: "away", date: "2026-10-29", time: "19:00" },
    ],
  },
  {
    school: "Dripping Springs",
    games: [
      { opponent: "Lake Travis", homeaway: "home", date: "2026-08-28", time: "19:00" },
      { opponent: "Harlan", homeaway: "home", date: "2026-09-04", time: "19:30" },
      { opponent: "Round Rock", homeaway: "away", date: "2026-09-11", time: "19:00" },
      { opponent: "Harker Heights", homeaway: "home", date: "2026-09-18", time: "19:30" },
      { opponent: "Akins", homeaway: "away", date: "2026-09-25", time: "19:30" },
      { opponent: "Buda Johnson", homeaway: "home", date: "2026-10-02", time: "19:30" },
      { opponent: "Bowie", homeaway: "home", date: "2026-10-16", time: "19:30" },
      { opponent: "Hays", homeaway: "away", date: "2026-10-23", time: "19:00" },
      { opponent: "Del Valle", homeaway: "home", date: "2026-11-05", time: "19:00" },
    ],
  },
  {
    school: "Bowie",
    games: [
      { opponent: "McNeil", homeaway: "home", date: "2026-08-28", time: "19:30" },
      { opponent: "Vista Ridge", homeaway: "away", date: "2026-09-04", time: "19:00" },
      { opponent: "Judson", homeaway: "home", date: "2026-09-11", time: "19:30" },
      { opponent: "Stony Point", homeaway: "away", date: "2026-09-18", time: "19:00" },
      { opponent: "Hays", homeaway: "home", date: "2026-10-08", time: "19:30" },
      { opponent: "Del Valle", homeaway: "home", date: "2026-10-22", time: "19:30" },
      { opponent: "Akins", homeaway: "away", date: "2026-10-29", time: "19:30" },
      { opponent: "Buda Johnson", homeaway: "home", date: "2026-11-06", time: "19:30" },
    ],
  },
  {
    school: "Lake Travis",
    games: [
      { opponent: "Weiss", homeaway: "away", date: "2026-09-04", time: "19:00" },
      { opponent: "Steele", homeaway: "away", date: "2026-09-11", time: "19:00" },
      { opponent: "Cornerstone Christian", homeaway: "home", date: "2026-09-17", time: "19:00" },
      { opponent: "McNeil", homeaway: "away", date: "2026-09-24", time: "19:00" },
      { opponent: "Cedar Ridge", homeaway: "home", date: "2026-10-09", time: "19:00" },
      { opponent: "Stony Point", homeaway: "away", date: "2026-10-16", time: "19:00" },
      { opponent: "Round Rock", homeaway: "away", date: "2026-10-30", time: "19:00" },
      { opponent: "Westwood", homeaway: "home", date: "2026-11-06", time: "19:00" },
    ],
  },
  {
    school: "Anderson",
    games: [
      { opponent: "Buda Johnson", homeaway: "away", date: "2026-08-27", time: "19:30" },
      { opponent: "Pflugerville", homeaway: "home", date: "2026-09-04", time: "19:00" },
      { opponent: "Lockhart", homeaway: "home", date: "2026-09-18", time: "19:00" },
      { opponent: "Boerne-Champion", homeaway: "away", date: "2026-09-25", time: "19:00" },
      { opponent: "Seguin", homeaway: "home", date: "2026-10-02", time: "19:00" },
      { opponent: "Smithson Valley", homeaway: "away", date: "2026-10-09", time: "19:00" },
      { opponent: "McCallum", homeaway: "home", date: "2026-10-15", time: "19:00" },
      { opponent: "Manor", homeaway: "away", date: "2026-10-23", time: "19:30" },
      { opponent: "Cedar Creek", homeaway: "home", date: "2026-10-29", time: "19:00" },
      { opponent: "Lehman", homeaway: "away", date: "2026-11-06", time: "19:30" },
    ],
  },
  {
    school: "Regents",
    games: [
      { opponent: "Brazos Christian", homeaway: "away", date: "2026-08-28", time: "19:00" },
      { opponent: "Kinkaid", homeaway: "away", date: "2026-09-04", time: "19:00" },
      { opponent: "Antonian Prep", homeaway: "home", date: "2026-09-11", time: "19:00" },
      { opponent: "Episcopal", homeaway: "home", date: "2026-09-18", time: "19:00" },
      { opponent: "St. Anthony", homeaway: "away", date: "2026-09-25", time: "19:00" },
      { opponent: "Hyde Park", homeaway: "home", date: "2026-10-02", time: "19:00" },
      { opponent: "St. Joseph Academy", homeaway: "away", date: "2026-10-16", time: "19:00" },
      { opponent: "San Antonio Christian", homeaway: "home", date: "2026-10-30", time: "19:00" },
    ],
  },
  {
    school: "Hyde Park",
    games: [
      { opponent: "Texas Legacy Football Academy", homeaway: "home", date: "2026-09-18", time: "19:00" },
    ],
  },
  {
    school: "Vandegrift",
    games: [
      { opponent: "San Antonio Brennan", homeaway: "away", date: "2026-08-28", time: "19:30" },
      { opponent: "Buda Johnson", homeaway: "home", date: "2026-09-04", time: "19:00" },
      { opponent: "Liberty Hill", homeaway: "away", date: "2026-09-11", time: "19:00" },
      { opponent: "Round Rock", homeaway: "home", date: "2026-09-18", time: "19:00" },
      { opponent: "East View", homeaway: "home", date: "2026-10-02", time: "19:00" },
      { opponent: "Vista Ridge", homeaway: "away", date: "2026-10-08", time: "19:00" },
      { opponent: "Cedar Park", homeaway: "home", date: "2026-10-16", time: "19:00" },
      { opponent: "Leander", homeaway: "away", date: "2026-10-23", time: "19:00" },
      { opponent: "Rouse", homeaway: "home", date: "2026-10-30", time: "19:00" },
      { opponent: "Hutto", homeaway: "away", date: "2026-11-06", time: "19:00" },
    ],
  },
];
