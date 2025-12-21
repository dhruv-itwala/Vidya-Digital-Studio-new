import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function NavigateBasedOnRole() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  const role = user.role.toLowerCase();

  if (role === "admin") return <Navigate to="/admin/dashboard" replace />;
  if (role === "employee" || role === "hr")
    return <Navigate to="/employee/dashboard" replace />;

  return <Navigate to="/login" replace />; // fallback just in case
}
