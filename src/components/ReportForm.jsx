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
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus("idle");
      },
      () => {
        setErrorMsg("Location access denied. Please allow it and try again.");
        setStatus("error");
      }
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
  container: {
    maxWidth: 480,
    margin: "0 auto",
    padding: "24px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    background: "#111",
    minHeight: "100vh",
    color: "#fff"
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 8,
    color: "#fff"
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: "#aaa",
    marginBottom: 2
  },
  select: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #333",
    background: "#1a1a1a",
    color: "#fff",
    fontSize: 15
  },
  textarea: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #333",
    background: "#1a1a1a",
    color: "#fff",
    fontSize: 15,
    resize: "vertical"
  },
  fileInput: {
    color: "#aaa",
    fontSize: 14
  },
  preview: {
    width: "100%",
    borderRadius: 10,
    maxHeight: 200,
    objectFit: "cover",
    border: "1px solid #333"
  },
  locationBox: {
    padding: "10px 12px",
    borderRadius: 8,
    background: "#1a1a1a",
    border: "1px solid #333",
    fontSize: 13,
    color: "#ccc"
  },
  btnPrimary: {
    padding: "13px 20px",
    background: "#6d28d9",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 8
  },
  btnSecondary: {
    padding: "10px 16px",
    background: "#1a1a1a",
    color: "#a78bfa",
    border: "1px solid #6d28d9",
    borderRadius: 8,
    fontSize: 14,
    cursor: "pointer"
  },
  error: {
    color: "#f87171",
    fontSize: 13,
    margin: 0
  },
  successBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    background: "#111",
    color: "#fff",
    textAlign: "center",
    padding: 32,
    gap: 8
  }
};