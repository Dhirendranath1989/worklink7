import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children, requiredRole = null, allowIncompleteProfile = false }) => {
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);
  const location = useLocation();

  // Show loading state while authentication is being checked
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user needs to complete profile (unless explicitly allowed)
  // Fixed: Only check profileCompleted, not isNewUser
  if (!allowIncompleteProfile && !user.profileCompleted) {
    // Only redirect to complete-profile if not already there
    if (location.pathname !== '/complete-profile') {
      return <Navigate to="/complete-profile" replace />;
    }
  }

  // Handle role-based access control
  if (requiredRole) {
    const userRole = user.userType || user.role;
    
    if (!userRole) {
      // If user has no role assigned, set default role to worker
      console.log('User has no role assigned, using default role: worker');
      // Allow access with default role
      return children;
    }
    
    if (userRole !== requiredRole) {
      // Redirect to appropriate dashboard based on user's actual role
      let redirectPath = '/';
      
      switch (userRole) {
        case 'worker':
          redirectPath = '/worker/dashboard';
          break;
        case 'owner':
          redirectPath = '/owner/dashboard';
          break;
        case 'admin':
          redirectPath = '/admin/dashboard';
          break;
        default:
          redirectPath = '/';
      }
      
      console.log(`User role mismatch. Required: ${requiredRole}, Actual: ${userRole}. Redirecting to: ${redirectPath}`);
      return <Navigate to={redirectPath} replace />;
    }
  }

  // Allow access to complete-profile page for users with incomplete profiles
  if (location.pathname === '/complete-profile') {
    // If user has already completed profile, redirect to dashboard
    // Fixed: Only check profileCompleted, not isNewUser
    if (user.profileCompleted) {
      const userRole = user.userType || user.role || 'worker';
      let dashboardPath = '/';
      
      switch (userRole) {
        case 'worker':
          dashboardPath = '/worker/dashboard';
          break;
        case 'owner':
          dashboardPath = '/owner/dashboard';
          break;
        case 'admin':
          dashboardPath = '/admin/dashboard';
          break;
        default:
          dashboardPath = '/worker/dashboard';
      }
      
      console.log(`User profile already completed, redirecting to dashboard: ${dashboardPath}`);
      return <Navigate to={dashboardPath} replace />;
    }
    // Otherwise, allow access to complete-profile page
  }

  // All checks passed, render the protected component
  return children;
};

export default ProtectedRoute;