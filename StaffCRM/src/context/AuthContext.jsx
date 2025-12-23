import { createContext, useContext, useEffect, useState } from "react";
import { getMyProfileAPI } from "../api/auth.api";
import { getAllUsersAPI } from "../api/admin.api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [allEmployees, setAllEmployees] = useState([]);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await getMyProfileAPI();
      setUser(res.data);
      return res.data;
    } catch {
      logout();
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await getAllUsersAPI();
      setAllEmployees(res.data);
    } catch {
      setAllEmployees([]);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const profile = await fetchProfile();

      // 🔐 Only HR/Admin should load employees
      if (profile && (profile.role === "admin" || profile.role === "hr")) {
        await fetchAllUsers();
      }

      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = ({ token, user }) => {
    localStorage.setItem("token", token);
    setToken(token);
    setUser(user);
    setLoading(true);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setAllEmployees([]);
    setToken(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        allEmployees,
        loading,
        isAuthenticated: Boolean(token),
        isAdmin: user?.role === "admin",
        isHR: user?.role === "hr",
        login,
        logout,
        refetchUsers: fetchAllUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
