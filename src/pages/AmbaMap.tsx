import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import maplibregl from "maplibre-gl";
import type { GeoJSON } from "geojson";
import "maplibre-gl/dist/maplibre-gl.css";
import { CABA_MEDIAN, CABA_PRICES, priceColor, type BarrioStats } from "../data/cabaPrices";
import { darkStyle } from "../lib/mapStyle";

type LayerId = "price" | "yield" | "airbnb" | "obra";

function enrich(geo: GeoJSON.FeatureCollection) {
  return {
    ...geo,
    features: geo.features.map((f) => {
      const name = String(f.properties?.BARRIO || "");
      const stats = CABA_PRICES[name];
      return {
        ...f,
        id: name,
        properties: {
          ...f.properties,
          usdM2: stats?.usdM2 ?? 0,
          yoyPct: stats?.yoyPct ?? 0,
          yieldPct: stats?.yieldPct ?? 0,
          airbnbListings: stats?.airbnbListings ?? 0,
          fill: stats ? priceColor(stats.usdM2) : "#22303c",
        },
      };
    }),
  };
}

export function AmbaMap() {
  const wrap = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [layer, setLayer] = useState<LayerId>("price");
  const [selected, setSelected] = useState<BarrioStats | null>(null);
  const title = useMemo(() => {
    if (layer === "yield") return "Rentabilidad bruta";
    if (layer === "airbnb") return "Volumen Airbnb";
    if (layer === "obra") return "Obra y pozo";
    return "Precio publicado USD/m²";
  }, [layer]);

  useEffect(() => {
    if (!wrap.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: wrap.current,
      style: darkStyle,
      center: [-58.42, -34.6],
      zoom: 11.2,
      pitch: 48,
      bearing: -18,
    });
    mapRef.current = map;

    map.on("load", async () => {
      const raw = await fetch("/geo/caba_barrios.geojson").then((r) => r.json());
      map.addSource("barrios", { type: "geojson", data: enrich(raw) });
      map.addLayer({
        id: "barrios-fill",
        type: "fill-extrusion",
        source: "barrios",
        paint: {
          "fill-extrusion-color": ["get", "fill"],
          "fill-extrusion-opacity": 0.82,
          "fill-extrusion-height": ["*", ["get", "usdM2"], 0.55],
          "fill-extrusion-base": 0,
        },
      });
      map.addLayer({
        id: "barrios-line",
        type: "line",
        source: "barrios",
        paint: { "line-color": "rgba(239,231,214,0.25)", "line-width": 0.7 },
      });

      map.on("mousemove", "barrios-fill", (e) => {
        map.getCanvas().style.cursor = "pointer";
        const name = e.features?.[0]?.properties?.BARRIO as string | undefined;
        if (name && CABA_PRICES[name]) setSelected(CABA_PRICES[name]);
      });
      map.on("mouseleave", "barrios-fill", () => {
        map.getCanvas().style.cursor = "";
      });
      map.on("click", "barrios-fill", (e) => {
        const name = e.features?.[0]?.properties?.BARRIO as string | undefined;
        if (name && CABA_PRICES[name]) setSelected(CABA_PRICES[name]);
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getLayer("barrios-fill")) return;
    if (layer === "price") {
      map.setPaintProperty("barrios-fill", "fill-extrusion-color", ["get", "fill"]);
      map.setPaintProperty("barrios-fill", "fill-extrusion-height", ["*", ["get", "usdM2"], 0.55]);
    } else if (layer === "yield") {
      map.setPaintProperty("barrios-fill", "fill-extrusion-color", [
        "interpolate",
        ["linear"],
        ["get", "yieldPct"],
        3.5,
        "#5a4630",
        6,
        "#7d8a6a",
        10.5,
        "#8fbf9a",
      ]);
      map.setPaintProperty("barrios-fill", "fill-extrusion-height", ["*", ["get", "yieldPct"], 280]);
    } else if (layer === "airbnb") {
      map.setPaintProperty("barrios-fill", "fill-extrusion-color", [
        "interpolate",
        ["linear"],
        ["get", "airbnbListings"],
        0,
        "#2a3140",
        400,
        "#6b4a7a",
        2000,
        "#a45aa8",
        4800,
        "#e0a0e6",
      ]);
      map.setPaintProperty("barrios-fill", "fill-extrusion-height", ["*", ["get", "airbnbListings"], 1.6]);
    } else {
      map.setPaintProperty("barrios-fill", "fill-extrusion-color", "#4d6b73");
      map.setPaintProperty("barrios-fill", "fill-extrusion-height", 120);
    }
  }, [layer]);

  return (
    <div className="landing-map">
      <div className="map-root" ref={wrap} />
      <header className="topbar">
        <div className="brand">
          <strong>Argentina Property Prices</strong>
          <span>
            <Link to="/">← País</Link> · AMBA · {title}
          </span>
        </div>
        <div className="chip">
          <button className="on">USD</button>
          <button>ARS</button>
          <button className="on">Venta</button>
        </div>
      </header>

      <nav className="rail" aria-label="Capas">
        <button className={layer === "price" ? "on" : ""} title="Precio m²" onClick={() => setLayer("price")}>
          $
        </button>
        <button className={layer === "yield" ? "on" : ""} title="Rentabilidad" onClick={() => setLayer("yield")}>
          %
        </button>
        <button className={layer === "airbnb" ? "on" : ""} title="Airbnb" onClick={() => setLayer("airbnb")}>
          A
        </button>
        <button className={layer === "obra" ? "on" : ""} title="Obra" onClick={() => setLayer("obra")}>
          +
        </button>
      </nav>

      <aside className="card">
        <div className="kicker">CABA · publicación</div>
        <h3>{selected?.barrio ?? "Ciudad"}</h3>
        {selected ? (
          <>
            <div className="metric">
              {selected.usdM2.toLocaleString("en-US")}
              <small>USD/m²</small>
            </div>
            <div className="rows">
              <div>
                12 meses <b>{selected.yoyPct > 0 ? "+" : ""}{selected.yoyPct}%</b>
              </div>
              <div>
                Renta bruta <b>{selected.yieldPct ?? "—"}%</b>
              </div>
              <div>
                Airbnb avisos <b>{selected.airbnbListings ?? "—"}</b>
                {selected.airbnbAdrUsd ? ` · ADR ~ USD ${selected.airbnbAdrUsd}` : ""}
              </div>
            </div>
            <p className="note">
              Precio de publicación, no de cierre. Muchos avisos llevan meses o
              años en el mercado.
            </p>
          </>
        ) : (
          <>
            <div className="metric">
              {CABA_MEDIAN.toLocaleString("en-US")}
              <small>USD/m² mediana</small>
            </div>
            <p className="note">Pasá el cursor por un barrio. Color y altura = m² publicado.</p>
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
    </div>
  );
}
