export function obraUnitsFor(barrio: string): number {
  let h = 0;
  for (let i = 0; i < barrio.length; i++) h = (h * 33 + barrio.charCodeAt(i)) >>> 0;
  if (barrio === "PALERMO" || barrio === "PUERTO MADERO" || barrio === "BELGRANO") return 28 + (h % 18);
  if (barrio.includes("VILLA SOLDATI") || barrio.includes("LUGANO")) return 2 + (h % 6);
  return 4 + (h % 22);
}

/**
 * Asking prices (USD/m²) for CABA departamentos — seed for layer 1.
 * Grain: barrio. Source mix: Zonaprop / UdeSA-MeLi / DGEyC style publications mid-2026.
 * These are publicación, not escrituras. Replace from the Grok pipeline when ready.
 */
export type BarrioStats = {
  barrio: string;
  usdM2: number;
  yoyPct: number;
  yieldPct: number | null;
  airbnbListings: number | null;
  airbnbAdrUsd: number | null;
};

export const CABA_PRICES: Record<string, BarrioStats> = {
  "PUERTO MADERO": { barrio: "PUERTO MADERO", usdM2: 6136, yoyPct: 1.6, yieldPct: 3.6, airbnbListings: 549, airbnbAdrUsd: 112 },
  PALERMO: { barrio: "PALERMO", usdM2: 3420, yoyPct: 0.5, yieldPct: 4.7, airbnbListings: 4787, airbnbAdrUsd: 62 },
  "NUÑEZ": { barrio: "NUÑEZ", usdM2: 3382, yoyPct: 2.9, yieldPct: 4.8, airbnbListings: 409, airbnbAdrUsd: 58 },
  BELGRANO: { barrio: "BELGRANO", usdM2: 3319, yoyPct: 2.6, yieldPct: 4.9, airbnbListings: 970, airbnbAdrUsd: 56 },
  COLEGIALES: { barrio: "COLEGIALES", usdM2: 3032, yoyPct: 5.8, yieldPct: 5.1, airbnbListings: 489, airbnbAdrUsd: 55 },
  RECOLETA: { barrio: "RECOLETA", usdM2: 2687, yoyPct: -0.2, yieldPct: 5.2, airbnbListings: 2010, airbnbAdrUsd: 64 },
  SAAVEDRA: { barrio: "SAAVEDRA", usdM2: 2855, yoyPct: 9.4, yieldPct: 5.3, airbnbListings: 180, airbnbAdrUsd: 52 },
  "VILLA URQUIZA": { barrio: "VILLA URQUIZA", usdM2: 2834, yoyPct: 3.3, yieldPct: 5.3, airbnbListings: 402, airbnbAdrUsd: 50 },
  "VILLA ORTUZAR": { barrio: "VILLA ORTUZAR", usdM2: 2881, yoyPct: 4.6, yieldPct: 5.4, airbnbListings: 76, airbnbAdrUsd: 48 },
  COGHLAN: { barrio: "COGHLAN", usdM2: 2752, yoyPct: -2.8, yieldPct: 4.8, airbnbListings: 72, airbnbAdrUsd: 49 },
  CHACARITA: { barrio: "CHACARITA", usdM2: 2684, yoyPct: 10.8, yieldPct: 5.6, airbnbListings: 251, airbnbAdrUsd: 48 },
  "PARQUE CHAS": { barrio: "PARQUE CHAS", usdM2: 2516, yoyPct: 3.3, yieldPct: 5.5, airbnbListings: 40, airbnbAdrUsd: 46 },
  "VILLA DEVOTO": { barrio: "VILLA DEVOTO", usdM2: 2486, yoyPct: 4.0, yieldPct: 5.3, airbnbListings: 90, airbnbAdrUsd: 47 },
  "VILLA PUEYRREDON": { barrio: "VILLA PUEYRREDON", usdM2: 2472, yoyPct: 6.4, yieldPct: 5.4, airbnbListings: 55, airbnbAdrUsd: 45 },
  "VILLA CRESPO": { barrio: "VILLA CRESPO", usdM2: 2426, yoyPct: -0.6, yieldPct: 5.6, airbnbListings: 647, airbnbAdrUsd: 48 },
  RETIRO: { barrio: "RETIRO", usdM2: 2328, yoyPct: 0.0, yieldPct: 5.2, airbnbListings: 672, airbnbAdrUsd: 60 },
  CABALLITO: { barrio: "CABALLITO", usdM2: 2291, yoyPct: -0.8, yieldPct: 5.5, airbnbListings: 590, airbnbAdrUsd: 46 },
  ALMAGRO: { barrio: "ALMAGRO", usdM2: 2185, yoyPct: 0.4, yieldPct: 5.8, airbnbListings: 792, airbnbAdrUsd: 45 },
  "VILLA DEL PARQUE": { barrio: "VILLA DEL PARQUE", usdM2: 2253, yoyPct: -1.9, yieldPct: 5.4, airbnbListings: 80, airbnbAdrUsd: 44 },
  AGRONOMIA: { barrio: "AGRONOMIA", usdM2: 2174, yoyPct: -0.4, yieldPct: 5.5, airbnbListings: 28, airbnbAdrUsd: 43 },
  "VILLA SANTA RITA": { barrio: "VILLA SANTA RITA", usdM2: 2188, yoyPct: 12.1, yieldPct: 5.7, airbnbListings: 35, airbnbAdrUsd: 42 },
  "SAN TELMO": { barrio: "SAN TELMO", usdM2: 1831, yoyPct: 1.1, yieldPct: 6.4, airbnbListings: 429, airbnbAdrUsd: 52 },
  "SAN NICOLAS": { barrio: "SAN NICOLAS", usdM2: 1816, yoyPct: -1.3, yieldPct: 7.3, airbnbListings: 1058, airbnbAdrUsd: 50 },
  MONSERRAT: { barrio: "MONSERRAT", usdM2: 1881, yoyPct: 0.2, yieldPct: 6.8, airbnbListings: 695, airbnbAdrUsd: 48 },
  FLORES: { barrio: "FLORES", usdM2: 1925, yoyPct: -4.3, yieldPct: 6.2, airbnbListings: 210, airbnbAdrUsd: 42 },
  BOEDO: { barrio: "BOEDO", usdM2: 1695, yoyPct: -6.5, yieldPct: 6.1, airbnbListings: 90, airbnbAdrUsd: 40 },
  "PARQUE CHACABUCO": { barrio: "PARQUE CHACABUCO", usdM2: 2174, yoyPct: 0.5, yieldPct: 7.1, airbnbListings: 70, airbnbAdrUsd: 41 },
  BALVANERA: { barrio: "BALVANERA", usdM2: 1667, yoyPct: 0.8, yieldPct: 7.4, airbnbListings: 760, airbnbAdrUsd: 42 },
  "SAN CRISTOBAL": { barrio: "SAN CRISTOBAL", usdM2: 1513, yoyPct: 1.3, yieldPct: 6.9, airbnbListings: 147, airbnbAdrUsd: 40 },
  BARRACAS: { barrio: "BARRACAS", usdM2: 1488, yoyPct: 0.6, yieldPct: 8.3, airbnbListings: 180, airbnbAdrUsd: 41 },
  PATERNAL: { barrio: "PATERNAL", usdM2: 1312, yoyPct: 1.0, yieldPct: 6.4, airbnbListings: 45, airbnbAdrUsd: 39 },
  LINIERS: { barrio: "LINIERS", usdM2: 1326, yoyPct: 1.4, yieldPct: 6.5, airbnbListings: 40, airbnbAdrUsd: 38 },
  FLORESTA: { barrio: "FLORESTA", usdM2: 1365, yoyPct: 0.3, yieldPct: 7.3, airbnbListings: 55, airbnbAdrUsd: 38 },
  "MONTE CASTRO": { barrio: "MONTE CASTRO", usdM2: 1438, yoyPct: 0.7, yieldPct: 6.3, airbnbListings: 30, airbnbAdrUsd: 37 },
  "VILLA LURO": { barrio: "VILLA LURO", usdM2: 1541, yoyPct: -3.6, yieldPct: 6.2, airbnbListings: 35, airbnbAdrUsd: 37 },
  VERSALLES: { barrio: "VERSALLES", usdM2: 1795, yoyPct: 4.2, yieldPct: 6.0, airbnbListings: 20, airbnbAdrUsd: 38 },
  "VILLA REAL": { barrio: "VILLA REAL", usdM2: 1382, yoyPct: 7.4, yieldPct: 6.1, airbnbListings: 15, airbnbAdrUsd: 36 },
  "VELEZ SARSFIELD": { barrio: "VELEZ SARSFIELD", usdM2: 1550, yoyPct: 0.5, yieldPct: 7.1, airbnbListings: 25, airbnbAdrUsd: 37 },
  "VILLA GRAL. MITRE": { barrio: "VILLA GRAL. MITRE", usdM2: 1600, yoyPct: -2.0, yieldPct: 6.0, airbnbListings: 22, airbnbAdrUsd: 36 },
  MATADEROS: { barrio: "MATADEROS", usdM2: 1190, yoyPct: 1.2, yieldPct: 7.0, airbnbListings: 30, airbnbAdrUsd: 35 },
  CONSTITUCION: { barrio: "CONSTITUCION", usdM2: 1152, yoyPct: 2.0, yieldPct: 8.8, airbnbListings: 232, airbnbAdrUsd: 40 },
  "PARQUE PATRICIOS": { barrio: "PARQUE PATRICIOS", usdM2: 1151, yoyPct: 0.4, yieldPct: 7.8, airbnbListings: 80, airbnbAdrUsd: 38 },
  "PARQUE AVELLANEDA": { barrio: "PARQUE AVELLANEDA", usdM2: 1615, yoyPct: 9.1, yieldPct: 7.6, airbnbListings: 25, airbnbAdrUsd: 36 },
  BOCA: { barrio: "BOCA", usdM2: 1577, yoyPct: -1.6, yieldPct: 8.0, airbnbListings: 120, airbnbAdrUsd: 45 },
  "NUEVA POMPEYA": { barrio: "NUEVA POMPEYA", usdM2: 1479, yoyPct: -0.5, yieldPct: 8.2, airbnbListings: 18, airbnbAdrUsd: 34 },
  "VILLA RIACHUELO": { barrio: "VILLA RIACHUELO", usdM2: 1603, yoyPct: 0.2, yieldPct: 8.2, airbnbListings: 8, airbnbAdrUsd: 32 },
  "VILLA LUGANO": { barrio: "VILLA LUGANO", usdM2: 1048, yoyPct: 1.7, yieldPct: 10.5, airbnbListings: 12, airbnbAdrUsd: 30 },
  "VILLA SOLDATI": { barrio: "VILLA SOLDATI", usdM2: 681, yoyPct: 0.8, yieldPct: 9.2, airbnbListings: 6, airbnbAdrUsd: 28 },
};

