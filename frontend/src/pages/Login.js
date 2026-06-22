import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const user = mode === "login"
        ? await login(form.email, form.password)
        : await register(form);
      const dest = { patient: "/book", reception: "/reception", doctor: "/doctor", admin: "/admin" };
      navigate(dest[user.role] || "/");
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong.");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
      <div style={{ width: 360, background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "32px 28px" }}>
        <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>🏥 Hospital-Lite</div>
        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 24 }}>
          {mode === "login" ? "Sign in to your account" : "Create a patient account"}
        </div>

        {error && (
          <div style={{ background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", borderRadius: 6, padding: "10px 12px", marginBottom: 16, fontSize: 13 }}>
            {error}
          </div>
        )}

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mode === "register" && (
            <>
              <input placeholder="Full name" value={form.name} onChange={set("name")} required style={inp} />
              <input placeholder="Phone number" value={form.phone} onChange={set("phone")} style={inp} />
            </>
          )}
          <input type="email" placeholder="Email" value={form.email} onChange={set("email")} required style={inp} />
          <input type="password" placeholder="Password (6+ characters)" value={form.password} onChange={set("password")} required style={inp} />
          <button type="submit" style={btn}>
            {mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#64748b" }}>
          {mode === "login" ? (
            <>No account? <button onClick={() => setMode("register")} style={link}>Register</button></>
          ) : (
            <>Already registered? <button onClick={() => setMode("login")} style={link}>Sign in</button></>
          )}
        </div>

        <div style={{ marginTop: 20, padding: "12px", background: "#f8fafc", borderRadius: 6, fontSize: 11, color: "#64748b" }}>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>Demo logins</div>
          <div>admin@hospital.com / admin123</div>
          <div>reception@hospital.com / reception123</div>
          <div>asha.mehta@hospital.com / doctor123</div>
          <div>patient@hospital.com / patient123</div>
        </div>
      </div>
    </div>
  );
}

const inp = { padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 14, outline: "none", fontFamily: "inherit" };
const btn = { padding: "10px", background: "#1e40af", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: "pointer" };
const link = { background: "none", border: "none", color: "#1e40af", cursor: "pointer", fontSize: 13, padding: 0 };
