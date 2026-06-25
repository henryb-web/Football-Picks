// Shows how the pool is split on a game: a two-segment bar + percentages.
export function ConsensusBar({
  awayCount,
  homeCount,
  awayColor,
  homeColor,
}: {
  awayCount: number;
  homeCount: number;
  awayColor: string | null;
  homeColor: string | null;
}) {
  const total = awayCount + homeCount;
  if (total === 0) return null;
  const awayPct = Math.round((awayCount / total) * 100);
  const homePct = 100 - awayPct;

  return (
    <div className="mt-2 w-full">
      <div className="animate-bar flex h-1.5 w-full overflow-hidden rounded-full bg-cardborder">
        <div
          style={{ width: `${awayPct}%`, backgroundColor: awayColor ? `#${awayColor}` : "var(--muted)" }}
        />
        <div
          style={{ width: `${homePct}%`, backgroundColor: homeColor ? `#${homeColor}` : "var(--muted)" }}
        />
      </div>
      <div className="mt-0.5 flex justify-between text-[10px] text-muted">
        <span>{awayPct}%</span>
        <span>
          {total} pick{total === 1 ? "" : "s"}
        </span>
        <span>{homePct}%</span>
      </div>
    </div>
  );
}
