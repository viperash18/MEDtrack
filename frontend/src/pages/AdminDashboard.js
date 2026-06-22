import { useState, useEffect } from "react";
import API from "../api";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => { API.get("/admin/stats").then(r => setStats(r.data)); }, []);

  if (!stats) return <div style={{ color: "#64748b" }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 800 }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, color: "#0f172a", marginBottom: 20 }}>Dashboard</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
        {[
          ["Today's Appointments", stats.appts_today,    "#dbeafe", "#1e40af"],
          ["Completed Today",      stats.completed_today, "#dcfce7", "#166534"],
          ["Active Doctors",       stats.active_doctors,  "#fef9c3", "#854d0e"],
          ["Total Patients",       stats.total_patients,  "#f0f0ff", "#4338ca"],
        ].map(([label, value, bg, color]) => (
          <div key={label} style={{ background: bg, borderRadius: 10, padding: "16px 20px" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: 12, color, opacity: 0.75, marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 14, fontWeight: 500, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
        Doctors Today
      </h2>
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["Doctor", "Specialization", "Booked", "Completed"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontWeight: 500, color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stats.by_doctor.map((d, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "12px 16px", fontWeight: 500 }}>{d.name}</td>
                <td style={{ padding: "12px 16px", color: "#64748b" }}>{d.specialization}</td>
                <td style={{ padding: "12px 16px" }}>{d.booked}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: 99, fontSize: 12 }}>
                    {d.completed || 0}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
