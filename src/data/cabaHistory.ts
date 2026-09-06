import { CABA_PRICES, obraUnitsFor } from "./cabaPrices";
import type { CreditPoint, PeriodPoint } from "./pipeline";

/** National USD/m² shape 2006–2026, 2026 = 1. Seed until bot dumps. */
const MACRO: [number, number][] = [
  [2006, 0.48],
  [2008, 0.62],
  [2011, 0.88],
  [2013, 1.12],
  [2015, 1.02],
  [2018, 0.78],
  [2020, 0.64],
  [2023, 0.8],
  [2025, 0.94],
  [2026, 1],
];

function macroAt(year: number): number {
  if (year <= MACRO[0][0]) return MACRO[0][1];
  for (let i = 1; i < MACRO.length; i++) {
    const [y1, v1] = MACRO[i - 1];
    const [y2, v2] = MACRO[i];
    if (year <= y2) {
      const t = (year - y1) / (y2 - y1);
      return v1 + (v2 - v1) * t;
    }
  }
  return 1;
}

export function seriesYears(barrio: string, years: number): PeriodPoint[] {
  const s = CABA_PRICES[barrio];
  if (!s) return [];
  const now = 2026;
  const start = now - years;
  const yieldNow = s.yieldPct ?? 5;
  const airNow = s.airbnbListings ?? 20;
  const obraNow = obraUnitsFor(barrio);
  const out: PeriodPoint[] = [];
  for (let y = start; y <= now; y++) {
    const m = macroAt(y);
    const back = now - y;
    out.push({
      t: String(y),
      year: y,
      usdM2: Math.max(280, Math.round(s.usdM2 * m)),
      yieldPct: Math.round((yieldNow + (1 - m) * 1.8 - back * 0.02) * 10) / 10,
      airbnbListings: Math.max(0, Math.round(airNow * (y < 2012 ? 0.05 : m * 0.9 + 0.1))),
      obraUnits: Math.max(0, Math.round(obraNow * (y < 2016 ? 0.4 : m))),
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
  const from = 2026 - years;
  return CABA_CREDIT.filter((p) => Number(p.t) >= from);
}
