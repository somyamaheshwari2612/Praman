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
export async function upvoteCase(case_id) {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ action: "upvoteCase", case_id })
  });
  return res.json();
}

export async function getImageForCase(category, lat, lng) {
  const reports = await getReports();
  if (!Array.isArray(reports)) return "";
  
  const match = reports
    .filter(r => {
      if (r.category !== category) return false;
      const dLat = (parseFloat(r.lat) - parseFloat(lat)) * 111;
      const dLng = (parseFloat(r.lng) - parseFloat(lng)) * 111;
      return Math.sqrt(dLat*dLat + dLng*dLng) < 1.0;
    })
    .find(r => r.image_url && r.image_url.startsWith("http"));
  
  return match ? match.image_url : "";
}