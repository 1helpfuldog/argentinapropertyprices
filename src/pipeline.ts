/**
 * Grok bot dump contract.
 * Drop a JSON file matching BotDump into /public/data/dumps/ and call ingestDump().
 * Cadence: weekly | monthly | quarterly. Grain is always barrio for CABA layer 1.
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

export type BotDump = {
  asOf: string;
  cadence: Cadence;
  geo: GeoScope;
  sourceNote?: string;
  rows: SnapshotRow[];
};

export type PeriodPoint = {
  t: string;
  usdM2: number;
  yieldPct: number;
  airbnbListings: number;
  obraUnits: number;
};

export const PIPELINE_EXAMPLE: BotDump = {
  asOf: "2026-09-06",
  cadence: "weekly",
  geo: "CABA",
  sourceNote: "asking / publicación — not escrituras",
  rows: [],
};
