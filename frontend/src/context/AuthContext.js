import { createContext, useContext, useState, useEffect } from "react";
import API, { socket } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      API.get("/auth/me")
        .then((r) => { setUser(r.data); socket.connect(); })
        .catch(() => localStorage.removeItem("token"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const r = await API.post("/auth/login", { email, password });
    localStorage.setItem("token", r.data.token);
    setUser(r.data.user);
    socket.connect();
    return r.data.user;
  };

  const register = async (data) => {
    const r = await API.post("/auth/register", data);
    localStorage.setItem("token", r.data.token);
    setUser(r.data.user);
    socket.connect();
    return r.data.user;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    socket.disconnect();
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
