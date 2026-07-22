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
    const userData = res.data.user || res.data;
    setUser(userData);
    return userData;
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

  const updateUserPhoto = (photo) => {
    setUser((prev) => ({
      ...prev,
      profilePicture: photo,
    }));

    // also update employee list if present
    setAllEmployees((prev) =>
      prev.map((emp) =>
        emp._id === user?._id ? { ...emp, profilePicture: photo } : emp,
      ),
    );
  };

  useEffect(() => {
    const init = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        await fetchProfile();
        await fetchAllUsers();
        await fetchBirthdays();
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

  const refetchProfile = async () => {
    return await fetchProfile();
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
        refetchProfile,
        updateUserPhoto,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
