"use client";

import { useState, useEffect, useMemo } from "react";

// ── Constants ──────────────────────────────────────────────────────────────────

const STATIONS = [
  "Lindenwold","Ashland","Woodcrest","Haddonfield","Westmont",
  "Collingswood","Ferry Ave","Broadway","City Hall",
  "Franklin Square","8th & Market","9/10th & Locust",
  "12/13th & Locust","15/16th & Locust",
];
const PHILLY = new Set([
  "Franklin Square","8th & Market","9/10th & Locust",
  "12/13th & Locust","15/16th & Locust",
]);

// Update when PATCO announces special service days
const SPECIAL: Record<string, { note: string; pdf: string }> = {};

// ── Types ──────────────────────────────────────────────────────────────────────

interface Stop  { station: string; time: string; }
interface Trip  {
  direction:    "NJ_TO_PHILLY" | "PHILLY_TO_NJ";
  service_type: "weekday" | "saturday" | "sunday";
  stops: Stop[];
}
interface RawRow { dep: number; arr: number | null; }
type StoredResult =
  | { type: "noservice" }
  | { type: "lastrain"; lastDep: number }
  | { type: "trains";   rawRows: RawRow[]; hasDest: boolean };

interface TrainRow extends RawRow {
  isPast: boolean; isNext: boolean; isSoon: boolean; diff: number;
}
interface CalInfo {
  d: number; dt: string;
  past?: boolean; today?: boolean; grey?: boolean; special?: boolean;
}
type Dir = "wb" | "eb";

// ── Helpers ────────────────────────────────────────────────────────────────────

const pad   = (n: number) => String(n).padStart(2, "0");
const fmt12 = (m: number) => {
  const h = Math.floor(m / 60) % 24, mn = m % 60, p = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${pad(mn)} ${p}`;
};
const toMins   = (t: string) => { const [h, m] = t.split(":").map(Number); return h*60+m; };
const nowMins  = () => { const d = new Date(); return d.getHours()*60+d.getMinutes(); };
const addDays  = (d: Date, n: number) => { const r = new Date(d); r.setDate(d.getDate()+n); return r; };
const fmtDate  = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;

const getServiceType = (dt: string): Trip["service_type"] => {
  const day = new Date(dt + "T12:00:00").getDay();
  return day === 0 ? "sunday" : day === 6 ? "saturday" : "weekday";
};

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

const dayLabel = (dt: string, today: string) => {
  const d = new Date(dt + "T12:00:00");
  const prefix = dt === today ? "Today · " : "";
  return `${prefix}${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
};

function buildCalendar(today: Date): CalInfo[] {
  const todayStr = fmtDate(today);
  const end       = addDays(today, 14);
  const confirmed = addDays(today, 7);   // dates beyond this show as greyed
  // start from Monday of current week
  const dow = today.getDay();
  const start = addDays(today, -(dow === 0 ? 6 : dow - 1));
  const days: CalInfo[] = [];
  for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
    const dt = fmtDate(d);
    days.push({
      d: d.getDate(), dt,
      past:    dt < todayStr,
      today:   dt === todayStr,
      grey:    d > confirmed && dt !== todayStr,
      special: !!SPECIAL[dt],
    });
  }
  return days;
}

function buildResults(
  trips: Trip[], date: string, dir: Dir, from: string, to: string,
): StoredResult {
  const direction = dir === "wb" ? "NJ_TO_PHILLY" : "PHILLY_TO_NJ";
  const svcType   = getServiceType(date);

  const rawRows: RawRow[] = trips
    .filter(t => t.service_type === svcType && t.direction === direction)
    .flatMap(t => {
      const fs = t.stops.find(s => s.station === from);
      if (!fs) return [];
      const dep = toMins(fs.time);
      if (to) {
        const ts = t.stops.find(s => s.station === to);
        if (!ts) return [];
        const arr = toMins(ts.time);
        if (arr <= dep) return [];
        return [{ dep, arr }] as RawRow[];
      }
      return [{ dep, arr: null }] as RawRow[];
    })
    .sort((a, b) => a.dep - b.dep);

  return { type: "trains", rawRows, hasDest: !!to };
}

