import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import useBackendStatus from "./hooks/useBackendStatus";

import Login from "./pages/Auth/Login";
import NavigateBasedOnRole from "./routes/NavigateBasedOnRole";
import ProtectedRoute from "./routes/ProtectedRoute";

import EmployeeLayout from "./layouts/EmployeeLayout";
import AdminLayout from "./layouts/AdminLayout";
import HRLayout from "./layouts/HRLayout";
import Maintenance from "./components/Maintenance/Maintenance";
import Loader from "./components/Loader/Loader";
import { Toaster } from "react-hot-toast";

import "./App.css";

// Lazy Loaded Components
const AllQuotations = React.lazy(() => import("./pages/Admin/AllQuotations"));
const Dashboard = React.lazy(() => import("./components/Dashboard/Dashboard"));
const SeniorDashboard = React.lazy(
  () => import("./components/Dashboard/SeniorDashboard"),
);

const AdminEmployees = React.lazy(() => import("./pages/Admin/AdminEmployees"));
const AdminTasks = React.lazy(() => import("./pages/Admin/AdminTasks"));

const HRHoliday = React.lazy(() => import("./pages/HR/HRHoliday"));
const EmployeeTasks = React.lazy(
  () => import("./pages/Employee/EmployeeTasks"),
);

const EmployeeAttendance = React.lazy(
  () => import("./pages/Employee/EmployeeAttendance"),
);
const EmployeeLeaves = React.lazy(
  () => import("./pages/Employee/EmployeeLeaves"),
);

const Reports = React.lazy(() => import("./components/Reports/Reports"));
const Holiday = React.lazy(() => import("./components/Holidays/Holiday"));
const LeaveApproval = React.lazy(
  () => import("./components/LeaveApproval/LeaveApproval"),
);
const Attendance = React.lazy(
  () => import("./components/Attendance/Attendance"),
);
const Profile = React.lazy(() => import("./components/Profile/Profile"));
const TodoList = React.lazy(() => import("./components/TodoList/TodoList"));

const ViewLeads = React.lazy(() => import("./components/Leads/ViewLeads"));
const EditLead = React.lazy(() => import("./components/Leads/EditLead"));
const CreateLead = React.lazy(() => import("./components/Leads/CreateLead"));
const DetailLead = React.lazy(() => import("./components/Leads/DetailLead"));

const ViewClients = React.lazy(
  () => import("./components/Clients/ViewClients"),
);
const CreateClient = React.lazy(
  () => import("./components/Clients/CreateClient"),
);
const EditClient = React.lazy(() => import("./components/Clients/EditClient"));
const DetailClient = React.lazy(
  () => import("./components/Clients/DetailClient"),
);
const HROverride = React.lazy(() => import("./components/HR/HROverride"));
const Influencer = React.lazy(
  () => import("./components/InfluencerList/Influencer"),
);
const InfluencerView = React.lazy(
  () => import("./components/InfluencerList/InfluencerView"),
);
const UGCCreator = React.lazy(
  () => import("./components/UgcCreatorList/UGCCreator"),
);
const UGCView = React.lazy(() => import("./components/UgcCreatorList/UGCView"));
const Log = React.lazy(() => import("./components/LogsPage/Log"));
const AuditLogs = React.lazy(() => import("./components/AuditLogs/AuditLogs"));

export default function App() {
  const { isDown, loading } = useBackendStatus();
  if (loading) return null;

  if (isDown) {
    return (
      <Routes>
        <Route path="*" element={<Maintenance />} />
      </Routes>
    );
  }

  return (
    <>
      <Suspense fallback={<Loader />}>
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
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="work-dashboard" element={<SeniorDashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="holidays" element={<Holiday />} />
            <Route path="employees" element={<AdminEmployees />} />
            <Route path="leaves" element={<EmployeeLeaves />} />
            <Route path="leave-approval" element={<LeaveApproval />} />
            <Route path="tasks" element={<AdminTasks />} />
            <Route path="reports" element={<Reports />} />
            <Route path="todo" element={<TodoList />} />

            <Route path="leads" element={<ViewLeads />} />
            <Route path="leads/:id" element={<DetailLead />} />
            <Route path="leads/create" element={<CreateLead />} />
            <Route path="leads/:id/edit" element={<EditLead />} />

            <Route path="influencers" element={<Influencer />} />
            <Route path="influencers/view" element={<InfluencerView />} />
            <Route path="ugc-creators" element={<UGCCreator />} />
            <Route path="ugc-creators/view" element={<UGCView />} />

            <Route path="clients" element={<ViewClients />} />
            <Route path="clients/:id" element={<DetailClient />} />
            <Route path="clients/create" element={<CreateClient />} />
            <Route path="clients/:id/edit" element={<EditClient />} />
            <Route path="quotations" element={<AllQuotations />} />
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
            <Route path="work-dashboard" element={<SeniorDashboard />} />
            <Route path="test" element={<Dashboard />} />
            <Route path="employees" element={<AdminEmployees />} />
            <Route path="attendance" element={<EmployeeAttendance />} />
            <Route path="mark-attendance" element={<Attendance />} />
            <Route path="profile" element={<Profile />} />
            <Route path="leaves" element={<EmployeeLeaves />} />
            <Route path="tasks" element={<EmployeeTasks />} />
            <Route path="all-tasks" element={<AdminTasks />} />
            <Route path="todo" element={<TodoList />} />
            <Route path="hr" element={<HROverride />} />

            <Route path="hrLeaveApproval" element={<LeaveApproval />} />
            <Route path="hrReports" element={<Reports />} />
            <Route path="hrHoliday" element={<HRHoliday />} />

            <Route path="logs" element={<Log />} />
            <Route path="audit-logs" element={<AuditLogs />} />

            <Route path="influencers" element={<Influencer />} />
            <Route path="influencers/view" element={<InfluencerView />} />
            <Route path="ugc-creators" element={<UGCCreator />} />
            <Route path="ugc-creators/view" element={<UGCView />} />

            <Route path="leads" element={<ViewLeads />} />
            <Route path="leads/:id" element={<DetailLead />} />
            <Route path="leads/create" element={<CreateLead />} />
            <Route path="leads/:id/edit" element={<EditLead />} />

            <Route path="clients" element={<ViewClients />} />
            <Route path="clients/:id" element={<DetailClient />} />
            <Route path="clients/create" element={<CreateClient />} />
            <Route path="clients/:id/edit" element={<EditClient />} />
          </Route>

          {/* EMPLOYEE ROUTES */}
          <Route
            path="/employee"
            element={
              <ProtectedRoute allowedRoles={["employee", "intern"]}>
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

            <Route path="influencers" element={<Influencer />} />
            <Route path="influencers/view" element={<InfluencerView />} />
            <Route path="ugc-creators" element={<UGCCreator />} />
            <Route path="ugc-creators/view" element={<UGCView />} />
          </Route>

          {/* FALLBACK */}
          <Route path="*" element={<Navigate to="/404" replace />} />
          <Route path="/maintenance" element={<Maintenance />} />
        </Routes>
      </Suspense>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </>
  );
}
