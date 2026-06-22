import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import BookAppointment from "./pages/BookAppointment";
import MyAppointments from "./pages/MyAppointments";
import DoctorQueue from "./pages/DoctorQueue";
import Reception from "./pages/Reception";
import AdminDashboard from "./pages/AdminDashboard";
import AdminDoctors from "./pages/AdminDoctors";
import AdminStaff from "./pages/AdminStaff";

const ROLE_HOME = { patient: "/book", reception: "/reception", doctor: "/doctor", admin: "/admin" };

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={ROLE_HOME[user.role] || "/"} replace />;
  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return null;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={ROLE_HOME[user.role] || "/"} /> : <Login />} />

      <Route path="/book" element={<ProtectedRoute roles={["patient"]}><BookAppointment /></ProtectedRoute>} />
      <Route path="/my-appointments" element={<ProtectedRoute roles={["patient"]}><MyAppointments /></ProtectedRoute>} />

      <Route path="/doctor" element={<ProtectedRoute roles={["doctor"]}><DoctorQueue /></ProtectedRoute>} />

      <Route path="/reception" element={<ProtectedRoute roles={["reception", "admin"]}><Reception /></ProtectedRoute>} />

      <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/doctors" element={<ProtectedRoute roles={["admin"]}><AdminDoctors /></ProtectedRoute>} />
      <Route path="/admin/staff" element={<ProtectedRoute roles={["admin"]}><AdminStaff /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to={user ? ROLE_HOME[user.role] || "/" : "/login"} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
