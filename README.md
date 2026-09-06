# Argentina Property Prices

Layer 1: country landing + CABA asking-price 3D barrios + 3-minute market brief signup.

Repo: https://github.com/1helpfuldog/argentinapropertyprices

```bash
npm install
npm run dev
```

Open http://localhost:5173

- `/` — Argentina map. AMBA is live. Other cities collect waitlist emails.
- `/amba` — CABA barrios extruded by published USD/m². Layers: price, yield, Airbnb volume, obra stub.

Signups sit in `localStorage` (`app-waitlist`) until a newsletter vendor exists.

## Cloudflare Pages

- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Root directory: `/`

Env (optional):

```
VITE_SENTRY_DSN=
VITE_NEWSLETTER_WEBHOOK=
```

See `STACK.md` for the rest of the stack.
