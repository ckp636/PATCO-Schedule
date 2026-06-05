"""Downloads the PATCO schedule PDF from ridepatco.org."""

import hashlib
import logging
import os
from pathlib import Path

import requests

PATCO_SCHEDULE_URL = "https://www.ridepatco.org/pdf/PATCO_Timetable.pdf"
DOWNLOAD_DIR = Path(__file__).parent.parent / "data" / "audit"

logger = logging.getLogger(__name__)


def fetch_pdf(url: str = PATCO_SCHEDULE_URL) -> tuple[bytes, str]:
    """Fetch PDF bytes and return (content, sha256_hex)."""
    logger.info("Fetching schedule PDF from %s", url)
    resp = requests.get(url, timeout=30)
    resp.raise_for_status()
    content = resp.content
    digest = hashlib.sha256(content).hexdigest()
    logger.info("Downloaded %d bytes (sha256=%s)", len(content), digest[:12])
    return content, digest


def save_pdf(content: bytes, digest: str) -> Path:
    """Persist raw PDF under data/audit/ keyed by content hash."""
    dest = DOWNLOAD_DIR / f"schedule_{digest[:12]}.pdf"
    if dest.exists():
        logger.info("PDF already cached at %s", dest)
        return dest
    DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(content)
    logger.info("Saved PDF to %s", dest)
    return dest


def is_changed(digest: str, last_digest_file: Path) -> bool:
    """Return True if the digest differs from the last recorded run."""
    if not last_digest_file.exists():
        return True
    return last_digest_file.read_text().strip() != digest


def record_digest(digest: str, last_digest_file: Path) -> None:
    last_digest_file.parent.mkdir(parents=True, exist_ok=True)
    last_digest_file.write_text(digest)
