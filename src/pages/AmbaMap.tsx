import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { Map as MlMap, MapLayerMouseEvent } from "maplibre-gl";
import type { Feature, FeatureCollection, GeoJsonProperties } from "geojson";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  airbnbColor,
  CABA_MEDIAN,
  CABA_PRICES,
  obraColor,
  obraUnitsFor,
  priceColor,
  yieldColor,
  type BarrioStats,
} from "../data/cabaPrices";
import { seriesFor } from "../data/cabaHistory";
import { darkStyle } from "../lib/mapStyle";
import { Spark } from "../components/Spark";

type LayerId = "price" | "yield" | "airbnb" | "obra";

const LAYERS: { id: LayerId; label: string }[] = [
  { id: "price", label: "Precio USD/m²" },
  { id: "yield", label: "Renta bruta" },
  { id: "airbnb", label: "Airbnb" },
  { id: "obra", label: "Obra" },
];

function fillFor(layer: LayerId): string {
  if (layer === "yield") return "fillYield";
  if (layer === "airbnb") return "fillAirbnb";
  if (layer === "obra") return "fillObra";
  return "fillPrice";
}

function enrich(geo: FeatureCollection) {
  return {
    ...geo,
    features: geo.features.map((f: Feature) => {
      const name = String((f.properties as GeoJsonProperties | null)?.BARRIO || "");
      const stats = CABA_PRICES[name];
      const obra = obraUnitsFor(name);
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
          fillAirbnb: stats ? airbnbColor(stats.airbnbListings ?? 0) : "#22080a",
          fillObra: obraColor(obra),
        },
      };
    }),
  };
}

function firstSymbolId(map: MlMap): string | undefined {
  const layers = map.getStyle().layers ?? [];
  for (const layer of layers) {
    if (layer.type === "symbol") return layer.id;
  }
  return undefined;
}

