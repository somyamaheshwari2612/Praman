import { useEffect, useState } from "react";
import { getCases, upvoteCase, getImageForCase } from "../services/sheets";
import { getEscalationMeta, daysSince, getPublicCases, getProofStrength, getProofMeta } from "../logic/grouping";
import { getPlaceName } from "../services/geocode";

export default function PressureBoard({ onOpenCase }) {
  const [cases, setCases]       = useState([]);
  const [allCases, setAllCases] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("all");
  const [placeNames, setPlaceNames] = useState({});
  const [caseImages, setCaseImages] = useState({});
  const [votedCases, setVotedCases] = useState(() => {
    try { return JSON.parse(localStorage.getItem("praman_voted") || "{}"); } catch { return {}; }
  });

  useEffect(() => {
    getCases().then(data => {
      const arr = Array.isArray(data) ? data : [];
      setAllCases(arr);
      setCases(getPublicCases(arr));
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    cases.forEach(async (c) => {
      if (placeNames[c.case_id]) return;
      const name = await getPlaceName(c.center_lat, c.center_lng);
      setPlaceNames(prev => ({ ...prev, [c.case_id]: name }));
    });
  }, [cases]);

  useEffect(() => {
    cases.forEach(async (c) => {
      if (caseImages[c.case_id]) return;
      const url = await getImageForCase(c.category, c.center_lat, c.center_lng);
      if (url) setCaseImages(prev => ({ ...prev, [c.case_id]: url }));
    });
  }, [cases]);

  function handleFilter(f) {
    setFilter(f);
    const filtered = f === "all" ? getPublicCases(allCases) : getPublicCases(allCases).filter(c => c.category === f);
    setCases(filtered);
  }

  async function handleUpvote(e, case_id) {
    e.stopPropagation();
    if (votedCases[case_id]) return;
    await upvoteCase(case_id);
    const updated = { ...votedCases, [case_id]: true };
    setVotedCases(updated);
    localStorage.setItem("praman_voted", JSON.stringify(updated));
    const data = await getCases();
    const arr = Array.isArray(data) ? data : [];
    setAllCases(arr);
    setCases(filter === "all" ? getPublicCases(arr) : getPublicCases(arr).filter(c => c.category === filter));
  }

  const categories = [...new Set(allCases.map(c => c.category))];

  if (loading) return (
    <div style={s.loader}>
      <div style={{ fontSize: 32 }}>📋</div>
      <p style={{ color: "#aaa", marginTop: 12 }}>Loading cases...</p>
    </div>
  );

  return (
    <div style={s.page}>
      <p style={s.smallHeading}>LIVE EVIDENCE</p>
      <h1 style={s.title}>Public Pressure Board</h1>
      <p style={s.subtitle}>Sorted by urgency — issues with longest inaction appear first.</p>

      <div style={s.statsRow}>
        {[
          { label: "Active Cases",   value: allCases.length },
          { label: "Escalated",      value: allCases.filter(c => c.escalation_level >= 1).length },
          { label: "Critical (15+)", value: allCases.filter(c => parseInt(c.escalation_level) >= 3).length },
        ].map(st => (
          <div key={st.label} style={s.statPill}>
            <strong style={{ color: "#ef5b1f" }}>{st.value}</strong> {st.label}
          </div>
        ))}
      </div>

      <div style={s.filterRow}>
        {["all", ...categories].map(f => (
          <button
            key={f}
            style={{ ...s.pill, ...(filter === f ? s.pillActive : {}) }}
            onClick={() => handleFilter(f)}
          >
            {f === "all" ? "All" : f}
          </button>
        ))}
      </div>

      {cases.length === 0 ? (
        <div style={s.empty}>
          <div style={{ fontSize: 48 }}>📭</div>
          <p style={{ color: "#aaa", marginTop: 16 }}>No cases yet. Be the first to report an issue.</p>
        </div>
      ) : (
        <div style={s.grid}>
          {cases.map((c, i) => {
            const days       = daysSince(c.first_reported);
            const proofScore = getProofStrength(c);
            const proofMeta  = getProofMeta(proofScore);
            const meta       = getEscalationMeta(c.escalation_level);
            const place      = placeNames[c.case_id] || "Loading...";
            const voted      = votedCases[c.case_id];
            const imgUrl     = caseImages[c.case_id];

            return (
              <div key={c.case_id || i} style={s.card} onClick={() => onOpenCase({ ...c, resolvedImage: imgUrl })}>
                <div style={s.imgWrap}>
                  {imgUrl
                    ? <img src={imgUrl} alt={c.category} style={s.img} />
                    : <div style={s.imgPlaceholder}>📷</div>
                  }
                  <div style={s.inactionOverlay}>{days}d — no action taken</div>
                </div>

                <div style={s.cardBody}>
                  <div style={{ ...s.levelBadge, color: meta.color, borderColor: meta.color, background: meta.color + "15" }}>
                    {meta.emoji} {meta.label === "WATCHING" ? "NEW CASE" : meta.label}
                  </div>
                  <h3 style={s.cardTitle}>{c.category}</h3>
                  <p style={s.cardLocation}>📍 {place}</p>
                  <div style={s.cardRow}>
                    <span style={s.reportCount}>{c.report_count} report{c.report_count != 1 ? "s" : ""}</span>
                    <span style={s.categoryTag}>{c.category}</span>
                  </div>
                  <div style={s.proofRow}>
                    <span style={s.proofLabel}>PROOF STRENGTH</span>
                    <span style={{ ...s.proofValue, color: proofMeta.color }}>{proofMeta.label}</span>
                  </div>
                  <div style={s.barTrack}>
                    <div style={{ ...s.barFill, width: `${proofScore}%`, background: proofMeta.color }} />
                  </div>
                  <button
                    style={{ ...s.upvoteBtn, ...(voted ? s.upvoteBtnVoted : {}) }}
                    onClick={(e) => handleUpvote(e, c.case_id)}
                    disabled={voted}
                  >
                    {voted
                      ? `✅ You raised this · ${parseInt(c.upvotes || 0) + 1} voices`
                      : `👆 I have this issue · ${c.upvotes || 0} voices`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const s = {
  page:           { padding: "48px 40px", maxWidth: 1100, margin: "0 auto" },
  smallHeading:   { color: "#ef5b1f", fontSize: 11, letterSpacing: 2, fontWeight: 600, marginBottom: 8 },
  title:          { fontSize: 42, fontWeight: 800, color: "#111", margin: "8px 0" },
  subtitle:       { color: "#666", marginBottom: 28, fontSize: 15 },
  statsRow:       { display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" },
  statPill:       { background: "#fff", border: "1px solid #eee", borderRadius: 30, padding: "6px 16px", fontSize: 13, color: "#555" },
  filterRow:      { display: "flex", gap: 8, marginBottom: 32, flexWrap: "wrap" },
  pill:           { padding: "6px 16px", borderRadius: 20, border: "1px solid #ddd", background: "transparent", color: "#888", fontSize: 13, cursor: "pointer", fontFamily: "Poppins, sans-serif" },
  pillActive:     { background: "#ef5b1f", border: "1px solid #ef5b1f", color: "#fff" },
  grid:           { display: "flex", gap: 24, flexWrap: "wrap" },
  card:           { width: "calc(33.333% - 16px)", minWidth: 280, background: "#fff", border: "1px solid #eee", borderRadius: 16, overflow: "hidden", cursor: "pointer" },
  imgWrap:        { position: "relative", height: 200, overflow: "hidden" },
  img:            { width: "100%", height: "100%", objectFit: "cover" },
  imgPlaceholder: { width: "100%", height: "100%", background: "#f0ece9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 },
  inactionOverlay:{ position: "absolute", bottom: 12, left: 12, background: "rgba(0,0,0,0.7)", color: "#fff", padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600 },
  cardBody:       { padding: "16px" },
  levelBadge:     { display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, border: "1px solid", marginBottom: 10 },
  cardTitle:      { fontSize: 18, fontWeight: 700, color: "#111", marginBottom: 6 },
  cardLocation:   { fontSize: 12, color: "#999", marginBottom: 12 },
  cardRow:        { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  reportCount:    { fontSize: 13, fontWeight: 600, color: "#333" },
  categoryTag:    { fontSize: 11, background: "#f7f4f2", border: "1px solid #eee", padding: "3px 10px", borderRadius: 20, color: "#888" },
  proofRow:       { display: "flex", justifyContent: "space-between", marginBottom: 6 },
  proofLabel:     { fontSize: 10, letterSpacing: 1, color: "#bbb", fontWeight: 600 },
  proofValue:     { fontSize: 11, fontWeight: 700 },
  barTrack:       { height: 4, background: "#f0ece9", borderRadius: 2, overflow: "hidden", marginBottom: 12 },
  barFill:        { height: "100%", borderRadius: 2, transition: "width 0.4s" },
  upvoteBtn:      { width: "100%", padding: "9px", background: "#fff8f5", border: "1px solid #ef5b1f", borderRadius: 8, color: "#ef5b1f", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Poppins, sans-serif" },
  upvoteBtnVoted: { background: "#f0faf0", border: "1px solid #4ade80", color: "#16a34a", cursor: "default" },
  loader:         { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh" },
  empty:          { textAlign: "center", padding: "80px 32px" },
};