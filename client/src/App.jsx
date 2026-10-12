/**
 * Main App Router Component
 * Connects Contexts, Custom MUI Theme + Tailwind, React Router, Layout, and Pages
 */
import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SnackbarProvider } from 'notistack';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider, useApp } from './contexts/AppContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { getTheme } from './theme/theme';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';

// Code-split page chunks for optimal bundle size and sub-second load times
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Login = lazy(() => import('./pages/Login'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const SetNewPassword = lazy(() => import('./pages/SetNewPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AllSarees = lazy(() => import('./pages/AllSarees'));
const SareeForm = lazy(() => import('./pages/SareeForm'));
const SareeEdit = lazy(() => import('./pages/SareeEdit'));
const SareeDetail = lazy(() => import('./pages/SareeDetail'));
const LowStock = lazy(() => import('./pages/LowStock'));
const StockHistory = lazy(() => import('./pages/StockHistory'));
const Settings = lazy(() => import('./pages/Settings'));
const StockRequests = lazy(() => import('./pages/StockRequests'));
const BillingUsage = lazy(() => import('./pages/BillingUsage'));
const AdminAccounts = lazy(() => import('./pages/AdminAccounts'));

const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', width: '100%' }}>
    <div
      style={{
        width: 36,
        height: 36,
        border: '3px solid rgba(212, 175, 55, 0.25)',
        borderTopColor: '#D4AF37',
        borderRadius: '50%',
        animation: 'spin 0.75s linear infinite',
      }}
    />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

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
        <Suspense fallback={<PageLoader />}>
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

        {/* Guarded App Layout Route */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
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

          {/* Shared Dashboard — Boutique User Only */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute userOnly={true}>
                <Dashboard />
              </ProtectedRoute>
            }
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

          {/* Fallback */}
          <Route
            path="*"
            element={<Navigate to={isSuperAdmin ? "/admin/accounts" : "/dashboard"} replace />}
          />
        </Route>
      </Routes>
      </Suspense>
      </SnackbarProvider>
    </ThemeProvider>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <AppProvider>
            <LanguageProvider>
              <AppContent />
            </LanguageProvider>
          </AppProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
