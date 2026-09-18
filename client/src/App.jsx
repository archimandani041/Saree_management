/**
 * Main App Router Component
 * Connects Contexts, Custom MUI Theme + Tailwind, React Router, Layout, and Pages
 */
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SnackbarProvider } from 'notistack';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider, useApp } from './contexts/AppContext';
import { getTheme } from './theme/theme';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import SetNewPassword from './pages/SetNewPassword';
import Dashboard from './pages/Dashboard';
import AllSarees from './pages/AllSarees';
import SareeForm from './pages/SareeForm';
import SareeEdit from './pages/SareeEdit';
import SareeDetail from './pages/SareeDetail';
import LowStock from './pages/LowStock';
import StockHistory from './pages/StockHistory';
import Settings from './pages/Settings';
import StockRequests from './pages/StockRequests';
import BillingUsage from './pages/BillingUsage';
import AdminAccounts from './pages/AdminAccounts';

/**
 * RootRoute:
 * Displays LandingPage for new/unauthenticated visitors.
 * Automatically routes authenticated users directly to /dashboard.
 */
const RootRoute = () => {
  const { isAuthenticated, isSuperAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <LandingPage />;
  return isSuperAdmin ? <Navigate to="/admin/accounts" replace /> : <Navigate to="/dashboard" replace />;
};

const AppContent = () => {
  const { themeMode } = useApp();
  const { isSuperAdmin } = useAuth();
  const theme = getTheme(themeMode);

  // Sync Tailwind dark mode class with MUI theme mode
  useEffect(() => {
    const html = document.documentElement;
    if (themeMode === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [themeMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<RootRoute />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Login defaultSignUp={true} />} />
        <Route path="/register" element={<Login defaultSignUp={true} />} />
        {/* Email verification callback — must be public and match the Supabase redirect URL */}
        <Route path="/auth/callback" element={<AuthCallback />} />
        {/* Password recovery — shown after clicking reset link, user sets new password here */}
        <Route path="/set-password" element={<SetNewPassword />} />

        {/* Guarded App Routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  {/* Shared Dashboard — Boutique User Only */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute userOnly={true}>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/"
                    element={<Navigate to={isSuperAdmin ? "/admin/accounts" : "/dashboard"} replace />}
                  />

                  {/* Saree Inventory Grid — Boutique User Only */}
                  <Route
                    path="/sarees"
                    element={
                      <ProtectedRoute userOnly={true}>
                        <AllSarees />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/sarees/:id"
                    element={
                      <ProtectedRoute userOnly={true}>
                        <SareeDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/search"
                    element={<Navigate to="/sarees" replace />}
                  />
                  <Route
                    path="/low-stock"
                    element={
                      <ProtectedRoute userOnly={true}>
                        <LowStock />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/history"
                    element={
                      <ProtectedRoute userOnly={true}>
                        <StockHistory />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/stock-requests"
                    element={
                      <ProtectedRoute userOnly={true}>
                        <StockRequests />
                      </ProtectedRoute>
                    }
                  />

                  {/* Boutique User Saree Mutations */}
                  <Route
                    path="/sarees/add"
                    element={
                      <ProtectedRoute userOnly={true}>
                        <SareeForm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/sarees/edit/:id"
                    element={
                      <ProtectedRoute userOnly={true}>
                        <SareeEdit />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/billing"
                    element={
                      <ProtectedRoute userOnly={true}>
                        <BillingUsage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute userOnly={true}>
                        <Settings />
                      </ProtectedRoute>
                    }
                  />

                  {/* Super Admin Unified Platform Accounts & Plan Management — Super Admin Only */}
                  <Route
                    path="/admin/accounts"
                    element={
                      <ProtectedRoute superAdminOnly={true}>
                        <AdminAccounts />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={<Navigate to="/admin/accounts" replace />}
                  />

                  {/* Fallback */}
                  <Route
                    path="*"
                    element={<Navigate to={isSuperAdmin ? "/admin/accounts" : "/dashboard"} replace />}
                  />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
      </SnackbarProvider>
    </ThemeProvider>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
