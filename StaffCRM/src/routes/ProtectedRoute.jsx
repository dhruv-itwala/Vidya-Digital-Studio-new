import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { roleRedirect } from "./roleRedirect";
import Loader from "../components/Loader/Loader";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { loading, isAuthenticated, user } = useAuth();
  if (loading) return <Loader />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={roleRedirect(user.role)} replace />;
  }

  return children;
}
