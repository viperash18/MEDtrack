import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV = {
  patient:   [{ to: "/book",       label: "Book Appointment" }, { to: "/my-appointments", label: "My Appointments" }],
  reception: [{ to: "/reception",  label: "Front Desk" }],
  doctor:    [{ to: "/doctor",     label: "My Queue" }],
  admin:     [{ to: "/admin",      label: "Dashboard" }, { to: "/admin/doctors", label: "Doctors" }, { to: "/admin/staff", label: "Staff" }],
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/login"); };
  const links = NAV[user?.role] || [];

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      <aside style={{ width: 220, background: "#0f172a", color: "#e2e8f0", display: "flex", flexDirection: "column", padding: "24px 0" }}>
        <div style={{ padding: "0 20px 24px", borderBottom: "1px solid #1e293b" }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: "#fff" }}>🏥 Hospital-Lite</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{user?.name}</div>
          <span style={{ fontSize: 11, background: "#1e40af", color: "#bfdbfe", padding: "2px 8px", borderRadius: 99, marginTop: 6, display: "inline-block" }}>
            {user?.role}
          </span>
        </div>
        <nav style={{ flex: 1, padding: "16px 12px" }}>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} style={({ isActive }) => ({
              display: "block", padding: "8px 12px", borderRadius: 6, marginBottom: 4,
              color: isActive ? "#fff" : "#94a3b8", background: isActive ? "#1e293b" : "transparent",
              textDecoration: "none", fontSize: 14, fontWeight: isActive ? 500 : 400,
            })}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: "16px 12px" }}>
          <button onClick={handleLogout} style={{
            width: "100%", padding: "8px 12px", background: "transparent", border: "1px solid #334155",
            color: "#94a3b8", borderRadius: 6, cursor: "pointer", fontSize: 14,
          }}>
            Sign out
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, padding: 32, background: "#f8fafc", overflowY: "auto" }}>
        {children}
      </main>
    </div>
  );
}
