/**
 * Grok bot dump contract.
 *
 * Where dumps live (until we have a database):
 *   public/data/dumps/{geo}/{cadence}/{asOf}.json
 *   e.g. public/data/dumps/CABA/weekly/2026-09-06.json
 *
 * Weekly = asking snapshot. Monthly = Airbnb + obra rollup.
 * Quarterly = yield + credit (mortgages, mora).
 *
 * Ingest: drop the JSON, keep this shape. The map reads the latest
 * file per cadence. No secrets in the dump. Asking prices, not escrituras.
 */
export type Cadence = "weekly" | "monthly" | "quarterly";
export type GeoScope = "CABA" | "GBA" | "AMBA";

export type SnapshotRow = {
  barrio: string;
  usdM2: number;
  yoyPct: number;
  yieldPct: number | null;
  airbnbListings: number | null;
  airbnbAdrUsd: number | null;
  obraUnits: number | null;
  nAsk: number | null;
  medianDaysListed: number | null;
};

export type CreditPoint = {
  t: string;
  newMortgages: number;
  defaultRatePct: number;
};

export type BotDump = {
  asOf: string;
  cadence: Cadence;
  geo: GeoScope;
  sourceNote?: string;
  rows: SnapshotRow[];
  credit?: CreditPoint[];
};

export type PeriodPoint = {
  t: string;
  year: number;
  usdM2: number;
  yieldPct: number;
  airbnbListings: number;
  obraUnits: number;
};

export const DUMP_ROOT = "/data/dumps";

export const PIPELINE_EXAMPLE: BotDump = {
  asOf: "2026-09-06",
  cadence: "weekly",
  geo: "CABA",
  sourceNote: "asking / publicación — not escrituras",
  rows: [],
};