export function AmbaMap() {
  const wrap = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const hoveredRef = useRef<string | null>(null);
  const selectedRef = useRef<string | null>(null);
  const [layer, setLayer] = useState<LayerId>("price");
  const [selected, setSelected] = useState<BarrioStats | null>(null);
  const [hoverName, setHoverName] = useState<string | null>(null);
  const layerRef = useRef(layer);
  layerRef.current = layer;

  const history = useMemo(() => (selected ? seriesFor(selected.barrio) : []), [selected]);
  const title = LAYERS.find((l) => l.id === layer)?.label ?? "Precio";

  useEffect(() => {
    if (!wrap.current || mapRef.current) return;
    let cancelled = false;

    void (async () => {
      const maplibre = await import("maplibre-gl");
      if (cancelled || !wrap.current) return;

      const map = new maplibre.Map({
        container: wrap.current,
        style: darkStyle,
        center: [-58.42, -34.6],
        zoom: 11.05,
        pitch: 38,
        bearing: -16,
        canvasContextAttributes: { antialias: true },
      });
      mapRef.current = map;
      map.addControl(new maplibre.NavigationControl({ visualizePitch: true }), "bottom-right");

      map.on("load", async () => {
        const raw = (await fetch("/geo/caba_barrios.geojson").then((r) =>
          r.json(),
        )) as FeatureCollection;
        map.addSource("barrios", {
          type: "geojson",
          data: enrich(raw),
          promoteId: "BARRIO",
        });
        const before = firstSymbolId(map);

        if (map.getSource("openmaptiles")) {
          map.addLayer(
            {
              id: "osm-buildings",
              source: "openmaptiles",
              "source-layer": "building",
              type: "fill-extrusion",
              minzoom: 14,
              paint: {
                "fill-extrusion-color": "#1c1010",
                "fill-extrusion-opacity": 0.55,
                "fill-extrusion-height": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  14,
                  0,
                  16,
                  ["coalesce", ["get", "render_height"], ["get", "height"], 10],
                ],
              },
            },
            before,
          );
        }

        map.addLayer(
          {
            id: "barrios-fill",
            type: "fill",
            source: "barrios",
            paint: {
              "fill-color": ["get", "fillPrice"],
              "fill-opacity": [
                "interpolate",
                ["linear"],
                ["zoom"],
                11,
                ["case", ["boolean", ["feature-state", "hover"], false], 0.92, 0.78],
                15,
                0.28,
                16,
                0.12,
              ],
            },
          },
          before,
        );
        map.addLayer(
          {
            id: "barrios-line",
            type: "line",
            source: "barrios",
            paint: {
              "line-color": [
                "case",
                ["boolean", ["feature-state", "selected"], false],
                "#e10600",
                ["boolean", ["feature-state", "hover"], false],
                "#f0c8b4",
                "rgba(232, 180, 150, 0.28)",
              ],
              "line-width": [
                "case",
                ["boolean", ["feature-state", "selected"], false],
                2.6,
                ["boolean", ["feature-state", "hover"], false],
                1.6,
                0.8,
              ],
            },
          },
          before,
        );
        map.addLayer(
          {
            id: "barrio-wake",
            type: "fill-extrusion",
            source: "barrios",
            filter: ["==", ["get", "BARRIO"], ""],
            paint: {
              "fill-extrusion-color": ["get", "fillPrice"],
              "fill-extrusion-opacity": 0.88,
              "fill-extrusion-height": 420,
              "fill-extrusion-base": 0,
            },
          },
          before,
        );

        const pick = (e: MapLayerMouseEvent) =>
          String(e.features?.[0]?.properties?.BARRIO || "");

        map.on("mousemove", "barrios-fill", (e: MapLayerMouseEvent) => {
          map.getCanvas().style.cursor = "pointer";
          const name = pick(e);
          if (!name) return;
          if (hoveredRef.current && hoveredRef.current !== name) {
            map.setFeatureState({ source: "barrios", id: hoveredRef.current }, { hover: false });
          }
          hoveredRef.current = name;
          map.setFeatureState({ source: "barrios", id: name }, { hover: true });
          setHoverName(name);
        });
        map.on("mouseleave", "barrios-fill", () => {
          map.getCanvas().style.cursor = "";
          if (hoveredRef.current) {
            map.setFeatureState({ source: "barrios", id: hoveredRef.current }, { hover: false });
            hoveredRef.current = null;
          }
          setHoverName(null);
        });
        map.on("click", "barrios-fill", (e: MapLayerMouseEvent) => {
          const name = pick(e);
          const stats = name ? CABA_PRICES[name] : undefined;
          if (!stats || !e.lngLat) return;
          if (selectedRef.current) {
            map.setFeatureState({ source: "barrios", id: selectedRef.current }, { selected: false });
          }
          selectedRef.current = name;
          map.setFeatureState({ source: "barrios", id: name }, { selected: true });
          map.setFilter("barrio-wake", ["==", ["get", "BARRIO"], name]);
          map.setPaintProperty("barrio-wake", "fill-extrusion-color", ["get", fillFor(layerRef.current)]);
          setSelected(stats);
          map.easeTo({
            center: [e.lngLat.lng, e.lngLat.lat],
            zoom: Math.max(map.getZoom(), 12.4),
            pitch: 56,
            duration: 700,
          });
        });
        map.on("click", (e) => {
          const hits = map.queryRenderedFeatures(e.point, { layers: ["barrios-fill"] });
          if (hits.length) return;
          if (selectedRef.current) {
            map.setFeatureState({ source: "barrios", id: selectedRef.current }, { selected: false });
            selectedRef.current = null;
          }
          map.setFilter("barrio-wake", ["==", ["get", "BARRIO"], ""]);
          setSelected(null);
        });
      });
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getLayer("barrios-fill")) return;
    const key = fillFor(layer);
    map.setPaintProperty("barrios-fill", "fill-color", ["get", key]);
    if (map.getLayer("barrio-wake")) {
      map.setPaintProperty("barrio-wake", "fill-extrusion-color", ["get", key]);
    }
  }, [layer]);

  return (
    <div className="stage">
      <div className="map-root" ref={wrap} />
      <div className="scan" aria-hidden />

      <header className="hud-top">
        <div className="brand">
          <Link to="/" className="back">
            País
          </Link>
          <strong>Argentina Property Prices</strong>
          <span>AMBA · publicación</span>
        </div>
        <nav className="layer-tabs" aria-label="Variables">
          {LAYERS.map((item) => (
            <button
              key={item.id}
              className={layer === item.id ? "on" : ""}
              onClick={() => setLayer(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="chip">
          <button className="on">USD</button>
          <button>ARS</button>
        </div>
      </header>

      <aside className={`inspector ${selected ? "live" : ""}`}>
        <div className="kicker">{hoverName && !selected ? hoverName : "CABA · territorio"}</div>
        <h3>{selected?.barrio ?? "Elegí un barrio"}</h3>
        {selected ? (
          <>
            <div className="metric">
              {selected.usdM2.toLocaleString("en-US")}
              <small>USD/m²</small>
            </div>
            <div className="rows">
              <div>
                12 meses{" "}
                <b>
                  {selected.yoyPct > 0 ? "+" : ""}
                  {selected.yoyPct}%
                </b>
              </div>
              <div>
                Renta bruta <b>{selected.yieldPct ?? "—"}%</b>
              </div>
              <div>
                Airbnb <b>{selected.airbnbListings ?? "—"}</b>
                {selected.airbnbAdrUsd ? ` · ADR ${selected.airbnbAdrUsd}` : ""}
              </div>
              <div>
                Obra (seed) <b>{obraUnitsFor(selected.barrio)}</b>
              </div>
            </div>
            <div className="evo">
              <div className="kicker">Evolución · 8 trimestres</div>
              <Spark values={history.map((p) => p.usdM2)} label="USD/m²" />
              <Spark values={history.map((p) => p.yieldPct)} label="Renta %" />
              <Spark values={history.map((p) => p.airbnbListings)} label="Airbnb" />
              <Spark values={history.map((p) => p.obraUnits)} label="Obra" />
            </div>
            <p className="note">
              Precio de publicación, no de cierre. Series de semilla hasta que entre el dump
              semanal del bot.
            </p>
          </>
        ) : (
          <>
            <div className="metric">
              {CABA_MEDIAN.toLocaleString("en-US")}
              <small>mediana</small>
            </div>
            <p className="note">
              Mapa de territorios. El color es la variable del tab. Un barrio solo se levanta
              cuando lo seleccionás.
            </p>
          </>
        )}
      </aside>

      <div className="legend">
        <h4>{title}</h4>
        <div className="ramp" />
        <div className="ramp-labels">
          <span>bajo</span>
          <span>alto</span>
        </div>
      </div>

      <div className="cam-hint">
        <h4>Cámara</h4>
        <ul>
          <li>
            <b>Arrastrar</b> mover
          </li>
          <li>
            <b>Ctrl + arrastrar</b> orbitar
          </li>
          <li>
            <b>Rueda</b> zoom
          </li>
          <li>
            <b>Clic</b> despertar barrio
          </li>
        </ul>
      </div>
    </div>
  );
}
