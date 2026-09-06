import { useMemo, useState } from "react";
import { creditForYears, seriesYears } from "../data/cabaHistory";
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
  const h = 220;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => {
    const x = 36 + (i / (values.length - 1)) * (w - 56);
    const y = 16 + (1 - (v - min) / span) * (h - 48);
    return [x, y] as const;
  });
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `${d} L${pts[pts.length - 1][0].toFixed(1)} ${h - 24} L${pts[0][0].toFixed(1)} ${h - 24} Z`;
  const ticks = [labels[0], labels[Math.floor(labels.length / 2)], labels[labels.length - 1]];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="big-chart">
      <rect x="0" y="0" width={w} height={h} className="chart-bg" />
      {[0.25, 0.5, 0.75].map((g) => (
        <line key={g} x1="36" x2={w - 20} y1={16 + g * (h - 48)} y2={16 + g * (h - 48)} className="chart-grid" />
      ))}
      <path d={area} className="chart-fill" />
      <path d={d} className="chart-line" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="4" className="chart-dot" />
      <text x="36" y={h - 8} className="chart-tick">
        {ticks[0]}
      </text>
      <text x={w / 2} y={h - 8} textAnchor="middle" className="chart-tick">
        {ticks[1]}
      </text>
      <text x={w - 20} y={h - 8} textAnchor="end" className="chart-tick">
        {ticks[2]}
      </text>
      <text x="36" y="14" className="chart-tick">
        {max.toLocaleString("en-US")}
      </text>
    </svg>
  );
}
