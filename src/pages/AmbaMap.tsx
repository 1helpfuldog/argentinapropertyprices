import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { Map as MlMap, MapLayerMouseEvent } from "maplibre-gl";
import type { FeatureCollection } from "geojson";
import "maplibre-gl/dist/maplibre-gl.css";
import { CABA_MEDIAN, CABA_PRICES, obraUnitsFor, type BarrioStats } from "../data/cabaPrices";
import { seriesFor } from "../data/cabaHistory";
import { darkStyle } from "../lib/mapStyle";
import { Spark } from "../components/Spark";
import { EvoModal, type EvoKey } from "../components/EvoModal";
import { LangToggle, useLang } from "../lib/lang";
import { enrich, fillFor, firstSymbolId, type LayerId } from "./ambaGeo";

export function AmbaMap() {
  const { t } = useLang();
  const wrap = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const hoveredRef = useRef<string | null>(null);
  const selectedRef = useRef<string | null>(null);
  const [layer, setLayer] = useState<LayerId>("price");
  const [airbnbOn, setAirbnbOn] = useState(false);
  const [selected, setSelected] = useState<BarrioStats | null>(null);
  const [hoverName, setHoverName] = useState<string | null>(null);
  const [evo, setEvo] = useState<EvoKey | null>(null);
  const layerRef = useRef(layer);
  layerRef.current = layer;

  const history = useMemo(() => (selected ? seriesFor(selected.barrio) : []), [selected]);
  const title = layer === "yield" ? t.layerYield : layer === "obra" ? t.layerObra : t.layerPrice;

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
        const raw = (await fetch("/geo/caba_barrios.geojson").then((r) => r.json())) as FeatureCollection;
        const { polys, points } = enrich(raw);
        map.addSource("barrios", { type: "geojson", data: polys, promoteId: "BARRIO" });
        map.addSource("airbnb-pts", { type: "geojson", data: points });
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
                "#fff6ea",
                "rgba(248, 240, 228, 0.72)",
              ],
              "line-width": [
                "interpolate",
                ["linear"],
                ["zoom"],
                10,
                [
                  "case",
                  ["boolean", ["feature-state", "selected"], false],
                  2.4,
                  ["boolean", ["feature-state", "hover"], false],
                  1.8,
                  1.05,
                ],
                13,
                [
                  "case",
                  ["boolean", ["feature-state", "selected"], false],
                  3.2,
                  ["boolean", ["feature-state", "hover"], false],
                  2.2,
                  1.45,
                ],
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
        map.addLayer({
          id: "airbnb-dots",
          type: "circle",
          source: "airbnb-pts",
          layout: { visibility: "none" },
          paint: {
            "circle-color": "#f0d2b4",
            "circle-stroke-color": "#0a0606",
            "circle-stroke-width": 1,
            "circle-opacity": 0.85,
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["get", "airbnbListings"],
              0,
              2.5,
              200,
              5,
              800,
              8,
              4800,
              14,
            ],
          },
        });
        map.addLayer({
          id: "barrio-labels",
          type: "symbol",
          source: "barrios",
          minzoom: 10.4,
          layout: {
            "text-field": ["get", "BARRIO"],
            "text-font": ["Noto Sans Regular"],
            "text-size": ["interpolate", ["linear"], ["zoom"], 10.5, 10, 13, 13],
            "text-letter-spacing": 0.06,
            "text-max-width": 9,
            "text-padding": 2,
          },
          paint: {
            "text-color": "#f7f1e6",
            "text-halo-color": "rgba(10,6,6,0.88)",
            "text-halo-width": 1.6,
            "text-halo-blur": 0.2,
          },
        });

        const pick = (e: MapLayerMouseEvent) => String(e.features?.[0]?.properties?.BARRIO || "");

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

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getLayer("airbnb-dots")) return;
    map.setLayoutProperty("airbnb-dots", "visibility", airbnbOn ? "visible" : "none");
  }, [airbnbOn]);

  const hero = selected
    ? airbnbOn
      ? { n: selected.airbnbListings ?? 0, unit: t.airbnb }
      : layer === "yield"
        ? { n: selected.yieldPct ?? 0, unit: "%" }
        : layer === "obra"
          ? { n: obraUnitsFor(selected.barrio), unit: t.obra }
          : { n: selected.usdM2, unit: "USD/m²" }
    : { n: CABA_MEDIAN, unit: t.median };

  return (
    <div className="stage">
      <div className="map-root" ref={wrap} />
      <div className="scan" aria-hidden />

      <header className="hud-top">
        <div className="brand">
          <Link to="/" className="back">
            {t.backCountry}
          </Link>
          <strong>Argentina Property Prices</strong>
          <span>{t.brandSubAmba}</span>
        </div>
        <nav className="layer-tabs" aria-label={t.overlays}>
          <button className={layer === "price" ? "on" : ""} data-tip={t.tipPrice} onClick={() => setLayer("price")}>
            {t.layerPrice}
          </button>
          <button className={layer === "yield" ? "on" : ""} data-tip={t.tipYield} onClick={() => setLayer("yield")}>
            {t.layerYield}
          </button>
          <button className={layer === "obra" ? "on" : ""} data-tip={t.tipObra} onClick={() => setLayer("obra")}>
            {t.layerObra}
          </button>
        </nav>
        <div className="chip-row">
          <div className="chip">
            <span className="on">{t.usd}</span>
          </div>
          <LangToggle />
        </div>
      </header>

      <aside className="overlay-rail" aria-label={t.overlays}>
        <div className="kicker">{t.overlays}</div>
        <button className={airbnbOn ? "on" : ""} data-tip={t.tipAirbnb} onClick={() => setAirbnbOn((v) => !v)}>
          {t.overlayAirbnb}
        </button>
        <button disabled data-tip={t.tipComercial}>
          {t.overlayCom} · {t.soon}
        </button>
        <button disabled data-tip={t.tipOffice}>
          {t.overlayOff} · {t.soon}
        </button>
      </aside>

      <aside className={`inspector ${selected ? "live" : ""}`}>
        <div className="kicker">{hoverName && !selected ? hoverName : t.territory}</div>
        <h3>{selected?.barrio ?? t.pickBarrio}</h3>
        {selected ? (
          <>
            <div className="metric">
              {typeof hero.n === "number" ? hero.n.toLocaleString("en-US") : hero.n}
              <small>{hero.unit}</small>
            </div>
            <div className="rows">
              {airbnbOn && (
                <div>
                  {t.airbnb} <b>{selected.airbnbListings ?? "—"}</b>
                  {selected.airbnbAdrUsd ? ` · ${t.adr} ${selected.airbnbAdrUsd}` : ""}
                </div>
              )}
              <div>
                {t.layerPrice} <b>{selected.usdM2.toLocaleString("en-US")}</b>
              </div>
              <div>
                {t.yoy}{" "}
                <b>
                  {selected.yoyPct > 0 ? "+" : ""}
                  {selected.yoyPct}%
                </b>
              </div>
              <div>
                {t.yield} <b>{selected.yieldPct ?? "—"}%</b>
              </div>
              {!airbnbOn && (
                <div>
                  {t.airbnb} <b>{selected.airbnbListings ?? "—"}</b>
                </div>
              )}
              <div>
                {t.obra} <b>{obraUnitsFor(selected.barrio)}</b>
              </div>
            </div>
            <div className="evo">
              <div className="kicker">{t.evo}</div>
              <Spark values={history.map((p) => p.usdM2)} label={t.layerPrice} hint={t.clickHint} onOpen={() => setEvo("usdM2")} />
              <Spark values={history.map((p) => p.yieldPct)} label={t.layerYield} hint={t.clickHint} onOpen={() => setEvo("yieldPct")} />
              <Spark
                values={history.map((p) => p.airbnbListings)}
                label={t.overlayAirbnb}
                hint={t.clickHint}
                onOpen={() => setEvo("airbnbListings")}
              />
              <Spark values={history.map((p) => p.obraUnits)} label={t.layerObra} hint={t.clickHint} onOpen={() => setEvo("obraUnits")} />
              <p className="fine">{t.clickChart}</p>
            </div>
            <p className="note">{t.note}</p>
          </>
        ) : (
          <>
            <div className="metric">
              {CABA_MEDIAN.toLocaleString("en-US")}
              <small>{t.median}</small>
            </div>
            <p className="note">{t.emptyNote}</p>
          </>
        )}
      </aside>

      <div className="legend">
        <h4>{title}</h4>
        <div className="ramp" />
        <div className="ramp-labels">
          <span>{t.low}</span>
          <span>{t.high}</span>
        </div>
      </div>

      <div className="cam-hint">
        <h4>{t.camera}</h4>
        <ul>
          <li>
            <b>{t.camPan}</b> {t.camPanDo}
          </li>
          <li>
            <b>{t.camOrbit}</b> {t.camOrbitDo}
          </li>
          <li>
            <b>{t.camZoom}</b> {t.camZoomDo}
          </li>
          <li>
            <b>{t.camClick}</b> {t.camClickDo}
          </li>
        </ul>
      </div>

      {evo && selected && <EvoModal barrio={selected.barrio} metric={evo} onClose={() => setEvo(null)} />}
    </div>
  );
}
