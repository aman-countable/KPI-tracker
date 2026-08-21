# Countable Tracker (Vercel)

Airtable-style monthly KPI matrix for Atin’s slim catalog, with click-through
deal drill-down. Numbers come from the existing Python report engine — this app
is presentation only.

## Publish data

```bash
cd apps/n8n/kpi-pipeline
python -m report.build_report --target web
```

Writes `apps/countable-tracker/public/data/latest.json`.

Optional: `--target both` also refreshes Google Sheets.

## Local UI

```bash
cd apps/countable-tracker
npm install
npm run dev
```

Open http://localhost:3100

## Vercel

1. Import the repo; set **Root Directory** to `apps/countable-tracker`.
2. Framework: Next.js (default).
3. Enable **Deployment Protection** (Vercel password) for internal use.
4. After each KPI refresh, re-run `build_report --target web` and redeploy
   (or commit `latest.json` / upload via CI).

## What’s on the screen

- 29 Atin-visible KPIs (parked catalog rows hidden)
- FY months Apr 2026 → Mar 2027
- RAG: Behind &lt;50%, At Risk 50–99%, On Track ≥100%
- Click an Actual → drawer of deals/meetings + HubSpot link
