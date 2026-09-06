import { useMemo, useState } from "react";
import { creditForYears, seriesYears } from "../data/cabaHistory";
import { areaFromLine, smoothLine } from "../lib/chartPath";
import { useLang } from "../lib/lang";

export type EvoKey = "usdM2" | "yieldPct" | "airbnbListings" | "obraUnits";

const RANGES = [1, 5, 10, 20] as const;

export function EvoModal({
  barrio,
  metric,
  onClose,
}: {
  barrio: string;
  metric: EvoKey;
  onClose: () => void;
}) {
  const { t } = useLang();
  const [years, setYears] = useState<(typeof RANGES)[number]>(10);
  const series = useMemo(() => seriesYears(barrio, years), [barrio, years]);
  const credit = useMemo(() => creditForYears(years), [years]);
  const values = series.map((p) => p[metric]);
  const labels = series.map((p) => p.t);
  const title =
    metric === "usdM2"
      ? t.layerPrice
      : metric === "yieldPct"
        ? t.layerYield
        : metric === "airbnbListings"
          ? t.overlayAirbnb
          : t.layerObra;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="evo-window" onClick={(e) => e.stopPropagation()}>
        <header>
          <div>
            <div className="kicker">{barrio}</div>
            <h3>{title}</h3>
          </div>
          <button type="button" className="chip" onClick={onClose}>
            {t.close}
          </button>
        </header>
        <div className="range-row">
          {RANGES.map((n) => (
            <button key={n} className={years === n ? "on" : ""} type="button" onClick={() => setYears(n)}>
              {n === 1 ? t.range1 : n === 5 ? t.range5 : n === 10 ? t.range10 : t.range20}
            </button>
          ))}
        </div>
        <BigChart values={values} labels={labels} />
        {metric === "yieldPct" && <p className="note">{t.projLater}</p>}
        <div className="credit-block">
          <div className="kicker">{t.credit}</div>
          <div className="rows">
            {credit.slice(-4).map((c) => (
              <div key={c.t}>
                {c.t} · {t.newMort} <b>{c.newMortgages.toLocaleString("en-US")}</b> · {t.defaults}{" "}
                <b>{c.defaultRatePct}%</b>
              </div>
            ))}
          </div>
        </div>
        <p className="note">{t.seed}</p>
      </div>
    </div>
  );
}

function BigChart({ values, labels }: { values: number[]; labels: string[] }) {
  if (values.length < 2) return null;
  const w = 640;
  const h = 240;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const left = 52;
  const right = w - 16;
  const top = 20;
  const bottom = h - 28;
  const pts = values.map((v, i) => {
    const x = left + (i / (values.length - 1)) * (right - left);
    const y = top + (1 - (v - min) / span) * (bottom - top);
    return [x, y] as [number, number];
  });
  const d = smoothLine(pts);
  const area = areaFromLine(d, pts, bottom);
  const tickIdx = [0, Math.round((labels.length - 1) / 3), Math.round(((labels.length - 1) * 2) / 3), labels.length - 1];
  const uniqueTicks = [...new Set(tickIdx)];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="big-chart">
      <rect x="0" y="0" width={w} height={h} className="chart-bg" />
      {[0, 0.25, 0.5, 0.75, 1].map((g) => (
        <line
          key={g}
          x1={left}
          x2={right}
          y1={top + g * (bottom - top)}
          y2={top + g * (bottom - top)}
          className="chart-grid"
        />
      ))}
      <path d={area} className="chart-fill" />
      <path d={d} className="chart-line" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="4" className="chart-dot" />
      {uniqueTicks.map((i) => (
        <text key={i} x={pts[i][0]} y={h - 8} textAnchor={i === 0 ? "start" : i === labels.length - 1 ? "end" : "middle"} className="chart-tick">
          {labels[i]}
        </text>
      ))}
      <text x={8} y={top + 4} className="chart-tick">
        {max.toLocaleString("en-US")}
      </text>
      <text x={8} y={bottom - 2} className="chart-tick">
        {min.toLocaleString("en-US")}
      </text>
    </svg>
  );
}
