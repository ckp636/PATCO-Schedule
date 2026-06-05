"""Parses PATCO schedule PDF into structured data using pdfplumber.

Real PDF quirks:
- Station header cells have character-mirrored text per word: 'DLOWNEDNIL' == 'LINDENWOLD'[::-1]
- Page 1 footer contains "HOLIDAY & SPECIAL SCHEDULES" — must check 'monday'/'friday'
  BEFORE 'holiday' so the weekday page is not misclassified as sunday.
- Page 2 has both Saturday (tables 1–2) and Sunday (tables 3–4) — service type must be
  inferred per-table using the label word found within 60px above the table bbox.

Weekday vs. weekend table layout differ significantly:
  Weekend (page 2, 14 cols): each cell = exactly 2 departures separated by '\n'.
  Weekday (page 1, 10 cols): pdfplumber misaligns column boundaries for the first ~5
    columns; times for consecutive stations bleed across cell edges.
    Fix: concatenate all cells per slot row WITHOUT a separator, then regex-find all
    complete times; map to the 14 canonical stations in direction order.
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass, field
from pathlib import Path

import pdfplumber

logger = logging.getLogger(__name__)

# Weekend: needs word boundary so '4:30AM' isn't matched mid-word.
TIME_RE = re.compile(r'\b(\d{1,2}:\d{2})\s*([AaPp])\b')

# Weekday concatenated rows: no \b — times are jammed together like '4:30A4:32A'.
_CONCAT_TIME_RE = re.compile(r'(\d{1,2}:\d{2})([AaPp])')

# Station order for weekday canonical mapping (direction determines which end is first).
_CANONICAL_STATIONS: dict[str, list[str]] = {
    'NJ_TO_PHILLY': [
        'Lindenwold', 'Ashland', 'Woodcrest', 'Haddonfield', 'Westmont',
        'Collingswood', 'Ferry Ave', 'Broadway', 'City Hall',
        'Franklin Square', '8th & Market', '9/10th & Locust',
        '12/13th & Locust', '15/16th & Locust',
    ],
    'PHILLY_TO_NJ': [
        '15/16th & Locust', '12/13th & Locust', '9/10th & Locust',
        '8th & Market', 'Franklin Square', 'City Hall', 'Broadway',
        'Ferry Ave', 'Collingswood', 'Westmont', 'Haddonfield',
        'Woodcrest', 'Ashland', 'Lindenwold',
    ],
}

# Ordered: first match wins. Patterns run against the fully decoded cell text.
_STATION_PATTERNS: list[tuple[re.Pattern, str]] = [
    (re.compile(r'LINDENWOLD',  re.I), 'Lindenwold'),
    (re.compile(r'ASHLAND',     re.I), 'Ashland'),
    (re.compile(r'WOODCREST',   re.I), 'Woodcrest'),
    (re.compile(r'HADDONFIELD', re.I), 'Haddonfield'),
    (re.compile(r'WESTMONT',    re.I), 'Westmont'),
    (re.compile(r'COLLINGSWOOD',re.I), 'Collingswood'),
    (re.compile(r'FERRY',       re.I), 'Ferry Ave'),
    (re.compile(r'BROADWAY',    re.I), 'Broadway'),
    (re.compile(r'HALL',        re.I), 'City Hall'),
    (re.compile(r'FRANKLIN|SQUARE', re.I), 'Franklin Square'),
    (re.compile(r'MARKET',      re.I), '8th & Market'),
    (re.compile(r'9/10',        re.I), '9/10th & Locust'),
    (re.compile(r'12/13',       re.I), '12/13th & Locust'),
    (re.compile(r'15/16',       re.I), '15/16th & Locust'),
]


@dataclass
class Trip:
    direction: str       # "NJ_TO_PHILLY" | "PHILLY_TO_NJ"
    service_type: str    # "weekday" | "saturday" | "sunday"
    stops: list[dict]    # [{"station": str, "time": str}]


@dataclass
class Schedule:
    effective_date: str
    trips: list[Trip] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _decode_station(raw: str) -> str:
    """Decode a mirrored-text station header cell to a canonical stop name."""
    if not raw:
        return ''
    words = raw.replace('\n', ' ').split()
    decoded = ' '.join(w[::-1] for w in words)
    for pattern, name in _STATION_PATTERNS:
        if pattern.search(decoded):
            return name
    return decoded.title()


def _normalize_time(cell: str) -> str | None:
    """'12:00A' / '5:30P' → 24-hour 'HH:MM'. Returns None if no match."""
    m = TIME_RE.search(cell)
    if not m:
        return None
    hhmm, meridiem = m.group(1), m.group(2).upper()
    h, mn = map(int, hhmm.split(':'))
    if meridiem == 'A':
        h = 0 if h == 12 else h
    else:
        h = 12 if h == 12 else h + 12
    return f'{h:02d}:{mn:02d}'


def _norm_concat_time(raw: str) -> str:
    """Normalize a bare '4:30A' token (no spaces) to '04:30'."""
    hhmm, meridiem = raw[:-1], raw[-1].upper()
    h, mn = map(int, hhmm.split(':'))
    if meridiem == 'A':
        h = 0 if h == 12 else h
    else:
        h = 12 if h == 12 else h + 12
    return f'{h:02d}:{mn:02d}'


def _detect_service_type(text: str) -> str:
    low = text.lower()
    # Must check weekday markers FIRST — page 1 footer has "HOLIDAY & SPECIAL SCHEDULES"
    # which would otherwise trigger the sunday branch for the weekday page.
    if 'monday' in low or 'friday' in low:
        return 'weekday'
    if 'saturday' in low:
        return 'saturday'
    if 'sunday' in low or 'holiday' in low:
        return 'sunday'
    return 'weekday'


def _service_from_nearby_words(words: list[str]) -> str | None:
    """Infer service type from label words found directly above a table."""
    joined = ' '.join(words).lower()
    if 'monday' in joined or 'friday' in joined:
        return 'weekday'
    if 'saturday' in joined:
        return 'saturday'
    if 'sunday' in joined or 'holiday' in joined:
        return 'sunday'
    return None


def _detect_direction(header_cell: str) -> str:
    up = (header_cell or '').upper()
    if 'WESTBOUND' in up:
        return 'NJ_TO_PHILLY'
    if 'EASTBOUND' in up:
        return 'PHILLY_TO_NJ'
    return 'UNKNOWN'


# ---------------------------------------------------------------------------
# Table parsers
# ---------------------------------------------------------------------------

def _parse_weekend_table(table: list[list[str | None]], service_type: str) -> list[Trip]:
    """
    Weekend layout (page 2, 14 cols):
      row 0  — direction header
      row 1  — station names (one per column, mirrored text)
      row 2+ — time data; each cell has 2 trips separated by '\n'
    """
    if not table or len(table) < 3:
        return []

    direction = _detect_direction(str(table[0][0] or ''))

    stations: list[tuple[int, str]] = []
    for col_idx, cell in enumerate(table[1]):
        if cell:
            name = _decode_station(str(cell))
            if name:
                stations.append((col_idx, name))

    if len(stations) < 2:
        return []

    trips: list[Trip] = []
    for row in table[2:]:
        for slot in (0, 1):
            stops: list[dict] = []
            for col_idx, station in stations:
                cell = str(row[col_idx] or '').strip()
                parts = cell.split('\n')
                raw = parts[slot] if slot < len(parts) else ''
                t = _normalize_time(raw)
                if t:
                    stops.append({'station': station, 'time': t})
            if len(stops) >= 2:
                trips.append(Trip(direction=direction, service_type=service_type, stops=stops))

    return trips


def _parse_weekday_table(table: list[list[str | None]], service_type: str) -> list[Trip]:
    """
    Weekday layout (page 1):
      Same row 0/1 structure, but pdfplumber splits time values across column
      boundaries for the first several columns.  Fix: concatenate all cell text
      for each slot (no separator) so split tokens rejoin, then regex-scan for
      complete times and map them to the 14 canonical stations.
    """
    if not table or len(table) < 3:
        return []

    direction = _detect_direction(str(table[0][0] or ''))
    stations = _CANONICAL_STATIONS.get(direction, [])
    if not stations:
        return []

    trips: list[Trip] = []
    for row in table[2:]:
        for slot in (0, 1):
            # Concatenate WITHOUT separator so '4:3' + '2A' → '4:32A'
            concat = ''.join(
                (str(cell or '').split('\n') + [''])[slot]
                for cell in row
            )
            raw_times = _CONCAT_TIME_RE.findall(concat)   # [('4:30', 'A'), ...]
            normalized = [_norm_concat_time(h + m) for h, m in raw_times]

            n = len(normalized)
            if n == len(stations):
                used_stations = stations
            elif n == len(stations) - 1 and direction == 'PHILLY_TO_NJ':
                # Eastbound weekday timetable omits 15/16th & Locust (first station)
                used_stations = stations[1:]
            else:
                continue   # mileage row, text row, or partial — skip

            stops = [{'station': s, 'time': t}
                     for s, t in zip(used_stations, normalized)]
            trips.append(Trip(direction=direction, service_type=service_type, stops=stops))

    return trips


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def parse_pdf(pdf_path: Path) -> Schedule:
    schedule = Schedule(effective_date='unknown')
    all_trips: list[Trip] = []

    with pdfplumber.open(str(pdf_path)) as pdf:
        for page_num, page in enumerate(pdf.pages):
            text = page.extract_text() or ''

            if page_num == 0:
                # Date is stored mirrored: '5202/1/21' → '12/1/2025'
                date_m = re.search(r'(\d{4}/\d{1,2}/\d{1,2})', text)
                if date_m:
                    raw = date_m.group(1)
                    y_rev, m, d = raw.split('/')
                    schedule.effective_date = f'{m}/{d}/{y_rev[::-1]}'

            page_service = _detect_service_type(text)
            page_words = page.extract_words()
            table_objects = page.find_tables()
            table_data_list = page.extract_tables()

            for tobj, tdata in zip(table_objects, table_data_list):
                table_top = tobj.bbox[1]
                nearby = [w['text'] for w in page_words
                          if table_top - 60 < w['top'] < table_top]
                service_type = _service_from_nearby_words(nearby) or page_service

                if service_type == 'weekday':
                    trips = _parse_weekday_table(tdata, service_type)
                else:
                    trips = _parse_weekend_table(tdata, service_type)

                all_trips.extend(trips)

    schedule.trips = all_trips
    logger.info('Parsed %d trips (effective: %s)', len(all_trips), schedule.effective_date)
    return schedule
