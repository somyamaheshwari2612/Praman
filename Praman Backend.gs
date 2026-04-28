const SHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

function doGet(e) {
  const action = e.parameter.action;
  let result;
  if (action === "getCases")        result = getCases();
  else if (action === "getReports") result = getReports();
  else result = { error: "Unknown action" };
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); }
  catch (err) { return ContentService.createTextOutput(JSON.stringify({ error: "Invalid JSON" })).setMimeType(ContentService.MimeType.JSON); }
  const action = body.action;
  let result;
  if (action === "submitReport")      result = submitReport(body);
  else if (action === "upvoteCase")   result = upvoteCase(body);
  else result = { error: "Unknown action" };
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function submitReport(data) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const reportsSheet = ss.getSheetByName("Reports");
  if (!reportsSheet) return { success: false, error: "Reports sheet not found" };
  const report_id = "R_" + Date.now();
  const timestamp = new Date().toISOString();
  reportsSheet.appendRow([report_id, timestamp, data.category, data.description, data.lat, data.lng, data.image_url || ""]);
  groupAndUpdateCases(ss);
  return { success: true, report_id };
}

function getCases() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  return getSheetDataAsJSON(ss.getSheetByName("Cases"));
}

function getReports() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  return getSheetDataAsJSON(ss.getSheetByName("Reports"));
}

function upvoteCase(data) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const casesSheet = ss.getSheetByName("Cases");
  const rows = casesSheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.case_id) {
      const currentUpvotes = parseInt(rows[i][8]) || 0;
      casesSheet.getRange(i + 1, 9).setValue(currentUpvotes + 1);
      return { success: true, upvotes: currentUpvotes + 1 };
    }
  }
  return { success: false, error: "Case not found" };
}

function groupAndUpdateCases(ss) {
  if (!ss) ss = SpreadsheetApp.openById(SHEET_ID);
  const reportsSheet = ss.getSheetByName("Reports");
  const casesSheet   = ss.getSheetByName("Cases");
  if (!reportsSheet || !casesSheet) return;

  const reportsData = reportsSheet.getDataRange().getValues();
  if (reportsData.length <= 1) return;

  const headers = reportsData[0];
  const reports = reportsData.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });

  // ── Preserve existing upvotes before clearing ──────────────
  const existingUpvotes = {};
  const existingRows = casesSheet.getDataRange().getValues();
  const existingHeaders = existingRows[0] || [];
  const upvoteColIndex = existingHeaders.indexOf("upvotes");
  if (upvoteColIndex !== -1) {
    existingRows.slice(1).forEach(row => {
      if (row[0]) existingUpvotes[row[0]] = parseInt(row[upvoteColIndex]) || 0;
    });
  }

  const RADIUS_KM = 1.0;
  const cases = [];

  reports.forEach((report, index) => {
    let matched = false;
    for (const c of cases) {
      if (c.category !== report.category) continue;
      const dist = haversine(parseFloat(report.lat), parseFloat(report.lng), c.center_lat, c.center_lng);
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
        case_id: "C_" + report.category.replace(/\s+/g, "_") + "_" + Math.round(parseFloat(report.lat) * 1000) + "_" + Math.round(parseFloat(report.lng) * 1000),
        category: report.category,
        center_lat: parseFloat(report.lat),
        center_lng: parseFloat(report.lng),
        reports: [report],
        first_reported: report.timestamp
      });
    }
  });

  const outputHeaders = ["case_id","category","center_lat","center_lng","report_count","escalation_level","first_reported","image_url","upvotes"];

  const outputValues = cases.map(c => {
    const count     = c.reports.length;
    const level     = count >= 15 ? 3 : count >= 10 ? 2 : count >= 5 ? 1 : 0;
    const image_url = c.reports.map(r => r.image_url).filter(u => u && String(u).trim() !== "").pop() || "";
    const upvotes   = existingUpvotes[c.case_id] || 0;  // preserve existing upvotes
    return [c.case_id, c.category, c.center_lat, c.center_lng, count, level, c.first_reported, image_url, upvotes];
  });

  casesSheet.clearContents();
  if (outputValues.length > 0) {
    casesSheet.getRange(1, 1, 1, outputHeaders.length).setValues([outputHeaders]);
    casesSheet.getRange(2, 1, outputValues.length, outputHeaders.length).setValues(outputValues);
  }
}

function getSheetDataAsJSON(sheet) {
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  const headers = rows[0];
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function toRad(deg) { return deg * Math.PI / 180; }
function avg(arr)   { return arr.reduce((a, b) => a + b, 0) / arr.length; }