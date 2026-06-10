# PATCO Speedline Schedule — Project Context

## What This Is
Automated pipeline that downloads PATCO Speedline's published PDF schedule,
parses it into structured JSON, and serves it via a Next.js web app.
Runs daily via GitHub Actions; only commits when the PDF has changed.

## Repo Layout
```
patco-schedule/
├── pipeline/          Python 3.11 — fetch, parse, store
│   ├── main.py        entry point (run with: python pipeline/main.py)
│   ├── scraper.py     downloads PDF, SHA-256 change detection
│   ├── parser.py      pdfplumber extraction → Trip objects
│   ├── storage.py     writes data/public/schedule.json + SQLite audit log
│   └── requirements.txt
├── web/               Next.js 14 (App Router, TypeScript, Tailwind)
│   ├── app/           layouts, pages
│   └── components/    ScheduleTable, ServiceSelector
├── data/
│   ├── public/        schedule.json  ← committed, served by web app
│   └── audit/         audit.db (SQLite) + raw PDFs + .last_digest
└── .github/workflows/
    └── daily.yml      cron: 06:00 UTC daily
```

## Key Design Decisions
- **Flat JSON over a database** for public data — simplest possible CDN caching,
  zero infrastructure needed for the frontend.
- **SQLite audit log** tracks every pipeline run: timestamp, PDF hash, trip count,
  whether data changed. Never deleted.
- **Hash-based change detection** — the pipeline only re-parses and republishes
  when the PDF actually changes, keeping git history clean.
- **ISR (revalidate = 3600)** in Next.js — pages rebuild at most once per hour
  without a full redeploy.

## Running Locally

### Pipeline
```bash
cd pipeline
pip install -r requirements.txt
python main.py          # normal run
python main.py --force  # force re-parse even if PDF unchanged
```

### Web
```bash
cd web
npm install
npm run dev   # http://localhost:3000
```

## Data Shape (`data/public/schedule.json`)
```json
{
  "effective_date": "January 1, 2024",
  "generated_at": "2024-06-04T06:12:00Z",
  "trips": [
    {
      "direction": "NJ_TO_PHILLY",
      "service_type": "weekday",
      "stops": [
        [
          { "station": "Lindenwold", "time": "05:00" },
          { "station": "City Hall",  "time": "05:38" }
        ]
      ]
    }
  ]
}
```

## PATCO Stations (NJ → Philadelphia)
1. Lindenwold
2. Ashland
3. Woodcrest
4. Haddonfield
5. Westmont
6. Collingswood
7. Ferry Avenue
8. Broadway
9. City Hall
10. 8th & Market
11. 9th-10th & Locust
12. 12-13th & Locust
13. 15-16th & Locust

## Parser Notes
- `parser.py` uses heuristics on table headers to find station columns.
  If PATCO changes their PDF format, update `STATIONS` list and
  `_detect_direction()` / `_detect_service_type()` in `parser.py`.
- Times are normalised to 24-hour `HH:MM` format.

## Environment / Secrets
No secrets required for the pipeline (public PDF URL).
If PATCO ever requires auth, add `PATCO_SESSION_COOKIE` as a GitHub Actions
secret and read it in `scraper.py` via `os.environ`.
