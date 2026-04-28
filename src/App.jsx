import { useState } from "react";
import LandingPage   from "./components/LandingPage";
import ReportForm    from "./components/ReportForm";
import MapView       from "./components/MapView";
import PressureBoard from "./components/PressureBoard";
import CaseDetail    from "./components/CaseDetail";

export default function App() {
  const [tab, setTab]         = useState("home");
  const [activeCase, setActiveCase] = useState(null);

  function openCase(c) { setActiveCase(c); setTab("case"); }
  function goBack()    { setActiveCase(null); setTab("board"); }

  return (
    <div style={s.root}>
      <header style={s.navbar}>
        <div style={s.logo} onClick={() => setTab("home")}>
          <span style={s.logoText}>प्रमाण</span>
        </div>
        <nav style={s.navLinks}>
          <button style={s.navBtn} onClick={() => setTab("board")}>Public Board</button>
          <button
            style={{ ...s.navBtn, ...s.navBtnOrange }}
            onClick={() => setTab("report")}
          >+ Report Issue</button>
        </nav>
      </header>

      <main style={s.content}>
        {tab === "home"   && <LandingPage onNavigate={setTab} />}
        {tab === "board"  && <PressureBoard onOpenCase={openCase} />}
        {tab === "report" && <ReportForm onSubmitSuccess={() => setTab("board")} />}
        {tab === "map"    && <MapView />}
        {tab === "case"   && <CaseDetail caseData={activeCase} onBack={goBack} />}
      </main>
    </div>
  );
}

const s = {
  root:         { minHeight: "100vh", background: "#f7f4f2", maxWidth: 1200, margin: "0 auto" },
  navbar:       { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 40px", height: 70, borderBottom: "1px solid #e7ddd8", background: "#fff", position: "sticky", top: 0, zIndex: 100 },
  logo:         { cursor: "pointer" },
  logoText:     { fontSize: 24, fontWeight: 800, color: "#ef5b1f" },
  navLinks:     { display: "flex", gap: 12, alignItems: "center" },
  navBtn:       { padding: "8px 18px", background: "transparent", border: "1px solid transparent", borderRadius: 8, fontSize: 14, fontWeight: 500, color: "#111", cursor: "pointer" },
  navBtnOrange: { border: "1px solid #ef5b1f", color: "#ef5b1f" },
  content:      { flex: 1 },
};