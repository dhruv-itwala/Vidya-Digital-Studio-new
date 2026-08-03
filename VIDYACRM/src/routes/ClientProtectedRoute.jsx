import { Navigate, Outlet } from "react-router-dom";
import React from "react";

const ClientProtectedRoute = ({ children }) => {
  const clientToken = localStorage.getItem("clientToken");
  const clientData = localStorage.getItem("clientData");

  if (!clientToken || !clientData) {
    return <Navigate to="/client-login" replace />;
  }

  return children ? children : <Outlet />;
};

export default ClientProtectedRoute;
