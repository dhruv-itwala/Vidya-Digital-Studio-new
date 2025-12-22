import { createContext, useContext, useEffect, useState } from "react";
import { getMyProfileAPI, getAllUsersAPI } from "../api/auth.api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [allEmployees, setAllEmployees] = useState([]);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await getMyProfileAPI();
      const normalizedUser = {
        ...res.data,
        role: res.data.role.toLowerCase(),
      };
      setUser(normalizedUser);
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
    } catch {
      setAllEmployees([]);
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

  const login = ({ token, user }) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setToken(token);
    setUser(user);
    setLoading(true);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
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
