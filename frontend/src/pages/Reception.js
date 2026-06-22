import { useState, useEffect, useCallback } from "react";
import API, { socket } from "../api";

const STATUS_COLORS = {
  booked:        { bg: "#dbeafe", text: "#1e40af" },
  "checked-in":  { bg: "#fef9c3", text: "#854d0e" },
  "in-progress": { bg: "#dcfce7", text: "#166534" },
  completed:     { bg: "#f0fdf4", text: "#14532d" },
};

export default function Reception() {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors]           = useState([]);
  const [slots, setSlots]               = useState([]);
  const [day, setDay]                   = useState(new Date().toISOString().split("T")[0]);
  const [form, setForm]                 = useState({ name: "", phone: "", age: "", gender: "", doctor_id: "", appt_date: "", appt_time: "", reason: "" });
  const [msg, setMsg]                   = useState(null);

  const load = useCallback(() => {
    API.get("/reception/schedule", { params: { day } }).then(r => setAppointments(r.data.appointments));
  }, [day]);

  useEffect(() => {
    API.get("/reception/doctors").then(r => setDoctors(r.data.doctors));
  }, []);

  useEffect(() => { load(); socket.on("appointment_update", load); return () => socket.off("appointment_update", load); }, [load]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    if (form.doctor_id && form.appt_date) {
      API.get("/reception/slots", { params: { doctor_id: form.doctor_id, appt_date: form.appt_date } })
        .then(r => setSlots(r.data.slots));
    } else {
      setSlots([]);
    }
    setForm(f => ({ ...f, appt_time: "" }));
  }, [form.doctor_id, form.appt_date]);

  const book = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      await API.post("/reception/book", form);
      setMsg({ ok: true, text: "Walk-in booked." });
      setForm({ name: "", phone: "", age: "", gender: "", doctor_id: "", appt_date: "", appt_time: "", reason: "" });
    } catch (err) {
      setMsg({ ok: false, text: err.response?.data?.error || "Failed." });
    }
  };

  const checkin = async (id) => { await API.post(`/reception/checkin/${id}`); load(); };
  const cancel  = async (id) => { if (window.confirm("Cancel?")) { await API.post(`/reception/cancel/${id}`); load(); } };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, maxWidth: 1100 }}>

      {/* Left: schedule board */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "#0f172a", margin: 0 }}>Front Desk</h1>
          <input type="date" value={day} onChange={e => setDay(e.target.value)}
            style={{ padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13 }} />
        </div>

        {appointments.length === 0 && (
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 24, color: "#64748b", fontSize: 14 }}>
            No appointments for this day.
          </div>
        )}

        {appointments.map(a => {
          const colors = STATUS_COLORS[a.status] || STATUS_COLORS.booked;
          return (
            <div key={a.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 18px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{a.patient_name}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{a.appt_time} · Dr. {a.doctor_name} · {a.phone}</div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ background: colors.bg, color: colors.text, padding: "3px 9px", borderRadius: 99, fontSize: 11, fontWeight: 500 }}>
                  {a.status}
                </span>
                {a.status === "booked" && (
                  <button onClick={() => checkin(a.id)} style={{ padding: "5px 10px", background: "#1e40af", color: "#fff", border: "none", borderRadius: 5, fontSize: 12, cursor: "pointer" }}>
                    Check In
                  </button>
                )}
                {!["completed", "cancelled"].includes(a.status) && (
                  <button onClick={() => cancel(a.id)} style={{ padding: "5px 10px", background: "#fff", color: "#991b1b", border: "1px solid #fecaca", borderRadius: 5, fontSize: 12, cursor: "pointer" }}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Right: walk-in booking form */}
      <div>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", marginBottom: 14 }}>Register Walk-in</h2>

        {msg && (
          <div style={{ padding: "8px 12px", borderRadius: 6, marginBottom: 12, fontSize: 13,
            background: msg.ok ? "#f0fdf4" : "#fef2f2", color: msg.ok ? "#166534" : "#991b1b",
            border: `1px solid ${msg.ok ? "#bbf7d0" : "#fecaca"}` }}>
            {msg.text}
          </div>
        )}

        <form onSubmit={book} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
          <input placeholder="Patient name *" value={form.name} onChange={set("name")} required style={inp} />
          <input placeholder="Phone *" value={form.phone} onChange={set("phone")} required style={inp} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <input placeholder="Age" value={form.age} onChange={set("age")} type="number" style={inp} />
            <select value={form.gender} onChange={set("gender")} style={inp}>
              <option value="">Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <select value={form.doctor_id} onChange={set("doctor_id")} required style={inp}>
            <option value="">Select doctor *</option>
            {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <input type="date" value={form.appt_date} onChange={set("appt_date")} required style={inp}
            min={new Date().toISOString().split("T")[0]} />
          {slots.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {slots.map(s => (
                <button type="button" key={s} onClick={() => setForm(f => ({ ...f, appt_time: s }))}
                  style={{ padding: "5px 10px", borderRadius: 5, border: "1px solid",
                    borderColor: form.appt_time === s ? "#1e40af" : "#e2e8f0",
                    background: form.appt_time === s ? "#eff6ff" : "#fff",
                    color: form.appt_time === s ? "#1e40af" : "#334155",
                    fontSize: 12, cursor: "pointer" }}>
                  {s}
                </button>
              ))}
            </div>
          )}
          <input placeholder="Reason" value={form.reason} onChange={set("reason")} style={inp} />
          <button type="submit" disabled={!form.appt_time} style={{
            padding: "9px", background: "#1e40af", color: "#fff", border: "none", borderRadius: 6,
            fontSize: 13, fontWeight: 500, cursor: form.appt_time ? "pointer" : "not-allowed",
            opacity: form.appt_time ? 1 : 0.5
          }}>
            Book Walk-in
          </button>
        </form>
      </div>
    </div>
  );
}

const inp = { padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, fontFamily: "inherit", width: "100%", boxSizing: "border-box" };
