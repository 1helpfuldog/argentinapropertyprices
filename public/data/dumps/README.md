# Grok bot dumps

Drop JSON here. The map reads the newest file per geo + cadence.

```
public/data/dumps/{geo}/{cadence}/{asOf}.json
public/data/dumps/CABA/weekly/2026-09-06.json
```

Shape: see `src/data/pipeline.ts` (`BotDump`).

- weekly — asking USD/m², nAsk, days listed
- monthly — Airbnb listings + ADR, obra units
- quarterly — yield, mortgage flow (`credit`)

Asking prices, not escrituras. No secrets in these files.
