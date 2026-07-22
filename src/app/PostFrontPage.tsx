import type { SlateGame } from "./FeaturedSlate";
import type { LeaderboardRow } from "@/lib/scoring";
import { PostLead } from "./PostLead";

// The Post's front-page treatment of the home route: a rotating lead story
// (soonest game per league) + a ruled standings table. Only rendered when the
// skin is The Post (see page.tsx); its styles inherit the newsprint/serif
// tokens, and the global masthead (MainNav) sits above.
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
  const rows = standings.slice(0, 8);

  return (
    <main className="pfp">
      <div className="pfp-sheet">
        <PostLead slate={slate} loggedIn={loggedIn} />

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
