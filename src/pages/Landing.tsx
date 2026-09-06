import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Map as MlMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { CITIES, type City } from "../data/cities";
import { darkStyle } from "../lib/mapStyle";
import { Newsletter } from "../components/Newsletter";

export function Landing() {
  const wrap = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const navigate = useNavigate();
  const [soon, setSoon] = useState<City | null>(null);
  const [lang, setLang] = useState<"es" | "en">("es");

  useEffect(() => {
    if (!wrap.current || mapRef.current) return;
    let cancelled = false;

    void (async () => {
      const maplibre = await import("maplibre-gl");
      if (cancelled || !wrap.current) return;

      const map = new maplibre.Map({
        container: wrap.current,
        style: darkStyle,
        center: [-64.5, -38.2],
        zoom: 3.55,
        pitch: 42,
        bearing: -12,
        maxBounds: [
          [-80, -56.5],
          [-50, -20],
        ],
        canvasContextAttributes: { antialias: true },
      });
      mapRef.current = map;

      map.on("load", async () => {
        const provincias = await fetch("/geo/provincias.geojson").then((r) => r.json());
        map.addSource("provincias", { type: "geojson", data: provincias });
        map.addLayer({
          id: "prov-fill",
          type: "fill",
          source: "provincias",
          paint: {
            "fill-color": [
              "case",
              ["==", ["get", "iso_id"], "AR-C"],
              "#e10600",
              ["==", ["get", "iso_id"], "AR-B"],
              "#8a1218",
              "#1b1010",
            ],
            "fill-opacity": [
              "case",
              ["==", ["get", "iso_id"], "AR-C"],
              0.45,
              ["==", ["get", "iso_id"], "AR-B"],
              0.28,
              0.18,
            ],
          },
        });
        map.addLayer({
          id: "prov-line",
          type: "line",
          source: "provincias",
          paint: { "line-color": "rgba(232,195,106,0.22)", "line-width": 0.6 },
        });

        CITIES.forEach((city) => {
          const el = document.createElement("button");
          el.className = "city-pin";
          el.style.cssText = [
            "width:14px",
            "height:14px",
            "border-radius:99px",
            "border:2px solid #efe7d6",
            city.status === "live"
              ? "background:#e10600;box-shadow:0 0 18px #e10600"
              : "background:#4a3030",
            "cursor:pointer",
            "padding:0",
          ].join(";");
          el.title = city.name;
          el.onclick = () => {
            if (city.status === "live") {
              navigate("/amba");
            } else {
              setSoon(city);
            }
          };
          new maplibre.Marker({ element: el }).setLngLat([city.lng, city.lat]).addTo(map);
        });
      });
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [navigate]);

  return (
    <div className="landing-scroll">
      <section className="landing-map">
        <div className="map-root" ref={wrap} />
        <header className="topbar">
          <div className="brand">
            <strong>Argentina Property Prices</strong>
            <span>CABA + GBA first · provinces next</span>
          </div>
          <div className="chip-row">
            <div className="chip">
              <button className={lang === "es" ? "on" : ""} onClick={() => setLang("es")}>
                ES
              </button>
              <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>
                EN
              </button>
            </div>
            <div className="chip">
              <button className="on">USD</button>
              <button>ARS</button>
            </div>
          </div>
        </header>
        <div className="hero-copy">
          <h1>
            {lang === "es" ? "El precio de la Argentina, en el mapa." : "The price of Argentina, mapped."}
          </h1>
          <p>
            {lang === "es"
              ? "Precios de publicación, rentabilidad, Airbnb y obra. Empezamos por AMBA."
              : "Asking prices, yields, Airbnb and new construction. AMBA ships first."}
          </p>
          <button className="cta" onClick={() => navigate("/amba")}>
            Explorar AMBA →
          </button>
        </div>
      </section>
      <Newsletter />
      {soon && (
        <div className="overlay" onClick={() => setSoon(null)}>
          <div className="popup-soon" onClick={(e) => e.stopPropagation()}>
            <h3>{soon.name}</h3>
            <p style={{ color: "var(--color-muted)", fontWeight: 300 }}>
              Disponible pronto. Dejanos el mail y te avisamos cuando esa ciudad se prenda
              en el mapa.
            </p>
            <Newsletter compact defaultCity={soon.id} />
            <button className="chip" style={{ marginTop: 8 }} onClick={() => setSoon(null)}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
