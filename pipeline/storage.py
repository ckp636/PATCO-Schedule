"""Writes parsed schedule to data/public/ (JSON) and data/audit/ (SQLite)."""

from __future__ import annotations

import json
import logging
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from parser import Schedule, Trip

PUBLIC_DIR = Path(__file__).parent.parent / "data" / "public"
AUDIT_DB = Path(__file__).parent.parent / "data" / "audit" / "audit.db"

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Public JSON output
# ---------------------------------------------------------------------------

def write_public_json(schedule: Schedule) -> Path:
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    payload = {
        "effective_date": schedule.effective_date,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "trips": [_trip_to_dict(t) for t in schedule.trips],
        "special_dates": schedule.special_dates,
    }
    dest = PUBLIC_DIR / "schedule.json"
    dest.write_text(json.dumps(payload, indent=2))
    logger.info("Wrote public JSON to %s (%d trips)", dest, len(schedule.trips))
    return dest


def _trip_to_dict(trip: Trip) -> dict:
    return {
        "direction": trip.direction,
        "service_type": trip.service_type,
        "stops": trip.stops,
    }


# ---------------------------------------------------------------------------
# Audit SQLite log
# ---------------------------------------------------------------------------

def _get_conn() -> sqlite3.Connection:
    AUDIT_DB.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(AUDIT_DB))
    conn.execute("""
        CREATE TABLE IF NOT EXISTS runs (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            run_at    TEXT NOT NULL,
            pdf_sha   TEXT NOT NULL,
            trips     INTEGER NOT NULL,
            changed   INTEGER NOT NULL,
            notes     TEXT
        )
    """)
    conn.commit()
    return conn


def log_run(
    pdf_sha: str,
    schedule: Schedule,
    changed: bool,
    notes: str = "",
) -> None:
    conn = _get_conn()
    conn.execute(
        "INSERT INTO runs (run_at, pdf_sha, trips, changed, notes) VALUES (?,?,?,?,?)",
        (
            datetime.now(timezone.utc).isoformat(),
            pdf_sha,
            len(schedule.trips),
            int(changed),
            notes,
        ),
    )
    conn.commit()
    conn.close()
    logger.info("Audit run logged (changed=%s, trips=%d)", changed, len(schedule.trips))
