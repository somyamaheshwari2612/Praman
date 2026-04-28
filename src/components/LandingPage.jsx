import { useEffect, useState } from "react";
import { getCases, getReports } from "../services/sheets";

export default function LandingPage({ onNavigate }) {
  const [stats, setStats] = useState({ reports: 0, cases: 0, unresolved: 0 });
  const [counted, setCounted] = useState({ reports: 0, cases: 0, unresolved: 0 });

  useEffect(() => {
    Promise.all([getReports(), getCases()]).then(([reports, cases]) => {
      const r = Array.isArray(reports) ? reports.length : 0;
      const c = Array.isArray(cases)   ? cases.length   : 0;
      const u = Array.isArray(cases)
        ? cases.filter(ca => {
            const days = Math.floor((new Date() - new Date(ca.first_reported)) / 86400000);
            return days >= 15;
          }).length
        : 0;
      setStats({ reports: r, cases: c, unresolved: u });
    });
  }, []);

  // Count-up animation
  useEffect(() => {
    const duration = 1200;
    const steps = 40;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const ease = 1 - Math.pow(1 - progress, 3);
      setCounted({
        reports:    Math.round(stats.reports    * ease),
        cases:      Math.round(stats.cases      * ease),
        unresolved: Math.round(stats.unresolved * ease),
      });
      if (step >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, [stats]);

  return (
    <div style={s.page}>

      {/* Hero */}
      <section style={s.hero}>
        <span style={s.badge}>CIVIC EVIDENCE PLATFORM</span>

        <h1 style={s.h1}>
          Proof that<br />
          demands <em style={s.accent}>action.</em>
        </h1>

        <p style={s.heroP}>
          Individual complaints become collective, undeniable evidence.
          When enough people report the same issue — inaction is made visible to everyone.
        </p>

        <div style={s.buttons}>
          <button style={s.btnPrimary} onClick={() => onNavigate("report")}>
            Report an Issue
          </button>
          <button style={s.btnSecondary} onClick={() => onNavigate("board")}>
            View Public Board →
          </button>
        </div>
      </section>

      {/* Stats */}
      <section style={s.stats}>
        {[
          { value: counted.reports,    label: "Reports Filed"    },
          { value: counted.cases,      label: "Active Cases"     },
          { value: counted.unresolved, label: "Unresolved 15d+"  },
        ].map(stat => (
          <div key={stat.label} style={s.statBox}>
            <div style={s.statNum}>{stat.value}</div>
            <div style={s.statLabel}>{stat.label}</div>
          </div>
        ))}
      </section>

      {/* How it works */}
      <section style={s.howSection}>
        <p style={s.smallHeading}>HOW IT WORKS</p>
        <h2 style={s.sectionTitle}>From complaint to pressure</h2>

        <div style={s.steps}>
          {[
            { icon: "📸", title: "Report",   desc: "Submit a geo-tagged photo of a civic issue near you."         },
            { icon: "🧩", title: "Cluster",  desc: "Similar nearby reports automatically group into a single case." },
            { icon: "🔥", title: "Escalate", desc: "Cases with 5, 10, 15+ reports escalate up the pressure board." },
            { icon: "📢", title: "Pressure", desc: "Inaction is tracked publicly. Share to amplify the pressure."  },
          ].map((step, i) => (
            <div key={i} style={s.stepCard}>
              <div style={s.stepIcon}>{step.icon}</div>
              <div style={s.stepTitle}>{step.title}</div>
              <div style={s.stepDesc}>{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={s.cta}>
        <h2 style={s.ctaTitle}>Your report is evidence.</h2>
        <p style={s.ctaP}>Don't just complain — prove it. Add your voice to an existing case or start a new one.</p>
        <button style={s.btnPrimary} onClick={() => onNavigate("report")}>
          Start Reporting →
        </button>
      </section>

    </div>
  );
}

const s = {
  page:        { background: "#f7f4f2", minHeight: "100vh", paddingBottom: 80 },
  hero:        { padding: "48px 24px 32px", maxWidth: 600, margin: "0 auto" },
  badge:       { display: "inline-block", border: "1px solid #efc9b7", color: "#cc6a35", padding: "6px 16px", borderRadius: 30, fontSize: 11, letterSpacing: 2, fontWeight: 600 },
  h1:          { marginTop: 28, fontSize: 48, lineHeight: 1.1, fontWeight: 800, color: "#111", fontStyle: "normal" },
  accent:      { color: "#ef5b1f", fontStyle: "italic" },
  heroP:       { marginTop: 20, fontSize: 15, color: "#666", lineHeight: 1.8 },
  buttons:     { marginTop: 32, display: "flex", gap: 12, flexWrap: "wrap" },
  btnPrimary:  { padding: "14px 24px", background: "#ef5b1f", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer" },
  btnSecondary:{ padding: "14px 24px", background: "#fff", color: "#111", border: "1px solid #ddd", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer" },
  stats:       { display: "flex", gap: 0, padding: "32px 24px", borderTop: "1px solid #e7ddd8", borderBottom: "1px solid #e7ddd8", background: "#fff", margin: "0 16px", borderRadius: 14 },
  statBox:     { flex: 1, textAlign: "center" },
  statNum:     { fontSize: 34, fontWeight: 800, color: "#ef5b1f" },
  statLabel:   { fontSize: 11, color: "#999", marginTop: 4, fontWeight: 500 },
  howSection:  { padding: "48px 24px 0", maxWidth: 600, margin: "0 auto" },
  smallHeading:{ color: "#ef5b1f", fontSize: 11, letterSpacing: 2, fontWeight: 600, marginBottom: 8 },
  sectionTitle:{ fontSize: 28, fontWeight: 800, color: "#111", marginBottom: 28 },
  steps:       { display: "flex", flexDirection: "column", gap: 12 },
  stepCard:    { background: "#fff", border: "1px solid #eee", borderRadius: 14, padding: "20px" },
  stepIcon:    { fontSize: 28, marginBottom: 10 },
  stepTitle:   { fontSize: 16, fontWeight: 700, color: "#111", marginBottom: 6 },
  stepDesc:    { fontSize: 13, color: "#888", lineHeight: 1.6 },
  cta:         { margin: "40px 16px 0", background: "#ef5b1f", borderRadius: 16, padding: "40px 24px", textAlign: "center" },
  ctaTitle:    { fontSize: 26, fontWeight: 800, color: "#fff", marginBottom: 12 },
  ctaP:        { fontSize: 14, color: "#fde0d4", marginBottom: 24, lineHeight: 1.7 },
};