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
const ClientTransactions = React.lazy(() => import("./pages/ClientTransactions/ClientTransactions"));

const Loader = () => <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.5rem', color: '#3b82f6' }}>Loading...</div>;

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
            <Route path="profile" element={<ClientProfile />} />
            <Route path="assets" element={<ClientAssets />} />
            <Route path="documents" element={<ClientDocuments />} />
            <Route path="invoices" element={<ClientInvoices />} />
            <Route path="transactions" element={<ClientTransactions />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/client-portal" replace />} />
        </Routes>
      </Suspense>
      <Toaster position="top-right" />
    </>
  );
}
