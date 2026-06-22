import { useState, useEffect, useCallback } from "react";
import API, { socket } from "../api";

const STATUS_COLORS = {
  booked:        { bg: "#dbeafe", text: "#1e40af" },
  "checked-in":  { bg: "#fef9c3", text: "#854d0e" },
  "in-progress": { bg: "#dcfce7", text: "#166534" },
  completed:     { bg: "#f0fdf4", text: "#14532d" },
};

const NEXT_LABEL = { booked: "Mark Checked-in", "checked-in": "Start Visit", "in-progress": "Complete" };

export default function DoctorQueue() {
  const [appointments, setAppointments] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState({});

  const load = useCallback(() => {
    API.get("/doctor/queue", { params: { date } }).then(r => setAppointments(r.data.appointments));
  }, [date]);

  useEffect(() => { load(); socket.on("appointment_update", load); return () => socket.off("appointment_update", load); }, [load]);

  const advance = async (id) => {
    const appt = appointments.find(a => a.id === id);
    const note = appt?.status === "in-progress" ? notes[id] || "" : "";
    await API.post(`/doctor/advance/${id}`, { note });
    load();
  };

  const cancel = async (id) => {
    if (!window.confirm("Cancel this appointment?")) return;
    await API.post(`/doctor/cancel/${id}`);
    load();
  };

  const counts = {
    waiting: appointments.filter(a => a.status === "booked").length,
    here:    appointments.filter(a => a.status === "checked-in").length,
    active:  appointments.filter(a => a.status === "in-progress").length,
    done:    appointments.filter(a => a.status === "completed").length,
  };

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "#0f172a", margin: 0 }}>My Queue</h1>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          style={{ padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13 }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 24 }}>
        {[["Waiting", counts.waiting, "#dbeafe", "#1e40af"], ["Checked In", counts.here, "#fef9c3", "#854d0e"],
          ["In Progress", counts.active, "#dcfce7", "#166534"], ["Completed", counts.done, "#f0fdf4", "#14532d"]
        ].map(([label, n, bg, color]) => (
          <div key={label} style={{ background: bg, borderRadius: 8, padding: "12px 16px" }}>
            <div style={{ fontSize: 22, fontWeight: 600, color }}>{n}</div>
            <div style={{ fontSize: 12, color, opacity: 0.8 }}>{label}</div>
          </div>
        ))}
      </div>

      {appointments.length === 0 && (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 32, textAlign: "center", color: "#64748b" }}>
          No appointments for this day.
        </div>
      )}

      {appointments.map(a => {
        const colors = STATUS_COLORS[a.status] || STATUS_COLORS.booked;
        return (
          <div key={a.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "16px 20px", marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: 15 }}>{a.patient_name}</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>
                  {a.appt_time} · {a.age ? `${a.age}y` : "—"} · {a.gender || "—"} · {a.phone}
                </div>
                {a.reason && <div style={{ fontSize: 13, color: "#334155", marginTop: 4 }}>"{a.reason}"</div>}
              </div>
              <span style={{ background: colors.bg, color: colors.text, padding: "4px 10px", borderRadius: 99, fontSize: 12, fontWeight: 500 }}>
                {a.status}
              </span>
            </div>

            {a.status === "in-progress" && (
              <textarea
                placeholder="Visit note (required to complete)..."
                value={notes[a.id] || ""}
                onChange={e => setNotes(n => ({ ...n, [a.id]: e.target.value }))}
                rows={2}
                style={{ marginTop: 10, width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }}
              />
            )}

            {a.status === "completed" && a.note && (
              <div style={{ marginTop: 8, fontSize: 13, color: "#64748b" }}>Note: {a.note}</div>
            )}

            {NEXT_LABEL[a.status] && (
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button onClick={() => advance(a.id)} style={advBtn}>
                  {NEXT_LABEL[a.status]}
                </button>
                {a.status !== "in-progress" && (
                  <button onClick={() => cancel(a.id)} style={cancelBtn}>Cancel</button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const advBtn = { padding: "7px 14px", background: "#1e40af", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer" };
const cancelBtn = { padding: "7px 14px", background: "#fff", color: "#991b1b", border: "1px solid #fecaca", borderRadius: 6, fontSize: 13, cursor: "pointer" };
