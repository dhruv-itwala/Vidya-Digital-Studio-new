import { Routes, Route, Navigate } from "react-router-dom";
import useBackendStatus from "./hooks/useBackendStatus";

import Login from "./pages/Auth/Login";
import EmployeeLayout from "./layouts/EmployeeLayout";
import AdminLayout from "./layouts/AdminLayout";

import AdminEmployees from "./pages/Admin/AdminEmployees";
import AdminTasks from "./pages/Admin/AdminTasks";

import HRHoliday from "./pages/HR/HRHoliday";
import EmployeeTasks from "./pages/Employee/EmployeeTasks";
import EmployeeDashboard from "./pages/Employee/EmployeeDashboard";
import EmployeeAttendance from "./pages/Employee/EmployeeAttendance";
import EmployeeLeaves from "./pages/Employee/EmployeeLeaves";

import NavigateBasedOnRole from "./routes/NavigateBasedOnRole";
import ProtectedRoute from "./routes/ProtectedRoute";
import HRLayout from "./layouts/HRLayout";

import Reports from "./components/Reports/Reports";
import Holiday from "./components/Holidays/Holiday";
import LeaveApproval from "./components/LeaveApproval/LeaveApproval";
import Attendance from "./components/Attendance/Attendance";
import Profile from "./components/Profile/Profile";
import TodoList from "./components/TodoList/TodoList";
import AllQuotations from "./pages/Admin/AllQuotations";

import CreateClient from "./components/Client/CreateClient";
import ClientList from "./components/Client/ClientList";
import ClientView from "./components/Client/ClientView";
import EditClient from "./components/Client/EditClient";

import Maintenance from "./components/Maintenance/Maintenance";
import { Toaster } from "react-hot-toast";
import "./App.css";
import Dashboard from "./components/Dashboard/Dashboard";

export default function App() {
  const { isDown, loading } = useBackendStatus();
  if (loading) return null;

  if (isDown) {
    return (
      <>
        <Routes>
          <Route path="*" element={<Maintenance />} />
        </Routes>
      </>
    );
  }
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
          {/* ADMIN ROUTES */}
          <Route index element={<Navigate to="attendance" replace />} />
          <Route path="profile" element={<Profile />} />
          <Route path="holidays" element={<Holiday />} />
          <Route path="employees" element={<AdminEmployees />} />
          <Route path="leaves" element={<LeaveApproval />} />
          <Route path="tasks" element={<AdminTasks />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="reports" element={<Reports />} />
          <Route path="todo" element={<TodoList />} />

          <Route path="quotations" element={<AllQuotations />} />

          <Route path="clients" element={<ClientList />} />
          <Route path="clients/create" element={<CreateClient />} />
          <Route path="clients/:id" element={<ClientView />} />
          <Route path="clients/:id/edit" element={<EditClient />} />
        </Route>

        {/* EMPLOYEE ROUTES */}
        <Route
          path="/employee"
          element={
            <ProtectedRoute allowedRoles={["employee"]}>
              <EmployeeLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="test" element={<Dashboard />} />
          <Route path="holidays" element={<Holiday />} />
          <Route path="attendance" element={<EmployeeAttendance />} />
          <Route path="profile" element={<Profile />} />
          <Route path="leaves" element={<EmployeeLeaves />} />
          <Route path="todo" element={<TodoList />} />
          <Route path="tasks" element={<EmployeeTasks />} />
        </Route>

        {/* HR ROUTES */}
        <Route
          path="/hr"
          element={
            <ProtectedRoute allowedRoles={["hr"]}>
              <HRLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="test" element={<Dashboard />} />
          <Route path="employees" element={<AdminEmployees />} />
          <Route path="attendance" element={<EmployeeAttendance />} />
          <Route path="mark-attendance" element={<Attendance />} />
          <Route path="profile" element={<Profile />} />
          <Route path="leaves" element={<EmployeeLeaves />} />
          <Route path="tasks" element={<EmployeeTasks />} />
          <Route path="todo" element={<TodoList />} />

          <Route path="hrLeaveApproval" element={<LeaveApproval />} />
          <Route path="hrReports" element={<Reports />} />
          <Route path="hrHoliday" element={<HRHoliday />} />

          <Route path="clients" element={<ClientList />} />
          <Route path="clients/create" element={<CreateClient />} />
          <Route path="clients/:id" element={<ClientView />} />
          <Route path="clients/:id/edit" element={<EditClient />} />
        </Route>

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/404" replace />} />
        <Route path="/maintenance" element={<Maintenance />} />
      </Routes>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </>
  );
}
