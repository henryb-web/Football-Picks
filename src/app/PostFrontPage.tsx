import Link from "next/link";
import type { SlateGame } from "./FeaturedSlate";
import type { LeaderboardRow } from "@/lib/scoring";

// The Post's front-page treatment of the home route: the soonest game written
// up as a lead story + a ruled standings table. Only rendered when the skin is
// The Post (see page.tsx), so its styles inherit the newsprint/serif tokens.
// The global masthead (MainNav) sits above this.
function pct(r: LeaderboardRow): string {
  if (r.total === 0) return "—";
  return (r.wins / r.total).toFixed(3).replace(/^0/, "");
}

export function PostFrontPage({
  slate,
  standings,
  loggedIn,
}: {
  slate: SlateGame[];
  standings: LeaderboardRow[];
  loggedIn: boolean;
}) {
  const lead = slate[0] ?? null;
  const rows = standings.slice(0, 8);

  return (
    <main className="pfp">
      <div className="pfp-sheet">
        {lead ? (
          <>
            <div className="pfp-kicker">
              {lead.league}
              {lead.week ? ` · Week ${lead.week}` : ""} · Today&apos;s Lead
            </div>
            <h1 className="pfp-hed">
              {lead.away.displayName} Visit {lead.home.displayName}
            </h1>
            <p className="pfp-subhed">
              Kickoff {lead.kickoffTime} · {lead.kickoffDate}
              {lead.venue ? ` · ${lead.venue}` : ""}
            </p>
            <div className="pfp-byline">
              By the PickSix Desk{lead.venue ? ` · ${lead.venue}` : ""}
            </div>

            <div className="pfp-cols">
              <div>
                <p className="pfp-lede">
                  The {lead.league} slate opens with the {lead.away.displayName}{" "}
                  traveling to face the {lead.home.displayName}
                  {lead.venue ? ` at ${lead.venue}` : ""}. First whistle is set
                  for {lead.kickoffTime} on {lead.kickoffDate}, and the room is
                  already weighing in.
                </p>
                <p className="pfp-lede">
                  Every game on the card counts a single point, straight up —
                  pick the winner, no spreads. Make your call before kickoff and
                  watch where you land in the standings.
                </p>
                <div className="pfp-photo">
                  <div className="pfp-img" aria-hidden="true" />
                  <div className="pfp-cap">
                    Above: the visitors take the field — file photo.
                  </div>
                </div>
              </div>

              <div>
                <div className="pfp-box">
                  <div className="pfp-box-hd">On the Card</div>
                  <div className="pfp-box-in">
                    <div className="pfp-team">{lead.away.displayName}</div>
                    <div className="pfp-at">— at —</div>
                    <div className="pfp-team">{lead.home.displayName}</div>
                    <Link href={lead.leagueHref} className="pfp-cta">
                      {loggedIn ? "Make your picks" : "Create an account"}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <h1 className="pfp-hed">The Slate Is Quiet</h1>
            <p className="pfp-subhed">
              No games on the board right now — check back on gameday.
            </p>
            <div className="pfp-byline">By the PickSix Desk</div>
          </>
        )}

        <div className="pfp-band">
          <span>The Standings</span>
        </div>
        {rows.length === 0 ? (
          <p className="pfp-empty">No results in yet — the season&apos;s young.</p>
        ) : (
          <table className="pfp-table">
            <thead>
              <tr>
                <th className="rk">#</th>
                <th>Player</th>
                <th className="n">W</th>
                <th className="n">L</th>
                <th className="n">Pct</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.userId} className={i === 0 ? "lead" : undefined}>
                  <td className="rk">{i + 1}</td>
                  <td>{r.name}</td>
                  <td className="n">{r.wins}</td>
                  <td className="n">{r.losses}</td>
                  <td className="n">{pct(r)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
