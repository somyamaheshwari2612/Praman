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

// ── UPDATED getPublicCases ────────────────────────────────────
// NOW: shows ALL cases (not just 5+), sorted by priority score
export function getPublicCases(cases) {
  return [...cases].sort((a, b) => getPriorityScore(b) - getPriorityScore(a));
}

// Progress to next threshold (for UI progress bar)
export function getThresholdProgress(count) {
  count = parseInt(count);
  if (count >= 15) return { progress: 100, next: 15, current: 15 };
  if (count >= 10) return { progress: ((count - 10) / 5) * 100, next: 15, current: count };
  if (count >= 5)  return { progress: ((count - 5) / 5) * 100,  next: 10, current: count };
  return           { progress: (count / 5) * 100, next: 5, current: count };
}

// ── PROOF STRENGTH ────────────────────────────────────────────
// Score 0-100 based on evidence quality
// Factors: report count, image evidence, recency
export function getProofStrength(c) {
  let score = 0;

  const count = parseInt(c.report_count);
  const days  = daysSince(c.first_reported);

  // 1. Report count (max 50 points)
  //    1 report = 10pts, scales up, caps at 50
  score += Math.min(count * 10, 50);

  // 2. Image evidence (max 30 points)
  //    image_url present on the case means at least one photo was submitted
  if (c.image_url && c.image_url.trim() !== "") score += 30;

  // 3. Recency (max 20 points)
  //    Fresh reports = stronger proof, older = weaker
  if (days === 0)      score += 20;
  else if (days <= 3)  score += 15;
  else if (days <= 7)  score += 10;
  else if (days <= 14) score += 5;
  else                 score += 0;

  return Math.min(score, 100);
}

// ── PROOF STRENGTH META (label + color for UI) ────────────────
export function getProofMeta(score) {
  if (score >= 80) return { label: "Strong",   color: "#4ade80" };
  if (score >= 50) return { label: "Moderate", color: "#f59e0b" };
  if (score >= 20) return { label: "Weak",     color: "#f87171" };
  return                  { label: "Minimal",  color: "#555"    };
}

// ── PRIORITY SCORE ────────────────────────────────────────────
// Drives board sorting → higher = more urgent
// Factors: escalation level, inaction days, proof strength, report count
export function getPriorityScore(c) {
  const escalation  = parseInt(c.escalation_level) || 0;
  const days        = daysSince(c.first_reported);
  const count       = parseInt(c.report_count) || 0;
  const proof       = getProofStrength(c);

  // Escalation is the heaviest factor
  const escalationScore = escalation * 30;         // max 90

  // Inaction — the longer ignored, the higher it rises
  const inactionScore = Math.min(days * 2, 40);    // max 40, caps at 20 days

  // Report count contribution
  const countScore = Math.min(count * 3, 30);      // max 30

  // Proof strength contribution
  const proofScore = proof * 0.2;                  // max 20

  return escalationScore + inactionScore + countScore + proofScore;
}