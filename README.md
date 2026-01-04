# DayTrade Dashboard (Local)

A minimal React + Vite dashboard to visualize daily, monthly, and yearly trading stats from a sample dataset.

## Quickstart

1. Install dependencies

```bash
npm install
```

2. Run the dev server

```bash
npm run dev
```

3. Open http://localhost:5173 in your browser

## Files
- `src/data/sample_data.json` - example trades
- `src/utils/aggregations.js` - aggregation helpers
- `src/components` - chart components
- `src/App.jsx` - main dashboard UI

## Next steps
- Replace `sample_data.json` with your own CSV or Google Sheets data
- Add filters, date range picker, caching
- Add authentication for private dashboards

---

## Google Sheets integration
You can load a public Google Sheet into the dashboard by setting Vite env vars.

1. Create a `.env` file at the project root and add your sheet id (from the URL):

```
VITE_SHEET_ID=
VITE_SHEET_GID=0
```

2. Restart the dev server (`npm run dev`). When `VITE_SHEET_ID` is set the app will fetch the sheet and use it as the dashboard data source.

**Local CSV support:** If you place a CSV file into `docs/` with a header row (the project includes `docs/DayTrade Strategy.csv`), the app will automatically try to load and parse that file first. Expected headers include `Date`, `Ticker`, `Entry`, `Exit`, `% Return`, `PnL`, `Cum PnL (Day)`, and `Notes`.

