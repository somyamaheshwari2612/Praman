document.addEventListener("DOMContentLoaded", () => {

let lat = 27.1767;
let lng = 78.0081;

/* ===============================
   HELPERS
================================= */
function getReports() {
  return JSON.parse(localStorage.getItem("reports")) || [];
}

function saveReports(data) {
  localStorage.setItem("reports", JSON.stringify(data));
}

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/* ===============================
   REPORT PAGE
================================= */

const mapDiv = document.getElementById("map");
const locationInput = document.getElementById("location");
const form = document.getElementById("reportForm");

if (mapDiv) {

  const map = L.map("map").setView([lat, lng], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
  }).addTo(map);

  const marker = L.marker([lat, lng]).addTo(map);

  setTimeout(() => {
    map.invalidateSize();
  }, 200);

  function updateLocation(a, b) {
    lat = a;
    lng = b;

    marker.setLatLng([lat, lng]);
    map.setView([lat, lng], 16);

    if (locationInput) {
      locationInput.value = lat.toFixed(5) + ", " + lng.toFixed(5);
    }
  }

  updateLocation(lat, lng);

  const currentBtn = document.getElementById("useCurrent");

  if (currentBtn) {
    currentBtn.addEventListener("click", () => {
      navigator.geolocation.getCurrentPosition((pos) => {
        updateLocation(pos.coords.latitude, pos.coords.longitude);
      });
    });
  }

  map.on("click", (e) => {
    updateLocation(e.latlng.lat, e.latlng.lng);
  });
}

/* Submit Form */

if (form) {

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const photo = document.getElementById("photo").files[0];
    const title = document.getElementById("title").value.trim();
    const category = document.getElementById("category").value;
    const description = document.getElementById("description").value.trim();

    if (!photo || !title || !category || !description) {
      alert("Please fill all fields.");
      return;
    }

    let reports = getReports();
    let clustered = false;

    for (let r of reports) {
      const dist = getDistance(lat, lng, r.lat, r.lng);

      if (
        r.title.toLowerCase() === title.toLowerCase() &&
        r.category === category &&
        dist <= 300
      ) {
        r.count += 1;
        clustered = true;
        break;
      }
    }

    if (!clustered) {

const reader = new FileReader();

reader.onload = function(e){

reports.push({
id: Date.now(),
title,
category,
description,
lat,
lng,
count: 1,
createdAt: Date.now(),
photo: e.target.result
});

saveReports(reports);

alert("Report Submitted!");
window.location.href = "board.html";

};

reader.readAsDataURL(photo);

return;
}
    saveReports(reports);

    alert("Report Submitted!");
    window.location.href = "board.html";
  });
}

/* ===============================
   BOARD PAGE
================================= */

const container = document.getElementById("reportsContainer");
const heatMapDiv = document.getElementById("heatMap");

if (container) {

const reports = getReports();

reports.forEach(r => {

let created = r.createdAt || Date.now();

let days =
Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24));

r.priority = (r.count * 10) + days;

/* CATEGORY BOOST */

if (r.category === "Sanitation") {
r.priority += 20;
}

if (r.category === "Electricity") {
r.priority += 15;
}

if (r.category === "Roads") {
r.priority += 10;
}

});

/* SORT HIGH TO LOW */

