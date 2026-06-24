// College teams we care about: the power conferences + Notre Dame. A college
// game is kept only if BOTH teams are in this set (so power-vs-FCS/G5 cupcakes
// are filtered out). Matched on each team's school name (ESPN's `location`),
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

// Keep a college game only when both teams are in the allowed set.
export function isAllowedCollegeGame(
  homeLocation: string | null | undefined,
  awayLocation: string | null | undefined,
): boolean {
  return isAllowedCollegeTeam(homeLocation) && isAllowedCollegeTeam(awayLocation);
}
