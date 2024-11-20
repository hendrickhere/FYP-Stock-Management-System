import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { TokenExpirationWarning } from './tokenExpirationWarning';

export const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const token = localStorage.getItem('accessToken');

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp * 1000 < Date.now()) {
      localStorage.clear();
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
  } catch (error) {
    localStorage.clear();
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <>
      {children}
      <TokenExpirationWarning />
    </>
  );
};