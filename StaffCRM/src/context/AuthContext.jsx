import { createContext, useContext, useEffect, useState } from "react";
import { getMyProfileAPI } from "../api/auth.api";
import { getAllUsersAPI, getEmployeeBirthdaysAPI } from "../api/admin.api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [allEmployees, setAllEmployees] = useState([]);
  const [birthdays, setBirthdays] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const fetchProfile = async () => {
    const res = await getMyProfileAPI();
    setUser(res.data.user || res.data);
    return res.data.user || res.data;
  };

  const fetchAllUsers = async () => {
    const res = await getAllUsersAPI();
    setAllEmployees(res.data.users || res.data);
  };

  const fetchBirthdays = async () => {
    try {
      const res = await getEmployeeBirthdaysAPI();
      const list = Array.isArray(res?.data?.birthdays)
        ? res.data.birthdays
        : [];
      setBirthdays(list);
    } catch (err) {
      console.error("Failed to fetch birthdays", err);
      setBirthdays([]);
    }
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
        await fetchBirthdays();
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
        birthdays,
        loading,
        isAuthenticated: Boolean(user),
        role: user?.role,
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
