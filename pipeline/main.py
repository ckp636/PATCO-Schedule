"""Entry point for the PATCO schedule pipeline.

Usage:
    python main.py [--force]

--force: re-parse and publish even if the PDF hash hasn't changed.
"""

import argparse
import logging
import sys
from pathlib import Path

import scraper
import parser as schedule_parser
import storage

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger("patco.main")

LAST_DIGEST_FILE = Path(__file__).parent.parent / "data" / "audit" / ".last_digest"


def run(force: bool = False) -> int:
    # 1. Download
    try:
        content, digest = scraper.fetch_pdf()
    except Exception as exc:
        logger.error("Failed to fetch PDF: %s", exc)
        return 1

    pdf_path = scraper.save_pdf(content, digest)

    # 2. Change detection
    changed = force or scraper.is_changed(digest, LAST_DIGEST_FILE)
    if not changed:
        logger.info("No change detected (sha256 prefix=%s). Skipping parse.", digest[:12])
        storage.log_run(digest, schedule_parser.Schedule(effective_date="unchanged"), changed=False)
        return 0

    # 3. Parse
    try:
        schedule = schedule_parser.parse_pdf(pdf_path)
    except Exception as exc:
        logger.error("Failed to parse PDF: %s", exc)
        storage.log_run(digest, schedule_parser.Schedule(effective_date="error"), changed=True, notes=str(exc))
        return 1

    # 4. Publish
    try:
        storage.write_public_json(schedule)
        scraper.record_digest(digest, LAST_DIGEST_FILE)
        storage.log_run(digest, schedule, changed=True)
    except Exception as exc:
        logger.error("Failed to write output: %s", exc)
        return 1

    logger.info("Pipeline complete — %d trips published.", len(schedule.trips))
    return 0


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="PATCO schedule pipeline")
    ap.add_argument("--force", action="store_true", help="Re-parse even if PDF unchanged")
    args = ap.parse_args()
    sys.exit(run(force=args.force))
