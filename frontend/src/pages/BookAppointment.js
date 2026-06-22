import { useState, useEffect } from "react";
import API from "../api";

const STATUS_COLOR = { booked: "#dbeafe", "checked-in": "#fef9c3", "in-progress": "#dcfce7", completed: "#f0fdf4", cancelled: "#fef2f2" };
const STATUS_TEXT = { booked: "#1e40af", "checked-in": "#854d0e", "in-progress": "#166534", completed: "#14532d", cancelled: "#991b1b" };

export default function BookAppointment() {
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({ doctor_id: "", appt_date: "", appt_time: "", reason: "" });
  const [slots, setSlots] = useState([]);
  const [msg, setMsg] = useState(null);

  useEffect(() => { API.get("/patient/doctors").then(r => setDoctors(r.data.doctors)); }, []);

  useEffect(() => {
    if (form.doctor_id && form.appt_date) {
      API.get("/patient/slots", { params: { doctor_id: form.doctor_id, appt_date: form.appt_date } })
        .then(r => setSlots(r.data.slots));
    } else {
      setSlots([]);
    }
    setForm(f => ({ ...f, appt_time: "" }));
  }, [form.doctor_id, form.appt_date]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      await API.post("/patient/book", form);
      setMsg({ ok: true, text: "Appointment booked successfully!" });
      setForm(f => ({ ...f, appt_time: "", reason: "" }));
      // refresh slots
      API.get("/patient/slots", { params: { doctor_id: form.doctor_id, appt_date: form.appt_date } })
        .then(r => setSlots(r.data.slots));
    } catch (err) {
      setMsg({ ok: false, text: err.response?.data?.error || "Booking failed." });
    }
  };

  return (
    <div style={{ maxWidth: 520 }}>
      <h1 style={h1}>Book an Appointment</h1>

      {msg && (
        <div style={{ padding: "10px 14px", borderRadius: 6, marginBottom: 16, fontSize: 13,
          background: msg.ok ? "#f0fdf4" : "#fef2f2", color: msg.ok ? "#166534" : "#991b1b",
          border: `1px solid ${msg.ok ? "#bbf7d0" : "#fecaca"}` }}>
          {msg.text}
        </div>
      )}

      <form onSubmit={submit} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={lbl}>Doctor</label>
          <select value={form.doctor_id} onChange={set("doctor_id")} required style={sel}>
            <option value="">Select a doctor</option>
            {doctors.map(d => (
              <option key={d.id} value={d.id}>{d.name} — {d.specialization}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={lbl}>Date</label>
          <input type="date" value={form.appt_date} onChange={set("appt_date")} required style={inp}
            min={new Date().toISOString().split("T")[0]} />
        </div>

        {slots.length > 0 && (
          <div>
            <label style={lbl}>Available Slots</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
              {slots.map(s => (
                <button type="button" key={s} onClick={() => setForm(f => ({ ...f, appt_time: s }))}
                  style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid",
                    borderColor: form.appt_time === s ? "#1e40af" : "#e2e8f0",
                    background: form.appt_time === s ? "#eff6ff" : "#fff",
                    color: form.appt_time === s ? "#1e40af" : "#334155",
                    cursor: "pointer", fontSize: 13, fontWeight: form.appt_time === s ? 500 : 400 }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {form.doctor_id && form.appt_date && slots.length === 0 && (
          <div style={{ fontSize: 13, color: "#64748b", padding: "10px", background: "#f8fafc", borderRadius: 6 }}>
            No available slots for this day.
          </div>
        )}

        <div>
          <label style={lbl}>Reason (optional)</label>
          <textarea value={form.reason} onChange={set("reason")} rows={2}
            placeholder="Briefly describe your symptoms..." style={{ ...inp, resize: "vertical" }} />
        </div>

        <button type="submit" disabled={!form.appt_time} style={{
          ...btn, opacity: form.appt_time ? 1 : 0.5, cursor: form.appt_time ? "pointer" : "not-allowed"
        }}>
          Book Appointment
        </button>
      </form>
    </div>
  );
}

const h1 = { fontSize: 20, fontWeight: 600, marginBottom: 20, color: "#0f172a" };
const lbl = { display: "block", fontSize: 12, fontWeight: 500, color: "#64748b", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" };
const inp = { width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 14, boxSizing: "border-box", fontFamily: "inherit" };
const sel = { ...inp };
const btn = { padding: "10px", background: "#1e40af", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 500 };
