import { CABA_PRICES, obraUnitsFor } from "./cabaPrices";
import type { PeriodPoint } from "./pipeline";

/** Last 8 quarters ending 2026-Q3. Replace with bot dumps when they land. */
export const QUARTERS = [
  "2024-Q4",
  "2025-Q1",
  "2025-Q2",
  "2025-Q3",
  "2025-Q4",
  "2026-Q1",
  "2026-Q2",
  "2026-Q3",
] as const;

export function seriesFor(barrio: string): PeriodPoint[] {
  const s = CABA_PRICES[barrio];
  if (!s) return [];
  const qRate = (s.yoyPct || 0) / 100 / 4;
  const yieldNow = s.yieldPct ?? 5;
  const airNow = s.airbnbListings ?? 20;
  const obraNow = obraUnitsFor(barrio);
  const last = QUARTERS.length - 1;
  return QUARTERS.map((t, i) => {
    const back = last - i;
    const usdM2 = Math.max(400, Math.round(s.usdM2 / (1 + qRate) ** back));
    const wobble = Math.sin(i * 1.3) * 0.15;
    return {
      t,
      usdM2,
      yieldPct: Math.round((yieldNow - back * 0.05 + wobble) * 10) / 10,
      airbnbListings: Math.max(0, Math.round(airNow / (1.04 ** back))),
      obraUnits: Math.max(0, Math.round(obraNow / (1.08 ** back))),
    };
  });
}
