import React from 'react';
import { Navigate } from 'react-router-dom';

const ClientProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('clientToken');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ClientProtectedRoute;
