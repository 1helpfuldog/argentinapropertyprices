# Argentina Property Prices — stack and resources

Ship order: **this repo is layer 1** (country landing + CABA asking-price extrusion + newsletter capture). Everything below is what you need as the product grows.

## Layer 1 — what is already in this repo

| Piece | Choice | Why |
|---|---|---|
| App | Vite + React 19 + TypeScript | Fast local loop, easy to move to Next later |
| Map | MapLibre GL JS | No Mapbox token to start. Fill-extrusion gives the first “3D” |
| Basemap | CARTO Dark Matter raster | Readable night city without a custom style |
| Boundaries | `public/geo/provincias.geojson` (Georef / IGN) + `caba_barrios.geojson` | Official-enough polygons |
| Prices | `src/data/cabaPrices.ts` | Seed asking USD/m², yield, Airbnb volume |
| Routing | react-router `/` and `/amba` | Country first, city second |
| Newsletter | Form → `localStorage` + optional `VITE_NEWSLETTER_WEBHOOK` | Works before a vendor is picked |

Run:

```bash
cd argentina-property-prices
npm install
npm run dev
```

Open `http://localhost:5173`.

---

## Full stack list

### 1. Product and design

- Figma (frames: country landing, AMBA HUD, barrio card, newsletter, mobile sheet)
- Geo sources bookmarked:
  - [Georef provincias](https://apis.datos.gob.ar/georef/api/provincias.geojson)
  - [BA Data barrios](https://data.buenosaires.gob.ar/dataset/barrios)
  - [IDECABA / Ciudad 3D](https://idecaba.buenosaires.gob.ar/) for later parcel volumes
  - [PDI obras](https://buenosaires.gob.ar) for construction permits
- Type: Outfit + Instrument Serif (already wired)

### 2. Frontend (now → 6 months)

| Now | Next |
|---|---|
| Vite + React + MapLibre | Next.js App Router if you want SSR landing + CMS brief |
| CSS file | Tailwind only if the team prefers it; not required |
| Local React state | Zustand for layer + currency + compare |
| Raster dark basemap | Mapbox Standard 3D **or** MapLibre + custom buildings tileset |
| Barrio extrusion | Manzana / building LoD1 from OSM + Google Open Buildings |

Optional later: `deck.gl` if listing points get into the tens of thousands.

### 3. Data plane (the real product)

Collect with Grok / scrapers, then store cleanly.

| Resource | Use |
|---|---|
| Postgres 16 + PostGIS | Barrios, partidos, snapshots, listings aggregates |
| `barrio_id` / `partido_id` keys | Never join on raw name in production |
| Monthly snapshot table | `source, geography, typology, usd_m2_ask, n_listings, median_age_days` |
| Object storage (R2 / S3) | Raw portal dumps, GeoJSON versions |
| Python 3.12 | ETL: normalize barrio names, FX, dedupe avisos |
| DuckDB (optional) | Local analysis before load |

**Sources to wire**

- Asking sale / rent: Zonaprop index PDFs, Argenprop, Mercado Libre + UdeSA series, BA DGEyC
- Closed prices later: Colegio de Escribanos CABA
- Construction cost: CAC / Cámara Argentina de la Construcción
- Permits / pozo: GCBA PDI, portal “emprendimientos” scrapes
- Airbnb volume: Inside Airbnb export if live; otherwise bounding-box scrape; AirDNA only if you pay for occupancy
- FX: BCRA + MEP series so ARS toggle is dated

Label every number `ask` vs `close`. Layer 1 is ask.

### 4. Backend API

Not needed for layer 1. When the seed JSON is too stale:

- FastAPI or Hono on Workers
- Endpoints: `/markets`, `/barrios/:id/series`, `/layers/airbnb`, `/obras`
- Cache in front (Cloudflare)

### 5. Newsletter (“3 minute brief”)

Pick **one** editorial tool, not a marketing cloud.

| Tool | Fit |
|---|---|
| **Loops.so** | Best default. Audience + one-off broadcasts + API |
| **Buttondown** | If the brief is closer to a letter than a product update |
| **Beehiiv** | If you later want a public archive / sponsorship |
| Resend | Transactional only (confirm email), not the newsletter itself |

Recommended flow:

1. Landing form POSTs to Loops API (or a Zapier/Make webhook).
2. Fields: email, name, city interest (`amba` / `cordoba` / …).
3. You write in a Notion doc → paste into Loops when regulation, m², CAC or rates actually move.
4. Cadence: irregular. Promise that in the form (already copied).

Set `VITE_NEWSLETTER_WEBHOOK` to the Loops/Make URL. Until then signups sit in `localStorage` key `app-waitlist` (dev only).

Do **not** send a weekly digest. That would break the “3 minutes when it matters” contract.

### 6. Hosting

| Piece | Tool |
|---|---|
| Web app | Vercel or Cloudflare Pages |
| Custom domain | Cloudflare DNS |
| GeoJSON / tiles | Cloudflare R2 + cache |
| Secrets | Vercel env / Wrangler |
| Preview URLs | Per PR |

### 7. Observability and quality

- Plausible or Posthog (page + `explore_amba` + `newsletter_submit` + `city_waitlist`)
- Sentry on the map bundle
- Playwright smoke: landing loads, AMBA extrudes, form stores

### 8. 3D upgrade path (do not block layer 1)

1. Keep MapLibre barrio extrusion (done).
2. Add GBA partidos polygons + zone badges.
3. CABA building footprints (OSM / Google Open Buildings) colored by barrio median.
4. Mapbox Standard or Cesium OSM Buildings only when you need true towers + dusk lighting.
5. Obra animation = separate ghost source, not a rebuild of the price mesh.

### 9. Accounts and keys to open now

- GitHub repo
- Vercel / Cloudflare project
- Loops (or Buttondown) account
- Domain `argentinapropertyprices.com` or `.ar` if you want local trust
- Optional: Mapbox token for the 3D basemap experiment
- Optional: AirDNA only after Airbnb layer has volume + ADR from free sources

### 10. What Grok / ETL must produce for layer 2

CSV or parquet, one row per barrio-month:

```
geo_level, geo_id, geo_name, month,
typology, usd_m2_ask, n_ask, median_days_listed,
rent_ask_2amb_ars, yield_gross,
airbnb_active, airbnb_adr_usd,
pozo_projects, pozo_usd_m2
```

Once that file exists, delete `cabaPrices.ts` as the source of truth and load it at build time or from the API.

---

## First-layer definition of done

- [x] Country map, AMBA live, other cities “disponible pronto”
- [x] Newsletter block on the landing
- [x] CABA barrios colored + extruded by asking USD/m²
- [x] Yield and Airbnb color modes (seed data)
- [ ] GBA partidos
- [ ] Fresh-listing filter
- [ ] Real newsletter vendor
- [ ] Time slider
- [ ] Obra rising-bar animation (rail stub only)
