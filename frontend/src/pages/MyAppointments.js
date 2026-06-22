import { useState, useEffect, useCallback } from "react";
import API, { socket } from "../api";

const STATUS_COLORS = {
  booked:       { bg: "#dbeafe", text: "#1e40af" },
  "checked-in": { bg: "#fef9c3", text: "#854d0e" },
  "in-progress":{ bg: "#dcfce7", text: "#166534" },
  completed:    { bg: "#f0fdf4", text: "#14532d" },
  cancelled:    { bg: "#fef2f2", text: "#991b1b" },
};

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([]);

  const load = useCallback(() => {
    API.get("/patient/appointments").then(r => setAppointments(r.data.appointments));
  }, []);

  useEffect(() => {
    load();
    socket.on("appointment_update", load);
    return () => socket.off("appointment_update", load);
  }, [load]);

  const active = appointments.filter(a => !["completed", "cancelled"].includes(a.status));
  const past   = appointments.filter(a =>  ["completed", "cancelled"].includes(a.status));

  return (
    <div style={{ maxWidth: 680 }}>
      <h1 style={h1}>My Appointments</h1>

      {active.length > 0 && (
        <>
          <h2 style={h2}>Active</h2>
          {active.map(a => <Card key={a.id} appt={a} />)}
        </>
      )}

      {past.length > 0 && (
        <>
          <h2 style={{ ...h2, marginTop: 28 }}>Past</h2>
          {past.map(a => <Card key={a.id} appt={a} />)}
        </>
      )}

      {appointments.length === 0 && (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 32, textAlign: "center", color: "#64748b" }}>
          No appointments yet. <a href="/book" style={{ color: "#1e40af" }}>Book one now →</a>
        </div>
      )}
    </div>
  );
}

function Card({ appt }) {
  const colors = STATUS_COLORS[appt.status] || STATUS_COLORS.booked;
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "16px 20px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <div style={{ fontWeight: 500, fontSize: 15, color: "#0f172a" }}>Dr. {appt.doctor_name}</div>
        <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{appt.specialization} · Room {appt.room || "—"}</div>
        <div style={{ fontSize: 13, color: "#334155", marginTop: 6 }}>{appt.appt_date} at {appt.appt_time}</div>
        {appt.reason && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{appt.reason}</div>}
        {appt.note && (
          <div style={{ marginTop: 10, padding: "8px 10px", background: "#f0fdf4", borderRadius: 6, fontSize: 13, color: "#166534" }}>
            <strong>Doctor's note:</strong> {appt.note}
          </div>
        )}
      </div>
      <span style={{ background: colors.bg, color: colors.text, padding: "4px 10px", borderRadius: 99, fontSize: 12, fontWeight: 500, whiteSpace: "nowrap" }}>
        {appt.status}
      </span>
    </div>
  );
}

const h1 = { fontSize: 20, fontWeight: 600, marginBottom: 20, color: "#0f172a" };
const h2 = { fontSize: 14, fontWeight: 500, color: "#64748b", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" };
