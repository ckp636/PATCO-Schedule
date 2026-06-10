import anthropic
import requests
import json
import logging

logger = logging.getLogger(__name__)

MOBILE_URL = "https://www.ridepatco.org/m/schedules.asp"


def check_special_schedules() -> list[dict]:
    """
    Uses Claude API to parse PATCO mobile schedule page and extract
    any special schedules, trackwork, or service alerts.
    Returns: [{"date": "YYYY-MM-DD", "note": str, "pdf_url": str}]
    Returns [] on any error — never crashes pipeline.
    """
    try:
        html = requests.get(MOBILE_URL, timeout=30).text
        client = anthropic.Anthropic()
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1000,
            messages=[{
                "role": "user",
                "content": f"""You are checking the PATCO Speedline schedule page \
for any special schedules, trackwork notices, or service changes.

Extract ALL special schedule entries from this HTML.
Return a JSON array ONLY — no explanation, no markdown:
[
  {{
    "date": "YYYY-MM-DD",
    "note": "brief description of the special service",
    "pdf_url": "full URL to PDF if found, else empty string"
  }}
]

If there are no special schedules, return exactly: []

HTML content:
{html[:8000]}"""
            }]
        )
        result = json.loads(response.content[0].text.strip())
        logger.info("Claude found %d special schedule(s)", len(result))
        return result
    except Exception as exc:
        logger.warning("Special schedule check failed: %s", exc)
        return []


def check_timetable_update() -> dict | None:
    """
    Uses Claude API to detect if PATCO has published a new regular timetable.
    Returns {"effective_date": str, "note": str} if new update found, else None.
    """
    try:
        html = requests.get(MOBILE_URL, timeout=30).text
        client = anthropic.Anthropic()
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=500,
            messages=[{
                "role": "user",
                "content": f"""Check this PATCO schedule page HTML.
Find the effective date of the current regular timetable.

Return JSON ONLY:
{{"effective_date": "YYYY-MM-DD", "note": "e.g. Effective 12/1/2025 PATCO Timetable"}}

If you cannot find a clear effective date, return: null

HTML:
{html[:5000]}"""
            }]
        )
        text = response.content[0].text.strip()
        if text == "null":
            return None
        return json.loads(text)
    except Exception as exc:
        logger.warning("Timetable update check failed: %s", exc)
        return None
