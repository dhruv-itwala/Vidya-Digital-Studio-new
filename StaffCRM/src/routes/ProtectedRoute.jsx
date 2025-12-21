import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <div>Loading...</div>; // wait for auth check

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // role is already normalized to lowercase in AuthProvider
  const userRole = user?.role;
  const allowed = allowedRoles?.map((role) => role.toLowerCase());

  if (allowedRoles) {
    const allowed = allowedRoles.map((r) => r.toLowerCase());
    if (!allowed.includes(userRole)) {
      if (userRole === "admin")
        return <Navigate to="/admin/dashboard" replace />;
      if (userRole === "employee" || userRole === "hr")
        return <Navigate to="/employee/dashboard" replace />;
      return <Navigate to="/login" replace />;
    }
  }

  if (allowed && !allowed.includes(userRole)) {
    // redirect unauthorized roles
    if (userRole === "admin") return <Navigate to="/admin/dashboard" replace />;
    if (userRole === "employee" || userRole === "hr")
      return <Navigate to="/employee/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
}
