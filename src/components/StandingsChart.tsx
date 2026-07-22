import type { StandingsSeries } from "@/lib/scoring";

// Validated categorical order (dataviz reference palette, dark-stepped: passes
// CVD ΔE, normal-vision, and contrast checks). Fixed order, never cycled —
// series are capped at 6 upstream. Identity is also carried by the legend, so
// it never rests on color alone (safe on all three skins).
const SERIES = ["#3987e5", "#008300", "#d55181", "#c98500", "#199e70", "#d95926"];

export function StandingsChart({
  data,
  meId,
}: {
  data: StandingsSeries;
  meId?: string | null;
}) {
  const { weeks, series } = data;
  if (weeks.length < 2 || series.length === 0) return null; // need a trend to plot

  const W = 680;
  const H = 260;
  const pad = { top: 14, right: 16, bottom: 26, left: 34 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const maxY = Math.max(1, ...series.flatMap((s) => s.cumulative));
  const step = maxY <= 5 ? 1 : maxY <= 20 ? 5 : 10;
  const niceMax = Math.ceil(maxY / step) * step;

  const x = (i: number) =>
    pad.left + (weeks.length === 1 ? plotW / 2 : (i / (weeks.length - 1)) * plotW);
  const y = (v: number) => pad.top + plotH - (v / niceMax) * plotH;

  const yTicks: number[] = [];
  for (let v = 0; v <= niceMax; v += step) yTicks.push(v);

  return (
    <div className="overflow-hidden rounded-xl border border-cardborder bg-card p-4">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Cumulative points by week"
        className="w-full"
        style={{ height: "auto" }}
      >
        {yTicks.map((v) => (
          <g key={v}>
            <line
              x1={pad.left}
              y1={y(v)}
              x2={W - pad.right}
              y2={y(v)}
              stroke="var(--card-border)"
              strokeWidth="1"
            />
            <text x={pad.left - 6} y={y(v) + 3} textAnchor="end" fontSize="10" fill="var(--muted)">
              {v}
            </text>
          </g>
        ))}
        {weeks.map((w, i) => (
          <text key={w} x={x(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="var(--muted)">
            Wk {w}
          </text>
        ))}
        {series.map((s, si) => {
          const color = SERIES[si % SERIES.length];
          const pts = s.cumulative.map((v, i) => `${x(i)},${y(v)}`).join(" ");
          const lastI = s.cumulative.length - 1;
          return (
            <g key={s.userId}>
              <polyline
                points={pts}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <circle
                cx={x(lastI)}
                cy={y(s.cumulative[lastI])}
                r="3.5"
                fill={color}
                stroke="var(--card)"
                strokeWidth="1.5"
              />
            </g>
          );
        })}
      </svg>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {series.map((s, si) => (
          <span key={s.userId} className="inline-flex items-center gap-1.5 text-xs">
            <span
              className="inline-block size-2.5 rounded-full"
              style={{ backgroundColor: SERIES[si % SERIES.length] }}
            />
            <span className={s.userId === meId ? "font-semibold text-foreground" : "text-muted"}>
              {s.name}
            </span>
            <span className="tabular-nums text-muted">
              {s.cumulative[s.cumulative.length - 1]}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
