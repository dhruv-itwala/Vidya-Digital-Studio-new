import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Auth/Login";
import { useAuth } from "./context/AuthContext";
import EmployeeLayout from "./layouts/EmployeeLayout";
import Dashboard from "./pages/Employee/Dashboard";
import Profile from "./pages/Employee/Profile";

import "./App.css";
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminEmployees from "./pages/Admin/AdminEmployees";
import AdminTasks from "./pages/Admin/AdminTasks";
import AdminAttendance from "./pages/Admin/AdminAttendance";
import AdminReports from "./pages/Admin/AdminReports";

export default function App() {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <div>Loading...</div>;

  return (
    <Routes>
      {/* ROOT */}
      <Route
        path="/"
        element={
          !isAuthenticated ? (
            <Navigate to="/login" replace />
          ) : user?.role === "employee" ? (
            <Navigate to="/employee/dashboard" replace />
          ) : (
            <Navigate to="/admin/attendance" replace />
          )
        }
      />

      {/* LOGIN */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />

      {/* ADMIN */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="employees" element={<AdminEmployees />} />
        <Route path="tasks" element={<AdminTasks />} />
        <Route path="attendance" element={<AdminAttendance />} />
        <Route path="reports" element={<AdminReports />} />
      </Route>

      {/* EMPLOYEE */}
      <Route
        path="/employee"
        element={
          isAuthenticated && user?.role === "employee" ? (
            <EmployeeLayout />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