// ── CalDay ─────────────────────────────────────────────────────────────────────

function CalDay({ info, selected, onClick }: { info: CalInfo; selected: string; onClick: () => void }) {
  const base: React.CSSProperties = {
    textAlign:"center", padding:"8px 4px", borderRadius:6,
    fontSize:13, position:"relative", userSelect:"none",
  };
  if (info.past)
    return <div style={{ ...base, opacity:.25, color:"#888" }}>{info.d}</div>;
  if (info.grey)
    return <div style={{ ...base, opacity:.3, color:"#888", cursor:"default" }} title="Not yet confirmed by PATCO">{info.d}</div>;

  const sel = selected === info.dt;
  return (
    <div onClick={onClick} style={{
      ...base, cursor:"pointer",
      background:   sel ? "#E6F1FB" : "transparent",
      color:        sel ? "#0C447C" : info.today ? "#000" : "#333",
      fontWeight:   info.today ? 600 : 400,
      border:       sel ? "1.5px solid #378ADD" : info.today ? "2px solid #333" : "1px solid transparent",
    }}>
      {info.d}
      {info.special && (
        <span style={{
          position:"absolute", bottom:2, left:"50%", transform:"translateX(-50%)",
          width:5, height:5, borderRadius:"50%",
          background: sel ? "#fff" : "#BA7517", display:"block",
        }} />
      )}
    </div>
  );
}

// ── TripPlanner ────────────────────────────────────────────────────────────────

interface Props {
  trips:         Trip[];
  generatedAt:   string;
  today:         string;  // YYYY-MM-DD from server
}

