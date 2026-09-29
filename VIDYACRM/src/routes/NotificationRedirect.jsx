import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { roleRedirect } from "./roleRedirect";

export default function NotificationRedirect({ target }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  const role = user.role;
  const isAdmin = role === "admin" || role === "administrative";
  const isHr = role === "hr";

  switch (target) {
    case "helpdesk":
      if (isAdmin) return <Navigate to="/admin/helpdesk" replace />;
      if (isHr) return <Navigate to="/hr/helpdesk" replace />;
      return <Navigate to="/employee/helpdesk" replace />;

    case "hr-helpdesk":
      if (isAdmin) return <Navigate to="/admin/hr-helpdesk" replace />;
      if (isHr) return <Navigate to="/hr/hr-helpdesk" replace />;
      return <Navigate to="/employee/helpdesk" replace />;

    case "leaves":
      if (isAdmin) return <Navigate to="/admin/leaves" replace />;
      if (isHr) return <Navigate to="/hr/leaves" replace />;
      return <Navigate to="/employee/leaves" replace />;

    case "leave-approval":
      if (isAdmin) return <Navigate to="/admin/leave-approval" replace />;
      if (isHr) return <Navigate to="/hr/hrLeaveApproval" replace />;
      return <Navigate to="/employee/leaves" replace />;

    case "reports":
      if (isAdmin) return <Navigate to="/admin/reports" replace />;
      if (isHr) return <Navigate to="/hr/hrReports" replace />;
      return <Navigate to="/employee/reports" replace />;

    case "tasks":
      if (isAdmin) return <Navigate to="/admin/tasks" replace />;
      if (isHr) return <Navigate to="/hr/tasks" replace />;
      return <Navigate to="/employee/tasks" replace />;

    case "dashboard":
    default:
      return <Navigate to={roleRedirect(role)} replace />;
  }
}
