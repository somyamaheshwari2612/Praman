const BASE_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

export async function submitReport(reportData) {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({
      action: "submitReport",
      ...reportData
    })
  });
  return res.json();
}

export async function getCases() {
  const res = await fetch(`${BASE_URL}?action=getCases`);
  return res.json();
}

export async function getReports() {
  const res = await fetch(`${BASE_URL}?action=getReports`);
  return res.json();
}