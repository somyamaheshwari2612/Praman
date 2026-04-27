// Escalation level → human-readable label + color
export function getEscalationMeta(level) {
  switch (parseInt(level)) {
    case 3: return { label: "CRITICAL",  color: "#FF2D2D", emoji: "🔴" };
    case 2: return { label: "HIGH",      color: "#FF8C00", emoji: "🟠" };
    case 1: return { label: "ELEVATED",  color: "#FFD700", emoji: "🟡" };
    default: return { label: "WATCHING", color: "#6B7280", emoji: "⚪" };
  }
}

// Calculate how many days since first report
export function daysSince(isoTimestamp) {
  const start = new Date(isoTimestamp);
  const now = new Date();
  const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  return diff;
}

// Sort cases for Pressure Board
// Priority: escalation_level DESC → report_count DESC → days DESC
export function sortByPressure(cases) {
  return [...cases].sort((a, b) => {
    if (b.escalation_level !== a.escalation_level)
      return b.escalation_level - a.escalation_level;
    if (b.report_count !== a.report_count)
      return b.report_count - a.report_count;
    return daysSince(b.first_reported) - daysSince(a.first_reported);
  });
}

// Filter only cases worth showing on public board (level >= 1)
export function getPublicCases(cases) {
  return sortByPressure(cases.filter(c => parseInt(c.escalation_level) >= 1));
}

// Progress to next threshold (for UI progress bar)
export function getThresholdProgress(count) {
  count = parseInt(count);
  if (count >= 15) return { progress: 100, next: 15, current: 15 };
  if (count >= 10) return { progress: ((count - 10) / 5) * 100, next: 15, current: count };
  if (count >= 5)  return { progress: ((count - 5) / 5) * 100,  next: 10, current: count };
  return           { progress: (count / 5) * 100, next: 5, current: count };
}