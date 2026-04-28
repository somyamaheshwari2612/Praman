import { useEffect, useState } from "react";
import { getReports, getImageForCase } from "../services/sheets";
import { getProofStrength, getProofMeta, daysSince } from "../logic/grouping";
import { getPlaceName } from "../services/geocode";

export default function CaseDetail({ caseData: c, onBack }) {
  const [reports, setReports]     = useState([]);
  const [placeName, setPlaceName] = useState("");
  const [caseImage, setCaseImage] = useState(c.resolvedImage || "");

  useEffect(() => {
    getReports().then(all => {
      const arr = Array.isArray(all) ? all : [];
      setReports(arr.filter(r => r.category === c.category));
    });
    getPlaceName(c.center_lat, c.center_lng).then(setPlaceName);
    if (!caseImage) {
      getImageForCase(c.category, c.center_lat, c.center_lng).then(url => {
        if (url) setCaseImage(url);
      });
    }
  }, [c]);

  const days       = daysSince(c.first_reported);
  const proofScore = getProofStrength(c);
  const proofMeta  = getProofMeta(proofScore);

  function handleShare() {
    const shareUrl = `${window.location.origin}?case=${c.case_id}`;
    if (navigator.share) {
      navigator.share({ title: `Praman: ${c.category}`, url: shareUrl });
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert("Link copied to clipboard!");
    }
  }

  return (
    <div style={s.page}>
      <button style={s.back} onClick={onBack}>← Public Board</button>

      <div style={s.titleSection}>
        <span style={s.badge}>● PUBLIC CASE</span>
        <h1 style={s.title}>{c.category}</h1>
        <p style={s.location}>
          📍 {placeName || `${parseFloat(c.center_lat).toFixed(4)}, ${parseFloat(c.center_lng).toFixed(4)}`}
        </p>
        <button style={s.shareBtn} onClick={handleShare}>📤 Share this case</button>
      </div>

      <div style={s.statsGrid}>
        {[
          { value: c.report_count,                         label: "Reports Filed"     },
          { value: days,                                   label: "Days Without Action", color: days >= 7 ? "#ef5b1f" : "#111" },
          { value: c.category,                             label: "Category"          },
          { value: `${parseInt(c.upvotes || 0)} voices`,   label: "Community Support" },
        ].map((st, i) => (
          <div key={i} style={s.infoBox}>
            <div style={{ ...s.infoVal, color: st.color || "#111" }}>{st.value}</div>
            <div style={s.infoLabel}>{st.label}</div>
          </div>
        ))}
      </div>

      <div style={s.proofBox}>
        <div style={s.proofHeader}>
          <span style={s.proofLabel}>PROOF STRENGTH</span>
          <span style={{ ...s.proofValue, color: proofMeta.color }}>{proofMeta.label} Proof</span>
        </div>
        <div style={s.barTrack}>
          <div style={{ ...s.barFill, width: `${proofScore}%`, background: proofMeta.color }} />
        </div>
        <p style={s.proofNote}>
          Based on {c.report_count} reports, {c.upvotes || 0} community voices
          {caseImage ? ", photo evidence" : ""}
        </p>
      </div>

      {days >= 3 && (
        <div style={s.inactionBox}>
          🚨 <strong style={{ color: "#ef5b1f" }}>No action taken for {days} days</strong>
          {days >= 15 ? " — This case has reached critical escalation." : " — Authorities have been notified."}
        </div>
      )}

      {caseImage && (
        <div style={s.section}>
          <p style={s.sectionLabel}>PROOF IMAGES</p>
          <img src={caseImage} alt="evidence" style={s.evidenceImg} />
        </div>
      )}

      {reports.length > 0 && (
        <div style={s.section}>
          <p style={s.sectionLabel}>REPORT TIMELINE</p>
          <div style={s.timeline}>
            {reports.slice(0, 8).map((r, i) => (
              <div key={i} style={s.timelineItem}>
                <div style={s.dot} />
                <div>
                  <span style={s.timelineDate}>
                    {new Date(r.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  <p style={s.timelineDesc}>{r.description || "Issue reported"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page:         { maxWidth: 900, margin: "0 auto", padding: "40px 40px 80px" },
  back:         { background: "none", border: "none", color: "#888", fontSize: 14, cursor: "pointer", marginBottom: 28, padding: 0, fontFamily: "Poppins, sans-serif" },
  titleSection: { marginBottom: 32 },
  badge:        { display: "inline-block", border: "1px solid #efc9b7", color: "#cc6a35", padding: "5px 14px", borderRadius: 30, fontSize: 11, letterSpacing: 1, fontWeight: 600, marginBottom: 14 },
  title:        { fontSize: 42, fontWeight: 800, color: "#111", marginBottom: 8, lineHeight: 1.1 },
  location:     { color: "#888", fontSize: 14, marginBottom: 16 },
  shareBtn:     { padding: "9px 18px", background: "#fff", border: "1px solid #ddd", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Poppins, sans-serif" },
  statsGrid:    { display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" },
  infoBox:      { flex: 1, minWidth: 160, background: "#fff", padding: "24px", borderRadius: 14, border: "1px solid #eee" },
  infoVal:      { fontSize: 32, fontWeight: 800, marginBottom: 6 },
  infoLabel:    { color: "#999", fontSize: 13 },
  proofBox:     { background: "#fff", padding: "24px", borderRadius: 14, border: "1px solid #eee", marginBottom: 16 },
  proofHeader:  { display: "flex", justifyContent: "space-between", marginBottom: 10 },
  proofLabel:   { fontSize: 11, letterSpacing: 2, color: "#bbb", fontWeight: 600 },
  proofValue:   { fontSize: 13, fontWeight: 700 },
  barTrack:     { height: 8, background: "#f0ece9", borderRadius: 10, overflow: "hidden", marginBottom: 10 },
  barFill:      { height: "100%", borderRadius: 10, transition: "width 0.4s" },
  proofNote:    { fontSize: 12, color: "#aaa" },
  inactionBox:  { background: "#fff8f5", border: "1px solid #fde0d4", borderRadius: 12, padding: "14px 18px", marginBottom: 16, fontSize: 14, color: "#555" },
  section:      { background: "#fff", padding: "24px", borderRadius: 14, border: "1px solid #eee", marginBottom: 16 },
  sectionLabel: { fontSize: 11, letterSpacing: 2, color: "#bbb", fontWeight: 600, marginBottom: 14 },
  evidenceImg:  { width: 280, borderRadius: 10, display: "block" },
  timeline:     { display: "flex", flexDirection: "column", gap: 16 },
  timelineItem: { display: "flex", gap: 14, alignItems: "flex-start" },
  dot:          { width: 10, height: 10, borderRadius: "50%", background: "#ef5b1f", marginTop: 4, flexShrink: 0 },
  timelineDate: { fontSize: 12, color: "#ef5b1f", fontWeight: 600 },
  timelineDesc: { fontSize: 14, color: "#555", marginTop: 2 },
};