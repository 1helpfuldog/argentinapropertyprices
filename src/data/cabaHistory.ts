import { CABA_PRICES, obraUnitsFor } from "./cabaPrices";
import type { CreditPoint, PeriodPoint } from "./pipeline";

/**
 * National USD/m² shape, 2026 = 1.
 * Knots follow the well-known CABA dollar cycle: 2011–13 peak,
 * 2018 FX break, 2020 floor, 2024–26 thaw. Seed until bot dumps.
 */
const MACRO: [number, number][] = [
  [2006, 0.46],
  [2008, 0.6],
  [2011, 0.94],
  [2013, 1.18],
  [2015, 1.04],
  [2016, 0.96],
  [2018, 0.72],
  [2019, 0.64],
  [2020, 0.56],
  [2021, 0.61],
  [2022, 0.7],
  [2023, 0.8],
  [2024, 0.89],
  [2025, 0.96],
  [2026, 1],
];

function macroAt(year: number): number {
  if (year <= MACRO[0][0]) return MACRO[0][1];
  for (let i = 1; i < MACRO.length; i++) {
    const [y1, v1] = MACRO[i - 1];
    const [y2, v2] = MACRO[i];
    if (year <= y2) {
      const t = (year - y1) / (y2 - y1);
      const s = t * t * (3 - 2 * t);
      return v1 + (v2 - v1) * s;
    }
  }
  return 1;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 2 ** 32;
}

function texture(barrio: string, year: number): number {
  const h = hash(barrio);
  return 1 + 0.05 * Math.sin(year * 2.15 + h * 11) + 0.025 * Math.sin(year * 6.4 + h * 5);
}

function labelFor(year: number, monthly: boolean): string {
  if (!monthly) {
    const q = Math.round((year % 1) * 4) + 1;
    const y = Math.floor(year);
    return q === 1 ? String(y) : `${y} Q${Math.min(q, 4)}`;
  }
  const y = Math.floor(year);
  const m = Math.min(12, Math.round((year % 1) * 12) + 1);
  return `${y}-${String(m).padStart(2, "0")}`;
}

/** Dense seed series. Monthly for 1y, quarterly otherwise. */
export function seriesYears(barrio: string, years: number): PeriodPoint[] {
  const s = CABA_PRICES[barrio];
  if (!s) return [];
  const now = 2026;
  const start = now - years;
  const monthly = years <= 1;
  const step = monthly ? 1 / 12 : 0.25;
  const yieldNow = s.yieldPct ?? 5;
  const airNow = s.airbnbListings ?? 20;
  const obraNow = obraUnitsFor(barrio);
  const out: PeriodPoint[] = [];
  for (let y = start; y <= now + 1e-9; y += step) {
    const m = macroAt(y) * texture(barrio, y);
    const back = now - y;
    const airScale = y < 2012 ? 0.06 : y < 2016 ? 0.35 + (y - 2012) * 0.08 : 0.18 + m * 0.82;
    const obraScale = y < 2016 ? 0.35 : y < 2020 ? 0.55 : m;
    out.push({
      t: labelFor(y, monthly),
      year: Math.round(y * 100) / 100,
      usdM2: Math.max(280, Math.round(s.usdM2 * m)),
      yieldPct: Math.round((yieldNow + (1.15 - m) * 1.6 - back * 0.03) * 10) / 10,
      airbnbListings: Math.max(0, Math.round(airNow * airScale)),
      obraUnits: Math.max(0, Math.round(obraNow * obraScale)),
    });
  }
  return out;
}

export function seriesFor(barrio: string): PeriodPoint[] {
  return seriesYears(barrio, 2);
}

/** CABA-level mortgage flow. 2018–2023 mostly frozen, then a thaw. Seed. */
export const CABA_CREDIT: CreditPoint[] = [
  { t: "2008", newMortgages: 9200, defaultRatePct: 3.1 },
  { t: "2011", newMortgages: 11400, defaultRatePct: 2.4 },
  { t: "2013", newMortgages: 9800, defaultRatePct: 2.8 },
  { t: "2016", newMortgages: 6400, defaultRatePct: 3.4 },
  { t: "2018", newMortgages: 2100, defaultRatePct: 4.8 },
  { t: "2020", newMortgages: 380, defaultRatePct: 6.2 },
  { t: "2022", newMortgages: 290, defaultRatePct: 5.9 },
  { t: "2024", newMortgages: 1800, defaultRatePct: 4.1 },
  { t: "2025", newMortgages: 5200, defaultRatePct: 3.3 },
  { t: "2026", newMortgages: 7400, defaultRatePct: 2.9 },
];

export function creditForYears(years: number): CreditPoint[] {
  const from = 2026 - Math.max(years, 4);
  return CABA_CREDIT.filter((p) => Number(p.t) >= from);
}
