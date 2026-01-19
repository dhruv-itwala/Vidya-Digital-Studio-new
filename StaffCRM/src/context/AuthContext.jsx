import { createContext, useContext, useEffect, useState } from "react";
import { getMyProfileAPI } from "../api/auth.api";
import { getAllUsersAPI } from "../api/admin.api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const fetchProfile = async () => {
    const res = await getMyProfileAPI();
    setUser(res.data.user || res.data);
    return res.data.user || res.data;
  };

  const fetchAllUsers = async () => {
    const res = await getAllUsersAPI();
    console.log(res.data.users, "all users");
    setAllEmployees(res.data.users || res.data);
  };

  useEffect(() => {
    const init = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const profile = await fetchProfile();
        await fetchAllUsers();
        if (["admin", "hr"].includes(profile.role)) {
          await fetchAllUsers();
        }
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [token]);

  const login = ({ token }) => {
    localStorage.setItem("token", token);
    setLoading(true);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setAllEmployees([]);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        allEmployees,
        loading,
        isAuthenticated: Boolean(user),
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
