import { useState, useEffect } from "react";
import API from "../api";

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({ name: "", specialization: "", room: "", work_start: "09:00", work_end: "17:00", slot_minutes: 30 });
  const [msg, setMsg] = useState(null);

  const load = () => API.get("/admin/doctors").then(r => setDoctors(r.data.doctors));
  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      await API.post("/admin/doctors", form);
      setMsg({ ok: true, text: `Added ${form.name}.` });
      setForm({ name: "", specialization: "", room: "", work_start: "09:00", work_end: "17:00", slot_minutes: 30 });
      load();
    } catch (err) {
      setMsg({ ok: false, text: err.response?.data?.error || "Failed." });
    }
  };

  const toggle = async (id) => { await API.post(`/admin/doctors/${id}/toggle`); load(); };

  return (
    <div style={{ maxWidth: 900, display: "grid", gridTemplateColumns: "1fr 300px", gap: 28 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "#0f172a", marginBottom: 16 }}>Doctors</h1>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Name", "Specialization", "Room", "Hours", "Status", ""].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 500, color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {doctors.map(d => (
                <tr key={d.id} style={{ borderBottom: "1px solid #f1f5f9", opacity: d.active ? 1 : 0.5 }}>
                  <td style={{ padding: "12px 14px", fontWeight: 500 }}>{d.name}</td>
                  <td style={{ padding: "12px 14px", color: "#64748b" }}>{d.specialization}</td>
                  <td style={{ padding: "12px 14px" }}>{d.room || "—"}</td>
                  <td style={{ padding: "12px 14px", color: "#64748b" }}>{d.work_start}–{d.work_end}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ background: d.active ? "#dcfce7" : "#f1f5f9", color: d.active ? "#166534" : "#64748b", padding: "2px 8px", borderRadius: 99, fontSize: 11 }}>
                      {d.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <button onClick={() => toggle(d.id)} style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: 5, padding: "4px 8px", fontSize: 11, cursor: "pointer", color: "#64748b" }}>
                      {d.active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", marginBottom: 14 }}>Add Doctor</h2>
        {msg && (
          <div style={{ padding: "8px 12px", borderRadius: 6, marginBottom: 12, fontSize: 13,
            background: msg.ok ? "#f0fdf4" : "#fef2f2", color: msg.ok ? "#166534" : "#991b1b" }}>
            {msg.text}
          </div>
        )}
        <form onSubmit={submit} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
          <input placeholder="Full name *" value={form.name} onChange={set("name")} required style={inp} />
          <input placeholder="Specialization *" value={form.specialization} onChange={set("specialization")} required style={inp} />
          <input placeholder="Room" value={form.room} onChange={set("room")} style={inp} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div><label style={lbl}>Start</label><input type="time" value={form.work_start} onChange={set("work_start")} style={inp} /></div>
            <div><label style={lbl}>End</label><input type="time" value={form.work_end} onChange={set("work_end")} style={inp} /></div>
          </div>
          <div>
            <label style={lbl}>Slot (minutes)</label>
            <select value={form.slot_minutes} onChange={set("slot_minutes")} style={inp}>
              {[15, 20, 30, 45, 60].map(m => <option key={m} value={m}>{m} min</option>)}
            </select>
          </div>
          <button type="submit" style={{ padding: "9px", background: "#1e40af", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
            Add Doctor
          </button>
        </form>
      </div>
    </div>
  );
}

const inp = { padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, fontFamily: "inherit", width: "100%", boxSizing: "border-box" };
const lbl = { display: "block", fontSize: 11, color: "#64748b", marginBottom: 3 };
