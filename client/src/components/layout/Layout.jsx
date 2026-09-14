/**
 * Layout Component
 * Unifies Sidebar, Header, Global Search, and Content Area
 * with smooth page transition animation.
 */
import { Box, useTheme, useMediaQuery } from '@mui/material';
import { useLocation } from 'react-router-dom';
import Sidebar, { DRAWER_WIDTH } from './Sidebar';
import Header from './Header';
import GlobalSearchDialog from '../common/GlobalSearchDialog';
import { useApp } from '../../contexts/AppContext';
import { APP_BACKGROUND } from '../../theme/theme';

const Layout = ({ children }) => {
  const { sidebarOpen, themeMode } = useApp();
  const theme = useTheme();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isLight = themeMode === 'light';

  return (
    <Box sx={{
      display: 'flex',
      minHeight: '100vh',
      background: isLight ? APP_BACKGROUND.light : APP_BACKGROUND.dark,
      backgroundColor: 'background.default',
      transition: 'background 0.3s ease, background-color 0.3s ease',
    }}>
      {/* Sidebar Drawer */}
      <Sidebar />

      {/* Main Container */}
      <Box sx={{
        flexGrow: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        transition: theme.transitions.create(['margin', 'width'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
        width: sidebarOpen && !isMobile ? `calc(100% - ${DRAWER_WIDTH}px)` : '100%',
      }}>
        {/* Header bar */}
        <Header />

        {/* Global Search Dialog */}
        <GlobalSearchDialog />

        {/* Dynamic Page Content — with fade-in animation per route */}
        <Box
          key={location.pathname}
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3 },
            overflowY: 'auto',
            bgcolor: 'transparent',
            animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
            '@keyframes fadeInUp': {
              from: { opacity: 0, transform: 'translateY(10px)' },
              to:   { opacity: 1, transform: 'translateY(0)' },
            },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
