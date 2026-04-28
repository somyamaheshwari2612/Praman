import { useState } from "react";
import { submitReport } from "../services/sheets";

const CATEGORIES = [
  "Pothole",
  "Broken Streetlight",
  "Garbage Dumping",
  "Open Drain",
  "Damaged Road",
  "Water Leakage",
  "Encroachment",
  "Other"
];

export default function ReportForm({ onSubmitSuccess }) {
  const [category, setCategory]     = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage]           = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [location, setLocation]     = useState(null);
  const [status, setStatus]         = useState("idle"); 
  // idle | locating | uploading | submitting | done | error
  const [errorMsg, setErrorMsg]     = useState("");

  // ── Get GPS location ─────────────────────────────────────
  function handleGetLocation() {
  setStatus("locating");
  if (!navigator.geolocation) {
    setErrorMsg("Geolocation is not supported by your browser.");
    setStatus("error");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      setLocation({ 
        lat: pos.coords.latitude, 
        lng: pos.coords.longitude 
      });
      setStatus("idle");
    },
    (err) => {
      console.error("Location error:", err.code, err.message);
      if (err.code === 1) setErrorMsg("Location access denied. Please allow location in browser settings.");
      else if (err.code === 2) setErrorMsg("Location unavailable. Try again.");
      else setErrorMsg("Location request timed out. Try again.");
      setStatus("error");
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
}

  // ── Image preview ─────────────────────────────────────────
  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  }

  // ── Upload to Cloudinary ──────────────────────────────────
  async function uploadImage(file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_PRESET);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD}/image/upload`,
      { method: "POST", body: formData }
    );
    const data = await res.json();
    return data.secure_url;
  }

  // ── Submit ────────────────────────────────────────────────
  async function handleSubmit() {
    // Validation
    if (!category)        return setErrorMsg("Please select a category.");
    if (!description)     return setErrorMsg("Please add a description.");
    if (!image)           return setErrorMsg("Please attach an image.");
    if (!location)        return setErrorMsg("Please capture your location first.");

    setErrorMsg("");

    try {
      // 1. Upload image
      setStatus("uploading");
      const image_url = await uploadImage(image);

      // 2. Submit report
      setStatus("submitting");
      await submitReport({
        category,
        description,
        lat: location.lat,
        lng: location.lng,
        image_url
      });

      setStatus("done");
    } catch (err) {
      console.error(err);
      setErrorMsg("Something went wrong. Check console.");
      setStatus("error");
    }
  }

  // ── Success screen ────────────────────────────────────────
  if (status === "done") {
    return (
      <div style={styles.successBox}>
        <div style={{ fontSize: 48 }}>✅</div>
        <h2 style={{ color: "#4ade80", margin: "12px 0 8px" }}>Report Submitted!</h2>
        <p style={{ color: "#aaa" }}>Your report has been logged and grouped into the system.</p>
        <button style={styles.btnPrimary} onClick={() => {
          setStatus("idle");
          setCategory("");
          setDescription("");
          setImage(null);
          setImagePreview(null);
          setLocation(null);
          if (onSubmitSuccess) onSubmitSuccess();
        }}>
          Submit Another
        </button>
      </div>
    );
  }

  // ── Main form ─────────────────────────────────────────────
  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🚨 Report an Issue</h2>

      {/* Category */}
      <label style={styles.label}>Category</label>
      <select
        style={styles.select}
        value={category}
        onChange={e => setCategory(e.target.value)}
      >
        <option value="">-- Select category --</option>
        {CATEGORIES.map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      {/* Description */}
      <label style={styles.label}>Description</label>
      <textarea
        style={styles.textarea}
        placeholder="Describe the issue briefly..."
        value={description}
        onChange={e => setDescription(e.target.value)}
        rows={3}
      />

      {/* Image Upload */}
      <label style={styles.label}>Photo Evidence</label>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageChange}
        style={styles.fileInput}
      />
      {imagePreview && (
        <img src={imagePreview} alt="preview" style={styles.preview} />
      )}

      {/* Location */}
      <label style={styles.label}>Location</label>
      {location ? (
        <div style={styles.locationBox}>
          📍 {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
          <span style={{ color: "#4ade80", marginLeft: 8 }}>✓ Captured</span>
        </div>
      ) : (
        <button
          style={styles.btnSecondary}
          onClick={handleGetLocation}
          disabled={status === "locating"}
        >
          {status === "locating" ? "Getting location..." : "📍 Capture My Location"}
        </button>
      )}

      {/* Error */}
      {errorMsg && <p style={styles.error}>{errorMsg}</p>}

      {/* Submit */}
      <button
        style={styles.btnPrimary}
        onClick={handleSubmit}
        disabled={["uploading", "submitting", "locating"].includes(status)}
      >
        {status === "uploading"  && "⏳ Uploading image..."}
        {status === "submitting" && "⏳ Submitting report..."}
        {!["uploading","submitting"].includes(status) && "Submit Report →"}
      </button>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────
const styles = {
  container:    { maxWidth: 640, margin: "0 auto", padding: "48px 40px 80px", background: "#f7f4f2", minHeight: "100vh" },
  smallHeading: { color: "#ef5b1f", fontSize: 11, letterSpacing: 2, fontWeight: 600, marginBottom: 8 },
  title:        { fontSize: 38, fontWeight: 800, color: "#111", marginBottom: 32 },
  label:        { fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 6, display: "block" },
  select:       { width: "100%", padding: "14px 16px", borderRadius: 10, border: "1px solid #ddd", background: "#fff", color: "#111", fontSize: 15, fontFamily: "Poppins, sans-serif" },
  textarea:     { width: "100%", padding: "14px 16px", borderRadius: 10, border: "1px solid #ddd", background: "#fff", color: "#111", fontSize: 15, resize: "vertical", fontFamily: "Poppins, sans-serif" },
  fileInput:    { color: "#888", fontSize: 14 },
  preview:      { width: "100%", borderRadius: 12, maxHeight: 220, objectFit: "cover", border: "1px solid #eee", marginTop: 8 },
  locationBox:  { padding: "14px 16px", borderRadius: 10, background: "#fff", border: "1px solid #ddd", fontSize: 13, color: "#555" },
  btnPrimary:   { width: "100%", padding: "16px", background: "#ef5b1f", color: "#fff", border: "none", borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: "pointer", marginTop: 8, fontFamily: "Poppins, sans-serif" },
  btnSecondary: { width: "100%", padding: "12px", background: "#fff", color: "#ef5b1f", border: "1px solid #ef5b1f", borderRadius: 10, fontSize: 14, cursor: "pointer", fontFamily: "Poppins, sans-serif" },
  error:        { color: "#dc2626", fontSize: 13, margin: 0 },
  successBox:   { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f7f4f2", color: "#111", textAlign: "center", padding: 32, gap: 12 },
  fieldGroup:   { display: "flex", flexDirection: "column", gap: 6 },
};