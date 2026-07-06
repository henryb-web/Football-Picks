// Home stadiums for tracked Texas HS (6A) teams, keyed by Team.displayName.
// Sourced from texasbob.com/stadium + public info, June 2026.
//
// NOTE: Texas HS home venues are messy — districts share stadiums and some
// schools rotate between two or three. These are each team's primary/best-known
// home stadium. Only teams we could source confidently are listed; add more as
// they're confirmed, then run: npx tsx scripts/load-hs-stadiums.ts
export const HS_STADIUMS: Record<string, string> = {
  // Austin ISD (shared stadiums)
  "Austin High": "House Park Stadium",
  Akins: "Burger Stadium",
  Anderson: "Burger Stadium",
  Bowie: "Burger Stadium",
  // Lake Travis ISD
  "Lake Travis": "Cavalier Stadium",
  // Eanes ISD
  Westlake: "Chaparral Stadium",
  // Leander ISD
  Vandegrift: "Monroe Stadium",
  Leander: "A.C. Bible Jr. Stadium",
  // Round Rock ISD (shared: Kelly Reeves & Dragon)
  "Round Rock": "Dragon Stadium",
  McNeil: "Kelly Reeves Athletic Complex",
  Westwood: "Kelly Reeves Athletic Complex",
  // Hays CISD (Buda)
  Hays: "Bob Shelton Stadium",
  "Buda Johnson": "Bob Shelton Stadium",
  // Other Central Texas
  Hutto: "Hutto Memorial Stadium",
  "Del Valle": "Veterans Stadium",
  "Dripping Springs": "Tiger Stadium",
  "Liberty Hill": "Jerry Vance Field",
  Manor: "Manor Athletic Complex",
  "Hyde Park": "Hyde Park Baptist Field",
  "Vista Ridge": "John Gupton Stadium",
  // DFW
  Prosper: "Children's Health Stadium",
  // San Antonio area
  "Boerne-Champion": "Boerne ISD Stadium",
  "San Antonio Brennan": "Farris Stadium",
  "San Antonio Wagner": "Rutledge Stadium",
  Steele: "Lehnhoff Stadium",
  "Smithson Valley": "Ranger Stadium",
  "St. Anthony": "Lang Field",
  // Round Rock / Pflugerville ISD
  "Stony Point": "Kelly Reeves Athletic Complex",
  Weiss: "The Pfield",
  // Private schools
  Kinkaid: "Barnhart Stadium",
  Regents: "Knights Field",
  "Brazos Christian": "Brazos Christian Field",
};
