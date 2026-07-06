// College teams we care about: the power conferences + Notre Dame. A college
// game is kept if AT LEAST ONE team is in this set (so marquee power-vs-G5 games
// like Texas vs UTSA are included) AND both teams are FBS (so FCS tune-up games
// are still filtered out). FBS membership comes from ESPN at ingest time; see
// isKeptCollegeGame. Matched on each team's school name (ESPN's `location`),
// which is stable across mascot/branding changes.
//
// Edit these lists to adjust membership (e.g. future realignment).

export const COLLEGE_CONFERENCES: Record<string, string[]> = {
  SEC: [
    "Alabama", "Arkansas", "Auburn", "Florida", "Georgia", "Kentucky", "LSU",
    "Mississippi State", "Missouri", "Oklahoma", "Ole Miss", "South Carolina",
    "Tennessee", "Texas", "Texas A&M", "Vanderbilt",
  ],
  "Big Ten": [
    "Illinois", "Indiana", "Iowa", "Maryland", "Michigan", "Michigan State",
    "Minnesota", "Nebraska", "Northwestern", "Ohio State", "Oregon",
    "Penn State", "Purdue", "Rutgers", "UCLA", "USC", "Washington", "Wisconsin",
  ],
  "Big 12": [
    "Arizona", "Arizona State", "Baylor", "BYU", "Cincinnati", "Colorado",
    "Houston", "Iowa State", "Kansas", "Kansas State", "Oklahoma State", "TCU",
    "Texas Tech", "UCF", "Utah", "West Virginia",
  ],
  ACC: [
    "Boston College", "California", "Clemson", "Duke", "Florida State",
    "Georgia Tech", "Louisville", "Miami", "NC State", "North Carolina",
    "Pittsburgh", "SMU", "Stanford", "Syracuse", "Virginia", "Virginia Tech",
    "Wake Forest",
  ],
  // The rebuilt Pac-12 (effective 2026). Confirm these before the season.
  "Pac-12": [
    "Oregon State", "Washington State", "Boise State", "Colorado State",
    "Fresno State", "San Diego State", "Utah State", "Texas State",
  ],
  Independent: ["Notre Dame"],
};

export const ALLOWED_COLLEGE_SCHOOLS = new Set<string>(
  Object.values(COLLEGE_CONFERENCES).flat(),
);

export function isAllowedCollegeTeam(location: string | null | undefined): boolean {
  return location != null && ALLOWED_COLLEGE_SCHOOLS.has(location.trim());
}

// Strict fallback: keep a college game only when both teams are power-conference.
// Used when the FBS team list can't be fetched (see isKeptCollegeGame).
export function isAllowedCollegeGame(
  homeLocation: string | null | undefined,
  awayLocation: string | null | undefined,
): boolean {
  return isAllowedCollegeTeam(homeLocation) && isAllowedCollegeTeam(awayLocation);
}

type CollegeSide = {
  location?: string | null;
  externalId?: string | null;
};

// The live policy: keep a game when at least one team is power-conference AND
// both teams are FBS. `fbsTeamIds` is the set of ESPN FBS team ids for the
// season (from fetchFbsTeamIds), which is how we drop FCS opponents while
// keeping power-vs-G5 matchups.
export function isKeptCollegeGame(
  home: CollegeSide,
  away: CollegeSide,
  fbsTeamIds: Set<string>,
): boolean {
  const hasPowerTeam =
    isAllowedCollegeTeam(home.location) || isAllowedCollegeTeam(away.location);
  const bothFbs =
    home.externalId != null &&
    away.externalId != null &&
    fbsTeamIds.has(home.externalId) &&
    fbsTeamIds.has(away.externalId);
  return hasPowerTeam && bothFbs;
}
