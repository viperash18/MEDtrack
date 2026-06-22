import { useState, useEffect } from "react";
import API from "../api";

export default function AdminStaff() {
  const [data, setData] = useState({ users: [], free_doctors: [] });
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "reception", doctor_id: "" });
  const [msg, setMsg] = useState(null);

  const load = () => API.get("/admin/staff").then(r => setData(r.data));
  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      await API.post("/admin/staff", form);
      setMsg({ ok: true, text: `Created account for ${form.name}.` });
      setForm({ name: "", email: "", password: "", role: "reception", doctor_id: "" });
      load();
    } catch (err) {
      setMsg({ ok: false, text: err.response?.data?.error || "Failed." });
    }
  };

  const ROLE_COLORS = { admin: ["#f0f0ff", "#4338ca"], reception: ["#dbeafe", "#1e40af"], doctor: ["#dcfce7", "#166534"] };

  return (
    <div style={{ maxWidth: 900, display: "grid", gridTemplateColumns: "1fr 300px", gap: 28 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "#0f172a", marginBottom: 16 }}>Staff Accounts</h1>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Name", "Email", "Role", "Doctor Profile"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 500, color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.users.map(u => {
                const [bg, color] = ROLE_COLORS[u.role] || ["#f1f5f9", "#64748b"];
                return (
                  <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 14px", fontWeight: 500 }}>{u.name}</td>
                    <td style={{ padding: "12px 14px", color: "#64748b" }}>{u.email}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ background: bg, color, padding: "2px 8px", borderRadius: 99, fontSize: 11 }}>{u.role}</span>
                    </td>
                    <td style={{ padding: "12px 14px", color: "#64748b" }}>{u.doctor_name || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", marginBottom: 14 }}>Create Staff Account</h2>
        {msg && (
          <div style={{ padding: "8px 12px", borderRadius: 6, marginBottom: 12, fontSize: 13,
            background: msg.ok ? "#f0fdf4" : "#fef2f2", color: msg.ok ? "#166534" : "#991b1b" }}>
            {msg.text}
          </div>
        )}
        <form onSubmit={submit} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
          <input placeholder="Full name *" value={form.name} onChange={set("name")} required style={inp} />
          <input type="email" placeholder="Email *" value={form.email} onChange={set("email")} required style={inp} />
          <input type="password" placeholder="Password (6+ chars) *" value={form.password} onChange={set("password")} required style={inp} />
          <select value={form.role} onChange={set("role")} style={inp}>
            <option value="reception">Receptionist</option>
            <option value="doctor">Doctor</option>
            <option value="admin">Admin</option>
          </select>
          {form.role === "doctor" && (
            <select value={form.doctor_id} onChange={set("doctor_id")} required style={inp}>
              <option value="">Link to doctor profile *</option>
              {data.free_doctors.map(d => <option key={d.id} value={d.id}>{d.name} — {d.specialization}</option>)}
            </select>
          )}
          <button type="submit" style={{ padding: "9px", background: "#1e40af", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
}

const inp = { padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, fontFamily: "inherit", width: "100%", boxSizing: "border-box" };
