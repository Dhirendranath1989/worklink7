import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Skip profile completion check - all authenticated users can access protected routes

  if (requiredRole && user?.role !== requiredRole && user?.userType !== requiredRole) {
    // Redirect to unauthorized page or home based on role
    const redirectPath = (user?.role === 'worker' || user?.userType === 'worker') ? '/worker/dashboard' : 
                        (user?.role === 'owner' || user?.userType === 'owner') ? '/owner/dashboard' : 
                        user?.role === 'admin' ? '/admin/dashboard' : '/';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default ProtectedRoute;