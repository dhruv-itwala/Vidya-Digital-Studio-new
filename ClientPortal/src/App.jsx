import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

const ClientLogin = React.lazy(() => import("./pages/ClientLogin/ClientLogin"));
const ClientProtectedRoute = React.lazy(() => import("./routes/ClientProtectedRoute"));
const ClientPortalLayout = React.lazy(() => import("./layouts/ClientPortalLayout"));
const ClientDashboard = React.lazy(() => import("./pages/ClientDashboard/ClientDashboard"));
const ClientProfile = React.lazy(() => import("./pages/ClientProfile/ClientProfile"));
const ClientAssets = React.lazy(() => import("./pages/ClientAssets/ClientAssets"));
const ClientDocuments = React.lazy(() => import("./pages/ClientDocuments/ClientDocuments"));
const ClientInvoices = React.lazy(() => import("./pages/ClientInvoices/ClientInvoices"));
const ClientCalendar = React.lazy(() => import("./pages/ClientCalendar/ClientCalendar"));

const Loader = () => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      background: "#f8fafc",
      gap: "14px",
    }}
  >
    <div
      className="spin"
      style={{
        width: "28px",
        height: "28px",
        border: "3px solid #e2e8f0",
        borderTopColor: "#059669",
        borderRadius: "50%",
      }}
    />
    <span
      style={{
        fontSize: "0.82rem",
        fontWeight: 600,
        color: "#64748b",
        letterSpacing: "0.02em",
      }}
    >
      Loading Client Workspace...
    </span>
  </div>
);

export default function App() {
  return (
    <>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={<Navigate to="/client-portal" replace />} />
          <Route path="/login" element={<ClientLogin />} />

          <Route
            path="/client-portal/*"
            element={
              <ClientProtectedRoute>
                <ClientPortalLayout />
              </ClientProtectedRoute>
            }
          >
            <Route index element={<ClientDashboard />} />
            <Route path="calendar" element={<ClientCalendar />} />
            <Route path="invoices" element={<ClientInvoices />} />
            <Route path="assets" element={<ClientAssets />} />
            <Route path="documents" element={<ClientDocuments />} />
            <Route path="profile" element={<ClientProfile />} />
          </Route>

          <Route path="*" element={<Navigate to="/client-portal" replace />} />
        </Routes>
      </Suspense>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: "10px",
            background: "#0f172a",
            color: "#f8fafc",
            fontSize: "0.82rem",
            fontWeight: 500,
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.2)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          },
        }}
      />
    </>
  );
}
