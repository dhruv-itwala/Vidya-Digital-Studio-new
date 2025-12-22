import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Auth/Login";
import EmployeeLayout from "./layouts/EmployeeLayout";
import AdminLayout from "./layouts/AdminLayout";

import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminEmployees from "./pages/Admin/AdminEmployees";
import AdminTasks from "./pages/Admin/AdminTasks";
import AdminAttendance from "./pages/Admin/AdminAttendance";
import AdminReports from "./pages/Admin/AdminReports";
import AdminLeaveApproval from "./pages/Admin/AdminLeaveApproval";

import HRHoliday from "./pages/Employee/HRHoliday";
import EmployeeTasks from "./pages/Employee/EmployeeTasks";
import EmployeeDashboard from "./pages/Employee/EmployeeDashboard";
import EmployeeAttendance from "./pages/Employee/EmployeeAttendance";
import EmployeeLeaves from "./pages/Employee/EmployeeLeaves";
import EmployeeProfile from "./pages/Employee/EmployeeProfile";

import { Toaster } from "react-hot-toast";
import "./App.css";
import NavigateBasedOnRole from "./routes/NavigateBasedOnRole";
import ProtectedRoute from "./routes/ProtectedRoute";
import HRReports from "./pages/Hr/HRReports";
import HRLeaveApproval from "./pages/Hr/HRLeaveApproval";
export default function App() {
  return (
    <>
      <Routes>
        {/* LOGIN */}
        <Route path="/login" element={<Login />} />

        {/* ROOT */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <NavigateBasedOnRole />
            </ProtectedRoute>
          }
        />

        {/* ADMIN ROUTES */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          {/* index route redirects /admin → /admin/dashboard */}
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="employees" element={<AdminEmployees />} />
          <Route path="leaves" element={<AdminLeaveApproval />} />
          <Route path="tasks" element={<AdminTasks />} />
          <Route path="attendance" element={<AdminAttendance />} />
          <Route path="reports" element={<AdminReports />} />
        </Route>

        <Route
          path="/employee"
          element={
            <ProtectedRoute allowedRoles={["employee", "hr"]}>
              <EmployeeLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<EmployeeDashboard />} />
          <Route path="attendance" element={<EmployeeAttendance />} />
          <Route path="profile" element={<EmployeeProfile />} />
          <Route path="leaves" element={<EmployeeLeaves />} />
          <Route path="tasks" element={<EmployeeTasks />} />

          {/* HR-specific routes */}
          <Route
            path="leaves-approval"
            element={
              <ProtectedRoute allowedRoles={["hr"]}>
                <HRLeaveApproval />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports"
            element={
              <ProtectedRoute allowedRoles={["hr"]}>
                <HRReports />
              </ProtectedRoute>
            }
          />
          <Route path="hrHoliday" element={<HRHoliday />} />
          <Route path="hrReports" element={<HRReports />} />
          <Route path="hrLeaveApproval" element={<HRLeaveApproval />} />
        </Route>

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </>
  );
}
