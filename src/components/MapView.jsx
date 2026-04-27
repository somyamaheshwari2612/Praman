import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { getCases } from "../services/sheets";
import { getEscalationMeta, daysSince } from "../logic/grouping";
import "leaflet/dist/leaflet.css";

export default function MapView() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    getCases().then(data => {
      setCases(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  // Default center — Mathura, can be overridden by user location
  const defaultCenter = [27.4924, 77.6737];

  if (loading) return (
    <div style={styles.loader}>
      <div style={{ fontSize: 32 }}>🗺️</div>
      <p style={{ color: "#aaa", marginTop: 12 }}>Loading cases...</p>
    </div>
  );

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <h2 style={styles.title}>🗺️ Live Issue Map</h2>
        <p style={styles.subtitle}>{cases.length} active case{cases.length !== 1 ? "s" : ""} reported</p>
      </div>

      {/* Legend */}
      <div style={styles.legend}>
        {[
          { emoji: "🔴", label: "Critical (15+)" },
          { emoji: "🟠", label: "High (10+)" },
          { emoji: "🟡", label: "Elevated (5+)" },
          { emoji: "⚪", label: "Watching (<5)" }
        ].map(l => (
          <span key={l.label} style={styles.legendItem}>
            {l.emoji} {l.label}
          </span>
        ))}
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={styles.map}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {cases.map((c, i) => {
          const meta = getEscalationMeta(c.escalation_level);
          const radius = 10 + parseInt(c.report_count) * 2; // bigger = more reports
          const days = daysSince(c.first_reported);

          return (
            <CircleMarker
              key={c.case_id || i}
              center={[parseFloat(c.center_lat), parseFloat(c.center_lng)]}
              radius={Math.min(radius, 40)}
              pathOptions={{
                color: meta.color,
                fillColor: meta.color,
                fillOpacity: 0.7,
                weight: 2
              }}
              eventHandlers={{
                click: () => setSelected(c)
              }}
            >
              <Popup>
                <div style={styles.popup}>
                  <strong>{meta.emoji} {c.category}</strong><br />
                  <span style={{ color: meta.color }}>{meta.label}</span><br />
                  📊 {c.report_count} report{c.report_count != 1 ? "s" : ""}<br />
                  🕐 {days} day{days !== 1 ? "s" : ""} ago<br />
                  {days >= 7 && (
                    <span style={{ color: "#f87171", fontSize: 12 }}>
                      ⚠️ No action for {days} days
                    </span>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Empty state */}
      {cases.length === 0 && (
        <div style={styles.empty}>
          No cases yet. Submit a report to see it appear here.
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    background: "#111",
    minHeight: "100vh",
    color: "#fff",
    display: "flex",
    flexDirection: "column"
  },
  header: {
    padding: "20px 20px 8px"
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    margin: 0
  },
  subtitle: {
    color: "#aaa",
    fontSize: 14,
    margin: "4px 0 0"
  },
  legend: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    padding: "8px 20px 12px",
    fontSize: 12
  },
  legendItem: {
    background: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: 6,
    padding: "3px 8px",
    color: "#ccc"
  },
  map: {
    flex: 1,
    height: "60vh",
    width: "100%",
    zIndex: 1
  },
  popup: {
    fontSize: 13,
    lineHeight: 1.7,
    color: "#111"
  },
  loader: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    background: "#111"
  },
  empty: {
    textAlign: "center",
    color: "#555",
    padding: 32,
    fontSize: 14
  }
};