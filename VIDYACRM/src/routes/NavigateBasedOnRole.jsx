import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { roleRedirect } from "./roleRedirect";

export default function NavigateBasedOnRole() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  return <Navigate to={roleRedirect(user.role)} replace />;
}
