"""Lightweight script for the 6-hour special-check workflow.

Reads existing schedule.json, updates special_dates only, writes back.
Does NOT re-download or re-parse the PDF.
"""

import json
import logging
from pathlib import Path

import special_checker

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger("patco.special")

SCHEDULE_JSON = Path("data/public/schedule.json")


def run() -> None:
    data = json.loads(SCHEDULE_JSON.read_text())
    specials = special_checker.check_special_schedules()
    new_special_dates = {
        s["date"]: {"note": s["note"], "pdf_url": s["pdf_url"]}
        for s in specials
        if s.get("date")
    }
    if new_special_dates != data.get("special_dates", {}):
        data["special_dates"] = new_special_dates
        SCHEDULE_JSON.write_text(json.dumps(data, indent=2))
        logger.info("special_dates updated: %s", new_special_dates)
    else:
        logger.info("No changes to special_dates.")


if __name__ == "__main__":
    run()
