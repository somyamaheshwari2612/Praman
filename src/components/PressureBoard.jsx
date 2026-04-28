import { useEffect, useState } from "react";
import { getCases, upvoteCase } from "../services/sheets";
import {
  getEscalationMeta,
  daysSince,
  getPublicCases,
  getThresholdProgress,
  getProofStrength,
  getProofMeta
} from "../logic/grouping";
import { getPlaceName } from "../services/geocode";

export default function PressureBoard() {
  const [cases, setCases]       = useState([]);
  const [allCases, setAllCases] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("all");
  const [placeNames, setPlaceNames] = useState({});
  const [upvoting, setUpvoting] = useState({});
  const [votedCases, setVotedCases] = useState(() => {
    const stored = localStorage.getItem("praman_voted");
    return stored ? JSON.parse(stored) : {};
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
    if (cases.length === 0) return;
    cases.forEach(async (c) => {
      if (placeNames[c.case_id]) return;
      const name = await getPlaceName(c.center_lat, c.center_lng);
      setPlaceNames(prev => ({ ...prev, [c.case_id]: name }));
    });
  }, [cases]);

  async function handleUpvote(case_id) {
    if (votedCases[case_id]) return;
    setUpvoting(prev => ({ ...prev, [case_id]: true }));
    await upvoteCase(case_id);
    const updated = { ...votedCases, [case_id]: true };
    setVotedCases(updated);
    localStorage.setItem("praman_voted", JSON.stringify(updated));
    setUpvoting(prev => ({ ...prev, [case_id]: false }));
    const data = await getCases();
    const arr = Array.isArray(data) ? data : [];
    setAllCases(arr);
    setCases(filter === "all" ? getPublicCases(arr) : getPublicCases(arr).filter(c => c.category === filter));
  }

  function handleFilter(f) {
    setFilter(f);
    if (f === "all") setCases(getPublicCases(allCases));
    else setCases(getPublicCases(allCases).filter(c => c.category === f));
  }

  const categories = [...new Set(allCases.map(c => c.category))];

  if (loading) return (
    <div style={styles.loader}>
      <div style={{ fontSize: 36 }}>📋</div>
      <p style={{ color: "#aaa", marginTop: 12 }}>Loading pressure board...</p>
    </div>
  );

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <h2 style={styles.title}>🔥 Public Pressure Board</h2>
        <p style={styles.subtitle}>All cases · Ranked by urgency</p>
      </div>

      <div style={styles.statsBar}>
        {[
          { label: "Total Cases", value: allCases.length, color: "#a78bfa" },
          { label: "Escalated",   value: allCases.filter(c => c.escalation_level >= 1).length, color: "#f59e0b" },
          { label: "Critical",    value: allCases.filter(c => parseInt(c.escalation_level) >= 3).length, color: "#ff2d2d" },
        ].map(s => (
          <div key={s.label} style={styles.statCard}>
            <div style={{ ...styles.statValue, color: s.color }}>{s.value}</div>
            <div style={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={styles.filterRow}>
        <button
          style={{ ...styles.pill, ...(filter === "all" ? styles.pillActive : {}) }}
          onClick={() => handleFilter("all")}
        >All</button>
        {categories.map(cat => (
          <button
            key={cat}
            style={{ ...styles.pill, ...(filter === cat ? styles.pillActive : {}) }}
            onClick={() => handleFilter(cat)}
          >{cat}</button>
        ))}
      </div>

      {cases.length === 0 ? (
        <div style={styles.empty}>
          <div style={{ fontSize: 48 }}>📭</div>
          <p style={{ color: "#555", marginTop: 12 }}>No cases yet.</p>
        </div>
      ) : (
        <div style={styles.list}>
          {cases.map((c, i) => {
            const meta = getEscalationMeta(c.escalation_level);
            const days = daysSince(c.first_reported);
            const { progress, next, current } = getThresholdProgress(c.report_count);
            const proofScore = getProofStrength(c);
            const proofMeta  = getProofMeta(proofScore);

            return (
              <div key={c.case_id || i} style={styles.card}>

                <div style={styles.cardTop}>
                  <span style={styles.rank}>#{i + 1}</span>
                  <span style={{ ...styles.badge, background: meta.color + "22", color: meta.color, border: `1px solid ${meta.color}` }}>
                    {meta.emoji} {meta.label}
                  </span>
                  {days >= 3 && (
                    <span style={styles.inactionBadge}>⚠️ {days}d ignored</span>
                  )}
                </div>

                <div style={styles.cardTitle}>{c.category}</div>

                <div style={styles.cardMeta}>
                  📍 {placeNames[c.case_id] || `${parseFloat(c.center_lat).toFixed(4)}, ${parseFloat(c.center_lng).toFixed(4)}`}
                  &nbsp;·&nbsp;
                  🕐 {days === 0 ? "Today" : `${days} day${days !== 1 ? "s" : ""} ago`}
                </div>

                <div style={styles.countRow}>
                  <span style={styles.countBig}>{c.report_count}</span>
                  <span style={styles.countLabel}>&nbsp;citizen report{c.report_count != 1 ? "s" : ""}</span>
                </div>

                <div style={styles.progressLabel}>
                  {current >= 15
                    ? "⚡ Maximum escalation reached"
                    : `${next - current} more to next escalation (${next} reports)`}
                </div>
                <div style={styles.progressTrack}>
                  <div style={{ ...styles.progressFill, width: `${Math.max(progress, 4)}%`, background: meta.color }} />
                </div>

                <div style={styles.proofRow}>
                  <span style={styles.proofLabel}>Proof Strength</span>
                  <div style={styles.proofTrack}>
                    <div style={{ ...styles.proofFill, width: `${proofScore}%`, background: proofMeta.color }} />
                  </div>
                  <span style={{ ...styles.proofBadge, color: proofMeta.color }}>
                    {proofMeta.label} ({proofScore}/100)
                  </span>
                </div>

                {/* Upvote button */}
                <button
                  style={{ ...styles.upvoteBtn, ...(votedCases[c.case_id] ? styles.upvoteBtnVoted : {}) }}
                  onClick={() => handleUpvote(c.case_id)}
                  disabled={votedCases[c.case_id] || upvoting[c.case_id]}
                >
                  {upvoting[c.case_id]
                    ? "⏳ Registering..."
                    : votedCases[c.case_id]
                    ? `✅ You raised this · ${parseInt(c.upvotes || 0) + 1} voices`
                    : `👆 I have this issue too · ${c.upvotes || 0} voices`}
                </button>

                {days >= 7 && (
                  <div style={styles.inactionWarning}>
                    🚨 <strong style={{ color: "#f87171" }}>No action taken for {days} days</strong>
                    {" "}— authorities have been unresponsive
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper:       { background: "#0d0d0d", minHeight: "100vh", color: "#fff", paddingBottom: 80 },
  header:        { padding: "20px 20px 8px", borderBottom: "1px solid #1a1a1a" },
  title:         { fontSize: 22, fontWeight: 800, margin: 0 },
  subtitle:      { color: "#555", fontSize: 13, margin: "4px 0 0" },
  statsBar:      { display: "flex", gap: 10, padding: "14px 16px" },
  statCard:      { flex: 1, background: "#1a1a1a", border: "1px solid #222", borderRadius: 10, padding: "10px 8px", textAlign: "center" },
  statValue:     { fontSize: 24, fontWeight: 800 },
  statLabel:     { fontSize: 10, color: "#555", marginTop: 2 },
  filterRow:     { display: "flex", gap: 8, padding: "0 16px 14px", flexWrap: "wrap" },
  pill:          { padding: "5px 12px", borderRadius: 20, border: "1px solid #333", background: "transparent", color: "#888", fontSize: 12, cursor: "pointer" },
  pillActive:    { background: "#6d28d9", border: "1px solid #6d28d9", color: "#fff" },
  list:          { display: "flex", flexDirection: "column", gap: 12, padding: "0 16px" },
  card:          { background: "#111", border: "1px solid #222", borderRadius: 14, padding: "16px", display: "flex", flexDirection: "column", gap: 8 },
  cardTop:       { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  rank:          { fontSize: 13, color: "#444", fontWeight: 700 },
  badge:         { fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 },
  inactionBadge: { fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#f8717122", color: "#f87171", border: "1px solid #f87171" },
  cardTitle:     { fontSize: 18, fontWeight: 700, color: "#fff" },
  cardMeta:      { fontSize: 12, color: "#555" },
  countRow:      { display: "flex", alignItems: "baseline" },
  countBig:      { fontSize: 30, fontWeight: 800, color: "#a78bfa" },
  countLabel:    { fontSize: 14, color: "#666" },
  progressLabel: { fontSize: 11, color: "#555" },
  progressTrack: { height: 5, background: "#222", borderRadius: 3, overflow: "hidden" },
  progressFill:  { height: "100%", borderRadius: 3, transition: "width 0.4s ease" },
  proofRow:      { display: "flex", alignItems: "center", gap: 8, marginTop: 2 },
  proofLabel:    { fontSize: 11, color: "#555", whiteSpace: "nowrap" },
  proofTrack:    { flex: 1, height: 4, background: "#222", borderRadius: 2, overflow: "hidden" },
  proofFill:     { height: "100%", borderRadius: 2, transition: "width 0.4s ease" },
  proofBadge:    { fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" },
  upvoteBtn:     { padding: "10px 14px", background: "#1a1a2e", border: "1px solid #6d28d9", borderRadius: 10, color: "#a78bfa", fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "left", width: "100%" },
  upvoteBtnVoted:{ background: "#1a2e1a", border: "1px solid #4ade80", color: "#4ade80", cursor: "default" },
  inactionWarning: { fontSize: 12, color: "#aaa", background: "#1a1111", border: "1px solid #2a1515", borderRadius: 8, padding: "8px 10px", marginTop: 2 },
  loader:        { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#0d0d0d" },
  empty:         { textAlign: "center", padding: "60px 32px", display: "flex", flexDirection: "column", alignItems: "center" }
};