reports.sort((a,b) => b.priority - a.priority);
container.innerHTML = "";

  if (reports.length === 0) {
    container.innerHTML = "<h2>No Reports Yet</h2>";
  }

  if (heatMapDiv) {

    const boardMap = L.map("heatMap").setView([27.1767, 78.0081], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap"
    }).addTo(boardMap);

    setTimeout(() => {
      boardMap.invalidateSize();
    }, 200);

    reports.forEach((r) => {

let color = "yellow";

if (r.count >= 10) color = "red";
else if (r.count >= 5) color = "orange";

let status = "Reported";

if (r.count >= 20) {
status = "Escalated to Authority";
}
else if (r.count >= 10) {
status = "Critical";
}
else if (r.count >= 5) {
status = "Needs Attention";
}

L.circle([r.lat, r.lng], {
color: color,
fillColor: color,
fillOpacity: 0.45,
radius: 250
}).addTo(boardMap)
.bindPopup(`
<b>${r.title}</b><br>
${r.count} complaints<br>
Status: ${status}
`);

});
  }

  reports.forEach((r) => {

let status = "Reported";
let badgeColor = "#999";

if (r.count >= 20) {
status = "Escalated to Authority";
badgeColor = "#8B0000";
}
else if (r.count >= 10) {
status = "Critical";
badgeColor = "red";
}
else if (r.count >= 5) {
status = "Needs Attention";
badgeColor = "orange";
}
else {
status = "Reported";
badgeColor = "#e0b000";
}

/* Inaction Tracking */

let daysPending =
Math.floor((Date.now() - r.createdAt) / (1000 * 60 * 60 * 24));

let dayColor = "#666";

if (daysPending >= 15) {
dayColor = "red";
}
else if (daysPending >= 7) {
dayColor = "orange";
}

/* Proof Strength */

let proof = r.count * 10;

if (r.count >= 5) proof += 20;

if (daysPending >= 7) proof += 20;

if (proof > 100) proof = 100;

let proofLabel = "Low";

if (proof >= 70) {
proofLabel = "High";
}
else if (proof >= 40) {
proofLabel = "Medium";
}

/* Card HTML */

container.innerHTML += `
<div class="case-card">

<h3>${r.title}</h3>

<p>${r.category}</p>

<p><b>${r.count} Reports Nearby</b></p>

<p style="
color:${dayColor};
font-weight:600;
margin-top:8px;
">
⏱️ No action for ${daysPending} days
</p>

<p class="status-badge" style="
background:${badgeColor};
color:white;
padding:8px 12px;
border-radius:8px;
display:inline-block;
margin-top:8px;
font-size:14px;
">
${status}
</p>

<p style="
margin-top:12px;
font-weight:600;
">
⚖️ Proof Strength: ${proofLabel} (${proof}%)
</p>

<div style="
width:100%;
height:8px;
background:#eee;
border-radius:10px;
overflow:hidden;
margin-top:6px;
">
<div style="
width:${proof}%;
height:100%;
background:#ef5b1f;
"></div>
</div>
<div style="
margin-top:15px;
display:flex;
gap:10px;
flex-wrap:wrap;
">

<a href="case.html?id=${r.id}" style="
padding:10px 14px;
background:#ef5b1f;
color:white;
text-decoration:none;
border-radius:8px;
font-size:14px;
">
View Case
</a>

<button onclick="shareCase(${r.id})" style="
padding:10px 14px;
border:none;
background:#222;
color:white;
border-radius:8px;
cursor:pointer;
font-size:14px;
">
Share Link
</button>

</div>
</div>
`;

});
}

/* ===============================
   HOME PAGE COUNTERS
================================= */

const reportCount = document.getElementById("reportCount");
const caseCount = document.getElementById("caseCount");
const unresolvedCount = document.getElementById("unresolvedCount");

if (reportCount || caseCount || unresolvedCount) {

  const reports = getReports();

  let totalReports = 0;
  let totalCases = reports.length;
  let unresolved = 0;

  reports.forEach((r) => {

totalReports += Number(r.count) || 0;

let daysPending =
Math.floor((Date.now() - r.createdAt) / (1000 * 60 * 60 * 24));

if (daysPending >= 15) {
unresolved++;
}

});

  if (reportCount) reportCount.innerText = totalReports;
  if (caseCount) caseCount.innerText = totalCases;
  if (unresolvedCount) unresolvedCount.innerText = unresolved;
}
window.shareCase = function(id){

let url =
window.location.origin +
window.location.pathname.replace("board.html","") +
"case.html?id=" + id;

if (navigator.clipboard) {
navigator.clipboard.writeText(url);
}
else {
prompt("Copy this link:", url);
}

alert("Case link copied!");

};
window.copyCurrentLink = function(){

if (navigator.clipboard) {
navigator.clipboard.writeText(window.location.href);
}
else {
prompt("Copy this link:", window.location.href);
}

alert("Link copied!");

};

const caseDetails = document.getElementById("caseDetails");

if(caseDetails){

let params = new URLSearchParams(window.location.search);

let id = params.get("id");

let reports = getReports();

let found = reports.find(r => r.id == id);

if(found){

let days =
Math.floor((Date.now() - found.createdAt) / (1000*60*60*24));

caseDetails.innerHTML = `
<h1>${found.title}</h1>

<p>${found.category}</p>

<p><b>${found.count} Reports Nearby</b></p>

<p>⏱️ No action for ${days} days</p>

<p>${found.description}</p>

<button onclick="copyCurrentLink()">
Copy Link
</button>
`;

}
else{

caseDetails.innerHTML = `
<h2>Case Not Found</h2>
<p>This report may have been removed or does not exist.</p>
`;

}

}
});