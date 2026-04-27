import { useState } from "react";
import ReportForm from "./components/ReportForm";
import MapView from "./components/MapView";
import PressureBoard from "./components/PressureBoard";

export default function App() {
  const [tab, setTab] = useState("board");

  return (
    <div style={styles.root}>

      {/* Top header */}
      <div style={styles.topBar}>
        <span style={styles.logo}>प्रमाण</span>
        <span style={styles.logoSub}>PRAMAN</span>
      </div>

      {/* Page content */}
      <div style={styles.content}>
        {tab === "report" && <ReportForm onSubmitSuccess={() => setTab("board")} />}
        {tab === "map"    && <MapView />}
        {tab === "board"  && <PressureBoard />}
      </div>

      {/* Bottom tab bar */}
      <nav style={styles.tabBar}>
        {[
          { id: "board",  icon: "🔥", label: "Pressure" },
          { id: "report", icon: "📸", label: "Report"   },
          { id: "map",    icon: "🗺️", label: "Map"      },
        ].map(t => (
          <button
            key={t.id}
            style={{
              ...styles.tabBtn,
              ...(tab === t.id ? styles.tabBtnActive : {})
            }}
            onClick={() => setTab(t.id)}
          >
            <span style={styles.tabIcon}>{t.icon}</span>
            <span style={{
              ...styles.tabLabel,
              color: tab === t.id ? "#a78bfa" : "#555"
            }}>
              {t.label}
            </span>
          </button>
        ))}
      </nav>

    </div>
  );
}

const styles = {
  root: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    background: "#0d0d0d",
    maxWidth: 600,
    margin: "0 auto",
    position: "relative"
  },
  topBar: {
    display: "flex",
    alignItems: "baseline",
    gap: 8,
    padding: "14px 20px 10px",
    borderBottom: "1px solid #1a1a1a",
    background: "#0d0d0d",
    position: "sticky",
    top: 0,
    zIndex: 100
  },
  logo: {
    fontSize: 22,
    fontWeight: 800,
    color: "#a78bfa",
    letterSpacing: 1
  },
  logoSub: {
    fontSize: 11,
    fontWeight: 600,
    color: "#444",
    letterSpacing: 3
  },
  content: {
    flex: 1,
    overflowY: "auto",
    paddingBottom: 70 // space for tab bar
  },
  tabBar: {
    display: "flex",
    position: "fixed",
    bottom: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: "100%",
    maxWidth: 600,
    background: "#111",
    borderTop: "1px solid #1e1e1e",
    zIndex: 200
  },
  tabBtn: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "10px 0 8px",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    gap: 3
  },
  tabBtnActive: {
    borderTop: "2px solid #a78bfa",
    background: "#0d0d0d"
  },
  tabIcon: {
    fontSize: 20
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: 0.5,
    textTransform: "uppercase"
  }
};