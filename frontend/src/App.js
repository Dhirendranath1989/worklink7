import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { Toaster } from 'react-hot-toast';
import { handleGoogleRedirectResult } from './features/auth/googleRedirectHandler';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials, initializeAuth } from './features/auth/authSlice';
import toast from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
// Components
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRouteNew';
import RealTimeNotifications from './components/RealTimeNotifications';


// Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import CompleteProfile from './pages/auth/CompleteProfileNew';
import WorkerDashboard from './pages/worker/DashboardNew';
import WorkPortfolio from './pages/worker/WorkPortfolio';
import Certificates from './pages/worker/Certificates';
import OwnerDashboard from './pages/owner/Dashboard';
import SearchWorkers from './pages/owner/SearchWorkers';
import WorkerProfile from './pages/owner/WorkerProfile';
import AdminDashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import Reports from './pages/admin/Reports';
import Analytics from './pages/admin/Analytics';
import Settings from './pages/admin/Settings';
import PostJob from './pages/PostJob';


import NotFound from './pages/NotFound';
import HowItWorks from './pages/HowItWorks';
import FindWork from './pages/FindWork';
import PostWork from './pages/PostWork';
import About from './pages/About';

// Component to handle Google redirect result
function GoogleRedirectHandler() {
  const dispatch = useDispatch();
  
  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        const result = await handleGoogleRedirectResult();
        if (result) {
          dispatch(setCredentials(result));
          toast.success('Successfully logged in with Google!');
          
          // Navigate based on user profile completion
          if (result.user.isNewUser || !result.user.profileCompleted) {
            window.location.href = '/complete-profile';
          } else {
            // Navigate to appropriate dashboard based on user type
            const userType = result.user.userType || result.user.role;
            if (userType === 'owner') {
              window.location.href = '/owner/dashboard';
            } else if (userType === 'worker') {
              window.location.href = '/worker/dashboard';
            } else {
              window.location.href = '/complete-profile';
            }
          }
        }
      } catch (error) {
        console.error('Google redirect result error:', error);
        toast.error('Google sign-in failed. Please try again.');
      }
    };
    
    checkRedirectResult();
  }, [dispatch]);
  
  return null;
}

// Component to initialize user data
function UserInitializer() {
  const dispatch = useDispatch();
  const hasFetchedRef = React.useRef(false);
  
  useEffect(() => {
    // Initialize authentication on app load
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      console.log('Initializing authentication on app startup...');
      dispatch(initializeAuth())
        .unwrap()
        .then((userData) => {
          console.log('Authentication initialized with user data:', userData);
          
          // Redirect authenticated users with completed profiles to their dashboard
          // Redirect authenticated users with completed profiles to their dashboard
          const currentPath = window.location.pathname;
          const publicPages = ['/', '/login', '/register', '/how-it-works', '/find-work', '/post-work', '/about', '/search'];
          
          if (userData && userData.profileCompleted && publicPages.includes(currentPath)) {
            const userRole = userData.userType || userData.role;
            console.log('Authenticated user on public page, redirecting to dashboard for role:', userRole, 'from path:', currentPath);
            
            switch (userRole) {
              case 'worker':
                window.location.href = '/worker/dashboard';
                break;
              case 'owner':
                window.location.href = '/owner/dashboard';
                break;
              case 'admin':
                window.location.href = '/admin/dashboard';
                break;
              default:
                console.log('No valid role found, staying on current page');
            }
          }
        })
        .catch((error) => {
          console.log('No valid authentication found or authentication failed:', error);
        });
    }
  }, [dispatch]);
  
  return null;
}

function App() {
  return (
    <Provider store={store}>
        <ThemeProvider>
          <Router future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}>
          <GoogleRedirectHandler />
          <UserInitializer />
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-300">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/complete-profile" element={
                <ProtectedRoute allowIncompleteProfile={true}>
                  <CompleteProfile />
                </ProtectedRoute>
              } />
    
              <Route path="/worker/:id" element={<WorkerProfile />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/find-work" element={<FindWork />} />
              <Route path="/post-work" element={<PostWork />} />
              <Route path="/about" element={<About />} />
              
              {/* Protected Routes */}
              <Route path="/worker/dashboard" element={
                <ProtectedRoute requiredRole="worker">
                  <WorkerDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/worker/portfolio" element={
                <ProtectedRoute requiredRole="worker">
                  <WorkPortfolio />
                </ProtectedRoute>
              } />
              
              <Route path="/worker/certificates" element={
                <ProtectedRoute requiredRole="worker">
                  <Certificates />
                </ProtectedRoute>
              } />
              
              <Route path="/owner/dashboard" element={
                <ProtectedRoute requiredRole="owner">
                  <OwnerDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/search-workers" element={
                <ProtectedRoute requiredRole="owner">
                  <SearchWorkers />
                </ProtectedRoute>
              } />
              
              <Route path="/worker-profile/:workerId" element={
                <ProtectedRoute requiredRole="owner">
                  <WorkerProfile />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/dashboard" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/user-management" element={
                <ProtectedRoute requiredRole="admin">
                  <UserManagement />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/reports" element={
                <ProtectedRoute requiredRole="admin">
                  <Reports />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/analytics" element={
                <ProtectedRoute requiredRole="admin">
                  <Analytics />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/settings" element={
                <ProtectedRoute requiredRole="admin">
                  <Settings />
                </ProtectedRoute>
              } />
              
              <Route path="/post-job" element={
                <ProtectedRoute requiredRole="owner">
                  <PostJob />
                </ProtectedRoute>
              } />
              

              
              {/* Catch all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
          <RealTimeNotifications />
  
          </div>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              className: 'dark:bg-gray-800 dark:text-white',
              style: {
                background: 'var(--toast-bg, #363636)',
                color: 'var(--toast-text, #fff)',
              },
            }}
          />
          </Router>
        </ThemeProvider>
    </Provider>
  );
}

export default App;