/** Discrete strategy-map bands — high = parchment, low = dried blood. */
export function priceColor(usdM2: number): string {
  if (usdM2 >= 4500) return "#e8c9a4";
  if (usdM2 >= 3200) return "#c45a3a";
  if (usdM2 >= 2500) return "#a32228";
  if (usdM2 >= 2000) return "#7a181c";
  if (usdM2 >= 1500) return "#541014";
  if (usdM2 >= 1100) return "#3a0c10";
  return "#22080a";
}

export function yieldColor(pct: number): string {
  if (pct >= 9) return "#e8c9a4";
  if (pct >= 7) return "#c45a3a";
  if (pct >= 6) return "#a32228";
  if (pct >= 5.2) return "#7a181c";
  return "#3a0c10";
}

export function airbnbColor(n: number): string {
  if (n >= 2000) return "#e8c9a4";
  if (n >= 700) return "#c45a3a";
  if (n >= 250) return "#a32228";
  if (n >= 80) return "#7a181c";
  if (n >= 20) return "#541014";
  return "#22080a";
}

export function obraColor(n: number): string {
  if (n >= 30) return "#e8c9a4";
  if (n >= 18) return "#c45a3a";
  if (n >= 10) return "#a32228";
  if (n >= 5) return "#7a181c";
  return "#3a0c10";
}

export const CABA_MEDIAN = 2467;
