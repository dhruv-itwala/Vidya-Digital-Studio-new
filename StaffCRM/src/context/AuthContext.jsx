import { createContext, useContext, useEffect, useState } from "react";
import { getAllUsersAPI, getMyProfileAPI } from "../api/auth.api";

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
    } catch (err) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const getAllUsers = async () => {
    try {
      const res = await getAllUsersAPI();
      setAllEmployees(res.data);
    } catch (err) {
      console.error("Failed to fetch users", err);
      return [];
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile();
      getAllUsers();
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = ({ token }) => {
    localStorage.setItem("token", token);
    setToken(token);
    setLoading(true);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        allEmployees,
        token,
        loading,
        isAuthenticated: !!token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
