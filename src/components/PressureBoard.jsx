import { useEffect, useState } from "react";
import { getCases } from "../services/sheets";
import { getEscalationMeta, daysSince, getPublicCases, getThresholdProgress } from "../logic/grouping";

export default function PressureBoard() {
  const [cases, setCases] = useState([]);
  const [allCases, setAllCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    getCases().then(data => {
      const arr = Array.isArray(data) ? data : [];
      setAllCases(arr);
      setCases(getPublicCases(arr));
      setLoading(false);
    });
  }, []);

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

      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>🔥 Public Pressure Board</h2>
        <p style={styles.subtitle}>
          Cases with 5+ reports · Ranked by public pressure
        </p>
      </div>

      {/* Stats bar */}
      <div style={styles.statsBar}>
        {[
          { label: "Total Cases", value: allCases.length, color: "#a78bfa" },
          { label: "On Board",    value: cases.length,    color: "#f59e0b" },
          { label: "Critical",    value: allCases.filter(c => c.escalation_level >= 3).length, color: "#ff2d2d" },
        ].map(s => (
          <div key={s.label} style={styles.statCard}>
            <div style={{ ...styles.statValue, color: s.color }}>{s.value}</div>
            <div style={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter pills */}
      <div style={styles.filterRow}>
        <button
          style={{ ...styles.pill, ...(filter === "all" ? styles.pillActive : {}) }}
          onClick={() => handleFilter("all")}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            style={{ ...styles.pill, ...(filter === cat ? styles.pillActive : {}) }}
            onClick={() => handleFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Cases list */}
      {cases.length === 0 ? (
        <div style={styles.empty}>
          <div style={{ fontSize: 48 }}>📭</div>
          <p style={{ color: "#555", marginTop: 12 }}>
            No cases have reached 5 reports yet.
          </p>
          <p style={{ color: "#444", fontSize: 13 }}>
            Submit more reports to escalate a case onto the board.
          </p>
        </div>
      ) : (
        <div style={styles.list}>
          {cases.map((c, i) => {
            const meta = getEscalationMeta(c.escalation_level);
            const days = daysSince(c.first_reported);
            const { progress, next, current } = getThresholdProgress(c.report_count);

            return (
              <div key={c.case_id || i} style={styles.card}>

                {/* Rank + level badge */}
                <div style={styles.cardTop}>
                  <span style={styles.rank}>#{i + 1}</span>
                  <span style={{ ...styles.badge, background: meta.color + "22", color: meta.color, border: `1px solid ${meta.color}` }}>
                    {meta.emoji} {meta.label}
                  </span>
                  {days >= 7 && (
                    <span style={styles.noActionBadge}>
                      ⚠️ {days}d no action
                    </span>
                  )}
                </div>

                {/* Category + location */}
                <div style={styles.cardTitle}>{c.category}</div>
                <div style={styles.cardMeta}>
                  📍 {parseFloat(c.center_lat).toFixed(4)}, {parseFloat(c.center_lng).toFixed(4)}
                  &nbsp;·&nbsp;
                  🕐 First reported {days} day{days !== 1 ? "s" : ""} ago
                </div>

                {/* Report count */}
                <div style={styles.countRow}>
                  <span style={styles.countBig}>{c.report_count}</span>
                  <span style={styles.countLabel}>
                    &nbsp;citizen report{c.report_count != 1 ? "s" : ""}
                  </span>
                </div>

                {/* Progress to next threshold */}
                <div style={styles.progressLabel}>
                  {current >= 15
                    ? "Maximum escalation reached"
                    : `${next - current} more report${(next - current) !== 1 ? "s" : ""} to next escalation`}
                </div>
                <div style={styles.progressTrack}>
                  <div style={{
                    ...styles.progressFill,
                    width: `${progress}%`,
                    background: meta.color
                  }} />
                </div>

                {/* No action warning */}
                {days >= 3 && (
                  <div style={styles.noActionWarning}>
                    🚨 No action taken for <strong style={{ color: "#f87171" }}>{days} days</strong>
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
  wrapper: {
    background: "#0d0d0d",
    minHeight: "100vh",
    color: "#fff",
    paddingBottom: 40
  },
  header: {
    padding: "24px 20px 8px",
    borderBottom: "1px solid #1a1a1a"
  },
  title: {
    fontSize: 22,
    fontWeight: 800,
    margin: 0
  },
  subtitle: {
    color: "#555",
    fontSize: 13,
    margin: "4px 0 0"
  },
  statsBar: {
    display: "flex",
    gap: 12,
    padding: "16px 20px"
  },
  statCard: {
    flex: 1,
    background: "#1a1a1a",
    border: "1px solid #222",
    borderRadius: 10,
    padding: "12px 10px",
    textAlign: "center"
  },
  statValue: {
    fontSize: 26,
    fontWeight: 800
  },
  statLabel: {
    fontSize: 11,
    color: "#555",
    marginTop: 2
  },
  filterRow: {
    display: "flex",
    gap: 8,
    padding: "0 20px 16px",
    flexWrap: "wrap"
  },
  pill: {
    padding: "5px 12px",
    borderRadius: 20,
    border: "1px solid #333",
    background: "transparent",
    color: "#888",
    fontSize: 12,
    cursor: "pointer"
  },
  pillActive: {
    background: "#6d28d9",
    border: "1px solid #6d28d9",
    color: "#fff"
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    padding: "0 16px"
  },
  card: {
    background: "#111",
    border: "1px solid #222",
    borderRadius: 14,
    padding: "16px 16px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 8
  },
  cardTop: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap"
  },
  rank: {
    fontSize: 13,
    color: "#555",
    fontWeight: 700
  },
  badge: {
    fontSize: 11,
    fontWeight: 700,
    padding: "3px 10px",
    borderRadius: 20
  },
  noActionBadge: {
    fontSize: 11,
    fontWeight: 700,
    padding: "3px 10px",
    borderRadius: 20,
    background: "#f8717122",
    color: "#f87171",
    border: "1px solid #f87171"
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#fff"
  },
  cardMeta: {
    fontSize: 12,
    color: "#555"
  },
  countRow: {
    display: "flex",
    alignItems: "baseline"
  },
  countBig: {
    fontSize: 32,
    fontWeight: 800,
    color: "#a78bfa"
  },
  countLabel: {
    fontSize: 14,
    color: "#666"
  },
  progressLabel: {
    fontSize: 11,
    color: "#555"
  },
  progressTrack: {
    height: 6,
    background: "#222",
    borderRadius: 3,
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    transition: "width 0.4s ease"
  },
  noActionWarning: {
    fontSize: 12,
    color: "#888",
    background: "#1a1111",
    border: "1px solid #2a1515",
    borderRadius: 8,
    padding: "6px 10px",
    marginTop: 4
  },
  loader: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    background: "#0d0d0d"
  },
  empty: {
    textAlign: "center",
    padding: "60px 32px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  }
};