export default function TripPlanner({ trips, generatedAt, today }: Props) {
  const [date,       setDate]       = useState(today);
  const [from,       setFrom]       = useState("");
  const [to,         setTo]         = useState("");
  const [dir,        setDir]        = useState<Dir>("wb");
  const [showTo,     setShowTo]     = useState(false);
  const [results,    setResults]    = useState<StoredResult | null>(null);
  const [tick,       setTick]       = useState(0);
  const [warnPhilly, setWarnPhilly] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setTick(n => n + 1), 30000);
    return () => clearInterval(id);
  }, []);

  // ── Derived state (re-evaluated on every tick for live countdowns) ──────────
  const isToday = date === today;
  const cur     = isToday ? nowMins() + tick * 0 : 0;

  const displayRows = useMemo((): TrainRow[] => {
    if (results?.type !== "trains") return [];
    let foundNext = false;
    return results.rawRows.map(r => {
      const isPast = isToday && r.dep < cur - 1;
      const isNext = isToday && !foundNext && r.dep >= cur;
      const isSoon = isToday && !isNext && r.dep >= cur && r.dep < cur + 20;
      if (isNext) foundNext = true;
      return { ...r, isPast, isNext, isSoon, diff: isToday && !isPast ? r.dep - cur : -1 };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, cur, isToday]);

  // Detect "last train passed" dynamically on each tick
  const effectiveType = useMemo((): StoredResult["type"] | null => {
    if (!results) return null;
    if (results.type !== "trains") return results.type;
    if (!isToday) return "trains";
    if (results.rawRows.length === 0) return "trains";
    const allPast = results.rawRows.every(r => r.dep < cur - 1);
    return allPast ? "lastrain" : "trains";
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, cur, isToday]);

  const lastDep = results?.type === "trains" && results.rawRows.length
    ? results.rawRows[results.rawRows.length - 1].dep : 0;

  // ── Calendar ────────────────────────────────────────────────────────────────
  const cal = useMemo(() => buildCalendar(new Date(today + "T12:00:00")), [today]);
  const calMonth = useMemo(() => {
    const d = new Date(today + "T12:00:00");
    return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }, [today]);

  // ── Destination stations (downstream of From in chosen direction) ───────────
  const toStations = useMemo(() => {
    const sts = dir === "wb" ? STATIONS : [...STATIONS].reverse();
    const fi  = sts.indexOf(from);
    return sts.filter((_, i) => i > fi);
  }, [from, dir]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const onFrom = (val: string) => {
    const isPhilly = PHILLY.has(val);
    const newDir: Dir = isPhilly ? "eb" : "wb";
    setFrom(val); setTo(""); setShowTo(false); setResults(null);
    setDir(newDir); setWarnPhilly(isPhilly);
  };

  const onDir = (val: Dir) => {
    setDir(val); setTo(""); setWarnPhilly(false); setResults(null);
  };

  const doSearch = () => {
    if (!from) return;
    if (isToday && cur < 270) { setResults({ type: "noservice" }); return; }
    setResults(buildResults(trips, date, dir, from, to));
  };

  const rideNow = () => {
    const f = from || STATIONS[0];
    const newDir: Dir = PHILLY.has(f) ? "eb" : "wb";
    setDate(today); setFrom(f); setDir(newDir);
    setTo(""); setShowTo(false); setWarnPhilly(PHILLY.has(f));
    const nowCur = nowMins();
    if (nowCur < 270) { setResults({ type: "noservice" }); return; }
    setResults(buildResults(trips, today, newDir, f, ""));
  };

  const clearAll = () => {
    setDate(today); setFrom(""); setTo(""); setDir("wb");
    setShowTo(false); setResults(null); setWarnPhilly(false);
  };

  // ── Last-updated label ──────────────────────────────────────────────────────
  const lastUpdated = useMemo(() => {
    if (!generatedAt) return "";
    const d  = new Date(generatedAt);
    const h  = d.getHours(), mn = pad(d.getMinutes()), p = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${mn} ${p}`;
  }, [generatedAt]);

  const sp         = SPECIAL[date];
  const destLabel  = dir === "wb" ? "Westbound → 15/16th & Locust" : "Eastbound → Lindenwold";

  // ── Shared style tokens ─────────────────────────────────────────────────────
  const card:       React.CSSProperties = { background:"#fff", border:"0.5px solid #e0e0e0", borderRadius:12, padding:16, marginBottom:12 };
  const btnPrimary: React.CSSProperties = { flex:1, padding:"11px", fontSize:14, fontWeight:500, cursor:"pointer", borderRadius:8, background:"#E6F1FB", border:"1px solid #378ADD", color:"#0C447C", display:"flex", alignItems:"center", justifyContent:"center", gap:7 };
  const btnClear:   React.CSSProperties = { padding:"11px 18px", fontSize:14, cursor:"pointer", borderRadius:8, color:"#888", background:"transparent", border:"0.5px solid #ddd" };
  const pill:       React.CSSProperties = { display:"inline-flex", alignItems:"center", gap:5, padding:"4px 12px", borderRadius:8, fontSize:13, fontWeight:500, background:"#E6F1FB", color:"#0C447C", border:"0.5px solid #378ADD" };
  const linkBtn:    React.CSSProperties = { background:"none", border:"none", cursor:"pointer", fontSize:12, color:"#888", padding:0, display:"inline-flex", alignItems:"center", gap:4, textDecoration:"underline", textDecorationStyle:"dotted" };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily:"system-ui,sans-serif", maxWidth:640, margin:"0 auto", padding:"0 0 40px" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingBottom:14, marginBottom:16, borderBottom:"0.5px solid #e8e8e8" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:20 }}>🚇</span>
          <div>
            <div style={{ fontSize:15, fontWeight:500 }}>PATCO Speedline</div>
            <div style={{ fontSize:11, color:"#888" }}>
              Unofficial viewer · <a href="https://ridepatco.org" style={{ color:"#378ADD" }}>ridepatco.org</a>
            </div>
          </div>
        </div>
        {lastUpdated && (
          <div style={{ fontSize:11, color:"#888" }}>🕐 Last updated {lastUpdated}</div>
        )}
      </div>

      {/* Ride Now */}
      <button onClick={rideNow} style={{ width:"100%", padding:13, fontSize:15, fontWeight:500, marginBottom:20, background:"#EAF3DE", border:"1px solid #3B6D11", color:"#27500A", borderRadius:12, cursor:"pointer" }}>
        ▶ Ride now
      </button>

      {/* Calendar */}
      <div style={{ marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
          <div style={{ fontSize:13, fontWeight:500, color:"#666" }}>📅 {calMonth}</div>
          <div style={{ display:"flex", gap:12, fontSize:11, color:"#888" }}>
            <span>
              <span style={{ display:"inline-block", width:6, height:6, borderRadius:"50%", background:"#BA7517", verticalAlign:"middle", marginRight:3 }} />
              Special
            </span>
            <span style={{ opacity:.5 }}>Greyed = not yet confirmed</span>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3, marginBottom:3 }}>
          {["Mo","Tu","We","Th","Fr","Sa","Su"].map(d => (
            <div key={d} style={{ textAlign:"center", fontSize:11, color:"#999", padding:3 }}>{d}</div>
          ))}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3 }}>
          {cal.map(info => (
            <CalDay key={info.dt} info={info} selected={date}
              onClick={() => { if (!info.past && !info.grey) { setDate(info.dt); setResults(null); }}} />
          ))}
        </div>
      </div>

      <div style={{ fontSize:12, color:"#888", marginBottom:14, minHeight:16 }}>
        {dayLabel(date, today)}
      </div>

      {/* Search card */}
      <div style={card}>
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:10, color:"#999", letterSpacing:1, textTransform:"uppercase", marginBottom:5 }}>From</div>
          <select value={from} onChange={e => onFrom(e.target.value)} style={{ width:"100%" }}>
            <option value="">Select departure station</option>
            {STATIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {from && (
          <>
            <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:10 }}>
              <span style={pill}>→ {destLabel}</span>
              <select value={dir} onChange={e => onDir(e.target.value as Dir)} style={{ fontSize:12, padding:"4px 8px" }}>
                <option value="wb">Westbound → 15/16th & Locust</option>
                <option value="eb">Eastbound → Lindenwold</option>
              </select>
            </div>

            {warnPhilly && (
              <div style={{ background:"#FAEEDA", border:"0.5px solid #EF9F27", borderRadius:8, padding:"8px 12px", marginBottom:10, fontSize:12, color:"#633806", display:"flex", alignItems:"center", gap:7 }}>
                ⚠ Starting from Philadelphia — defaulted to{" "}
                <strong style={{ marginLeft:3 }}>Eastbound → Lindenwold</strong>. Change above if needed.
              </div>
            )}

            {!showTo ? (
              <button onClick={() => setShowTo(true)} style={linkBtn}>
                + Add specific destination
              </button>
            ) : (
              <div style={{ marginTop:12 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:5 }}>
                  <div style={{ fontSize:10, color:"#999", letterSpacing:1, textTransform:"uppercase" }}>
                    To <span style={{ opacity:.6, fontWeight:400 }}>(optional)</span>
                  </div>
                  <button onClick={() => { setShowTo(false); setTo(""); }} style={linkBtn}>✕ Remove</button>
                </div>
                <select value={to} onChange={e => setTo(e.target.value)} style={{ width:"100%" }}>
                  <option value="">Any destination</option>
                  {toStations.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
          </>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display:"flex", gap:8, marginBottom:18 }}>
        <button onClick={doSearch} style={btnPrimary}>🔍 Find trains</button>
        <button onClick={clearAll} style={btnClear}>✕ Clear</button>
      </div>

      {/* Special schedule banner */}
      {results && sp && (
        <div style={{ background:"#FAEEDA", border:"0.5px solid #EF9F27", borderRadius:8, padding:"10px 14px", marginBottom:12, fontSize:13, display:"flex", alignItems:"flex-start", gap:8 }}>
          <span style={{ flexShrink:0, marginTop:1 }}>ℹ️</span>
          <div>
            <span style={{ fontWeight:500, color:"#633806" }}>Special schedule in effect</span>
            <span style={{ color:"#854F0B" }}> · {sp.note}</span>
            <a href={sp.pdf} style={{ color:"#378ADD", marginLeft:8, fontSize:12 }}>View PDF ↗</a>
          </div>
        </div>
      )}

      {/* No overnight service */}
      {effectiveType === "noservice" && (
        <div style={{ background:"#f5f5f5", border:"0.5px solid #ddd", borderRadius:8, padding:16, textAlign:"center" }}>
          <div style={{ fontWeight:500, marginBottom:4 }}>No service · Overnight maintenance</div>
          <div style={{ fontSize:13, color:"#888" }}>12:00 AM – 4:30 AM · Next train at <strong>4:30 AM</strong></div>
        </div>
      )}

      {/* Last train */}
      {effectiveType === "lastrain" && (
        <div style={{ background:"#f5f5f5", border:"0.5px solid #ddd", borderRadius:8, padding:16, textAlign:"center" }}>
          <div style={{ fontWeight:500, marginBottom:4 }}>🌙 Last train today has departed</div>
          <div style={{ fontSize:13, color:"#888" }}>
            Last at <span style={{ fontFamily:"monospace", color:"#333" }}>{fmt12(lastDep)}</span> · Service resumes <strong>4:30 AM tomorrow</strong>
          </div>
        </div>
      )}

      {/* Train list */}
      {effectiveType === "trains" && results?.type === "trains" && (
        <div>
          <div style={{ fontSize:10, color:"#999", letterSpacing:1, textTransform:"uppercase", marginBottom:8, display:"flex", justifyContent:"space-between" }}>
            <span>Departures</span>
            <span style={{ fontSize:11, letterSpacing:0, fontWeight:400 }}>{displayRows.length} trains</span>
          </div>

          {displayRows.length === 0 ? (
            <div style={{ padding:16, textAlign:"center", color:"#aaa", fontSize:13 }}>
              No trains found for this selection.
            </div>
          ) : (
            <div style={{ border:"0.5px solid #e8e8e8", borderRadius:12, overflow:"hidden" }}>
              {displayRows.map((r, i) => {
                const bg  = r.isNext ? "#EAF3DE" : i % 2 === 0 ? "#fafafa" : "#fff";
                const lc  = r.isNext ? "#3B6D11" : r.isSoon ? "#BA7517" : "transparent";
                const tc  = r.isNext ? "#27500A" : r.isSoon ? "#633806" : r.isPast ? "#bbb" : "#222";
                const cnt = r.isPast ? "passed" : r.diff === 0 ? "now" : r.diff > 0 ? `${r.diff}m` : "";
                const hasDest = results.hasDest && r.arr !== null;
                return (
                  <div key={i} style={{
                    display:"grid",
                    gridTemplateColumns: hasDest ? "1fr auto 1fr 56px" : "1fr 56px",
                    alignItems:"center", gap:8,
                    padding:"10px 16px",
                    borderBottom: i < displayRows.length - 1 ? "0.5px solid #eee" : "none",
                    borderLeft:`3px solid ${lc}`,
                    background:bg,
                    opacity: r.isPast ? .3 : 1,
                  }}>
                    <div style={{ fontFamily:"monospace", fontSize:14, fontWeight: r.isNext||r.isSoon ? 500 : 400, color:tc }}>
                      {fmt12(r.dep)}
                    </div>
                    {hasDest && (
                      <>
                        <span style={{ color:"#bbb", fontSize:12 }}>→</span>
                        <div style={{ fontFamily:"monospace", fontSize:14, color:"#888" }}>{fmt12(r.arr!)}</div>
                      </>
                    )}
                    <div style={{ fontSize:11, textAlign:"right", fontFamily:"monospace", color: r.isNext ? "#27500A" : r.isSoon ? "#633806" : "#aaa" }}>
                      {cnt}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!results && (
        <div style={{ textAlign:"center", padding:"32px 20px", color:"#aaa" }}>
          <div style={{ fontSize:28, marginBottom:8, opacity:.4 }}>📍</div>
          <div style={{ fontSize:14 }}>Select a date and departure station, then tap Find trains</div>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop:24, paddingTop:14, borderTop:"0.5px solid #eee", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
        <div style={{ fontSize:11, color:"#aaa" }}>
          Unofficial · Not affiliated with PATCO · <a href="https://ridepatco.org" style={{ color:"#378ADD" }}>ridepatco.org</a>
        </div>
        <a href="mailto:ckp636@gmail.com?subject=PATCO Schedule Issue" style={{ fontSize:11, color:"#aaa", textDecoration:"none", display:"flex", alignItems:"center", gap:4 }}>
          ✉ Report an issue
        </a>
      </div>

    </div>
  );
}
