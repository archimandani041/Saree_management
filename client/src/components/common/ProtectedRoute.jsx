/**
 * ProtectedRoute Component
 * Guards routes from unauthenticated users and unauthorized roles
 */
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Box, CircularProgress } from '@mui/material';

const ProtectedRoute = ({ children, allowedRoles, superAdminOnly = false, userOnly = false }) => {
  const { isAuthenticated, user, loading, isSuperAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page; save the location they tried to visit
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Super Admin Exclusive Pages (e.g. /admin/accounts)
  if (superAdminOnly && !isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Regular Boutique User Pages (e.g. /dashboard, /sarees, /low-stock, etc.)
  if (userOnly && isSuperAdmin) {
    return <Navigate to="/admin/accounts" replace />;
  }

  return children;
};

export default ProtectedRoute;
