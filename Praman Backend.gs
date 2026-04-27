const SHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

// ── ROUTING ──────────────────────────────────────────────────
function doGet(e) {
  const action = e.parameter.action;
  let result;

  if (action === "getCases") result = getCases();
  else if (action === "getReports") result = getReports();
  else result = { error: "Unknown action" };

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const action = body.action;
  let result;

  if (action === "submitReport") result = submitReport(body);
  else result = { error: "Unknown action" };

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── SUBMIT REPORT ─────────────────────────────────────────────
function submitReport(data) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const reportsSheet = ss.getSheetByName("Reports");

  const report_id = "R_" + Date.now();
  const timestamp = new Date().toISOString();

  reportsSheet.appendRow([
    report_id,
    timestamp,
    data.category,
    data.description,
    data.lat,
    data.lng,
    data.image_url || ""
  ]);

  groupAndUpdateCases();

  return { success: true, report_id };
}

// ── GET ALL CASES ─────────────────────────────────────────────
function getCases() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName("Cases");
  const rows = sheet.getDataRange().getValues();

  if (rows.length <= 1) return [];

  const headers = rows[0];
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

// ── GET ALL REPORTS ───────────────────────────────────────────
function getReports() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName("Reports");
  const rows = sheet.getDataRange().getValues();

  if (rows.length <= 1) return [];

  const headers = rows[0];
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

// ── CORE GROUPING + ESCALATION LOGIC ─────────────────────────
function groupAndUpdateCases() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const reportsSheet = ss.getSheetByName("Reports");
  const casesSheet   = ss.getSheetByName("Cases");

  const reportsData = reportsSheet.getDataRange().getValues();
  if (reportsData.length <= 1) return;

  const headers = reportsData[0];
  const reports = reportsData.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });

  const RADIUS_KM = 0.5;
  const cases = [];

  reports.forEach(report => {
    let matched = false;

    for (const c of cases) {
      if (c.category !== report.category) continue;
      const dist = haversine(
        parseFloat(report.lat), parseFloat(report.lng),
        c.center_lat, c.center_lng
      );
      if (dist <= RADIUS_KM) {
        c.reports.push(report);
        c.center_lat = avg(c.reports.map(r => parseFloat(r.lat)));
        c.center_lng = avg(c.reports.map(r => parseFloat(r.lng)));
        matched = true;
        break;
      }
    }

    if (!matched) {
      cases.push({
        case_id: "C_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
        category: report.category,
        center_lat: parseFloat(report.lat),
        center_lng: parseFloat(report.lng),
        reports: [report],
        first_reported: report.timestamp
      });
    }
  });

  casesSheet.clearContents();
  casesSheet.appendRow([
    "case_id", "category", "center_lat", "center_lng",
    "report_count", "escalation_level", "first_reported"
  ]);

  cases.forEach(c => {
    const count = c.reports.length;
    const level = count >= 15 ? 3 : count >= 10 ? 2 : count >= 5 ? 1 : 0;
    casesSheet.appendRow([
      c.case_id,
      c.category,
      c.center_lat,
      c.center_lng,
      count,
      level,
      c.first_reported
    ]);
  });
}

// ── HELPERS ───────────────────────────────────────────────────
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) { return deg * Math.PI / 180; }
function avg(arr) { return arr.reduce((a, b) => a + b, 0) / arr.length; }

function testGetCases() {
  const fakeE = { parameter: { action: "getCases" } };
  const result = doGet(fakeE);
  Logger.log(result.getContent());
}

function testSubmitReport() {
  const fakeE = {
    postData: {
      contents: JSON.stringify({
        action: "submitReport",
        lat: 27.4924,
        lng: 77.6737,
        category: "Road",
        description: "Test pothole",
        image_url: ""
      })
    }
  };
  const result = doPost(fakeE);
  Logger.log(result.getContent());
}
