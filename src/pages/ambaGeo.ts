import type { Map as MlMap } from "maplibre-gl";
import type { Feature, FeatureCollection, GeoJsonProperties } from "geojson";
import {
  CABA_PRICES,
  obraColor,
  obraUnitsFor,
  priceColor,
  yieldColor,
} from "../data/cabaPrices";

export type LayerId = "price" | "yield" | "obra";

export function fillFor(layer: LayerId): string {
  if (layer === "yield") return "fillYield";
  if (layer === "obra") return "fillObra";
  return "fillPrice";
}

export function centroid(f: Feature): [number, number] {
  let xs = 0;
  let ys = 0;
  let n = 0;
  const walk = (coords: unknown) => {
    if (!Array.isArray(coords)) return;
    if (typeof coords[0] === "number") {
      xs += Number(coords[0]);
      ys += Number(coords[1]);
      n += 1;
      return;
    }
    coords.forEach(walk);
  };
  walk(f.geometry && "coordinates" in f.geometry ? f.geometry.coordinates : []);
  return n ? [xs / n, ys / n] : [0, 0];
}

export function enrich(geo: FeatureCollection) {
  const points: FeatureCollection = { type: "FeatureCollection", features: [] };
  const polys = {
    ...geo,
    features: geo.features.map((f: Feature) => {
      const name = String((f.properties as GeoJsonProperties | null)?.BARRIO || "");
      const stats = CABA_PRICES[name];
      const obra = obraUnitsFor(name);
      const [lng, lat] = centroid(f);
      points.features.push({
        type: "Feature",
        id: name,
        geometry: { type: "Point", coordinates: [lng, lat] },
        properties: { BARRIO: name, airbnbListings: stats?.airbnbListings ?? 0 },
      });
      return {
        ...f,
        id: name,
        properties: {
          ...f.properties,
          usdM2: stats?.usdM2 ?? 0,
          yoyPct: stats?.yoyPct ?? 0,
          yieldPct: stats?.yieldPct ?? 0,
          airbnbListings: stats?.airbnbListings ?? 0,
          obraUnits: obra,
          fillPrice: stats ? priceColor(stats.usdM2) : "#22080a",
          fillYield: stats ? yieldColor(stats.yieldPct ?? 5) : "#22080a",
          fillObra: obraColor(obra),
        },
      };
    }),
  };
  return { polys, points };
}

export function firstSymbolId(map: MlMap): string | undefined {
  const layers = map.getStyle().layers ?? [];
  for (const layer of layers) {
    if (layer.type === "symbol") return layer.id;
  }
  return undefined;
}
