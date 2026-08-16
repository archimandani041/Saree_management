/**
 * Sidebar Navigation Component — KP Creation Premium
 * Grouped sections, burgundy active pill, brand logo, user profile, theme toggle.
 */
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import {
  Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Box, Typography, Avatar, Chip, IconButton, useMediaQuery, useTheme,
  Button, Divider, Tooltip
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SareeIcon from '@mui/icons-material/Checkroom';
import LowStockIcon from '@mui/icons-material/WarningAmber';
import HistoryIcon from '@mui/icons-material/History';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import InboxIcon from '@mui/icons-material/Inbox';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PeopleIcon from '@mui/icons-material/People';
import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined';

export const DRAWER_WIDTH = 260;

// Grouped navigation sections — only existing pages
const navSections = [
  {
    heading: 'Overview',
    items: [
      { label: 'Dashboard', path: '/', icon: <DashboardIcon /> },
    ],
  },
  {
    heading: 'Inventory',
    items: [
      { label: 'All Sarees', path: '/sarees', icon: <SareeIcon /> },
      { label: 'Low Stock', path: '/low-stock', icon: <LowStockIcon />, badge: true },
      { label: 'Stock History', path: '/history', icon: <HistoryIcon /> },
    ],
  },
  {
    heading: 'Operations',
    items: [
      { label: 'Stock Requests', path: '/stock-requests', icon: <InboxIcon /> },
    ],
  },
  {
    heading: 'System',
    items: [
      { label: 'Settings', path: '/settings', icon: <SettingsIcon />, adminOnly: true },
    ],
  },
];

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const { sidebarOpen, setSidebarOpen, themeMode, toggleTheme } = useApp();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isLight = themeMode === 'light';

  const mutedText  = isLight ? '#9E8E7A' : '#8A7C6A';
  const idleText   = isLight ? '#2E2824' : '#D8CABA';
  const activeBg   = isLight ? 'rgba(59,17,26,0.07)' : 'rgba(59,17,26,0.18)';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isItemActive = (path) => {
    if (path === '/sarees') {
      return location.pathname === '/sarees'
        || location.pathname.startsWith('/sarees/add')
        || location.pathname.startsWith('/sarees/edit');
    }
    return location.pathname === path
      || (path !== '/' && location.pathname.startsWith(path));
  };

  const userInitials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const drawerContent = (
    <Box sx={{
      display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden',
      bgcolor: 'transparent',
    }}>

      {/* ── Brand Header ─────────────────────────────────────── */}
      <Box sx={{
        px: 2.5, pt: 2.5, pb: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        minHeight: 68,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: '10px',
            background: 'linear-gradient(135deg, #72383D 0%, #3B111A 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 3px 10px rgba(59,17,26,0.30)',
            flexShrink: 0,
          }}>
            <StorefrontIcon sx={{ color: '#fff', fontSize: '1.1rem' }} />
          </Box>
          <Box>
            <Typography sx={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: '1.15rem', fontWeight: 900, lineHeight: 1.1,
              color: 'text.primary', letterSpacing: '-0.01em',
            }}>
              KP<Box component="span" sx={{ color: 'primary.main' }}>Creation</Box>
            </Typography>
            <Typography sx={{
              fontSize: '0.58rem', color: mutedText,
              letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700,
            }}>
              Inventory Portal
            </Typography>
          </Box>
        </Box>
        {isMobile && (
          <IconButton
            onClick={() => setSidebarOpen(false)}
            size="small"
            sx={{ color: 'text.secondary' }}
          >
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Box>

      {/* ── Quick Add CTA ─────────────────────────────────────── */}
      <Box sx={{ px: 2, pt: 2, pb: 1 }}>
        <Button
          fullWidth
          startIcon={<AddCircleOutlinedIcon sx={{ fontSize: '1rem !important' }} />}
          onClick={() => {
            if (location.pathname === '/stock-requests') {
              const btn = document.getElementById('new-stock-request-btn');
              if (btn) btn.click();
            } else {
              navigate('/sarees/add');
            }
            if (isMobile) setSidebarOpen(false);
          }}
          sx={{
            bgcolor: 'primary.main',
            color: '#FFFFFF',
            borderRadius: '8px',
            py: 1.1,
            fontSize: '0.78rem',
            fontWeight: 700,
            letterSpacing: '0.02em',
            justifyContent: 'flex-start',
            '&:hover': { bgcolor: 'primary.dark', transform: 'none' },
            transition: 'background-color 0.18s ease',
          }}
        >
          {location.pathname === '/stock-requests' ? 'New Stock Request' : 'New Collection'}
        </Button>
      </Box>

      {/* ── Navigation ───────────────────────────────────────── */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 1.5, py: 0.5 }}>
        {navSections.map((section) => {
          const visibleItems = section.items.filter(item => {
            if (item.adminOnly && !isAdmin) return false;
            return true;
          });
          if (visibleItems.length === 0) return null;

          return (
            <Box key={section.heading} sx={{ mb: 1 }}>
              <Typography sx={{
                px: 1.5, py: 0.75,
                fontSize: '0.58rem', fontWeight: 800,
                letterSpacing: '0.12em', textTransform: 'uppercase', color: mutedText,
              }}>
                {section.heading}
              </Typography>
              <List sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                {visibleItems.map((item) => {
                  const active = isItemActive(item.path);
                  return (
                    <ListItemButton
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        if (isMobile) setSidebarOpen(false);
                      }}
                      sx={{
                        position: 'relative',
                        borderRadius: '8px',
                        py: 0.9, px: 1.5,
                        minHeight: 38,
                        bgcolor: active ? activeBg : 'transparent',
                        color: active ? 'primary.main' : idleText,
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          left: 0,
                          top: '20%',
                          bottom: '20%',
                          width: '3px',
                          borderRadius: '0 3px 3px 0',
                          bgcolor: 'primary.main',
                          opacity: active ? 1 : 0,
                          transition: 'opacity 0.18s ease',
                        },
                        '&:hover': {
                          bgcolor: active
                            ? activeBg
                            : isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
                        },
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <ListItemIcon sx={{
                        minWidth: 30,
                        color: active ? 'primary.main' : mutedText,
                        '& .MuiSvgIcon-root': { fontSize: '1.15rem' },
                        transition: 'color 0.15s ease',
                      }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        slotProps={{
                          primary: {
                            sx: {
                              fontSize: '0.84rem',
                              fontWeight: active ? 700 : 600,
                              letterSpacing: '-0.01em',
                              color: active ? 'primary.main' : idleText,
                            },
                          },
                        }}
                      />
                      {item.badge && (
                        <Box sx={{
                          width: 7, height: 7, borderRadius: '50%',
                          bgcolor: 'error.main', flexShrink: 0, ml: 0.5,
                        }} />
                      )}
                    </ListItemButton>
                  );
                })}
              </List>
            </Box>
          );
        })}
      </Box>

      {/* ── User Profile Footer ───────────────────────────────── */}
      <Box sx={{
        p: 2,
        borderTop: `1px solid ${theme.palette.divider}`,
      }}>
        {/* Theme toggle */}
        <Box sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          px: 1.5, py: 1,
          borderRadius: '8px',
          bgcolor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)',
          mb: 1.5,
        }}>
          <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: mutedText }}>
            {isLight ? 'Light Mode' : 'Dark Mode'}
          </Typography>
          <Tooltip title={`Switch to ${isLight ? 'dark' : 'light'} mode`}>
            <IconButton
              onClick={toggleTheme}
              size="small"
              sx={{
                color: mutedText,
                '&:hover': { color: 'primary.main', bgcolor: 'transparent' },
              }}
            >
              {isLight
                ? <DarkModeIcon sx={{ fontSize: '1rem' }} />
                : <LightModeIcon sx={{ fontSize: '1rem' }} />
              }
            </IconButton>
          </Tooltip>
        </Box>

        {/* User info */}
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1.25,
          p: 1.25, borderRadius: '8px',
          cursor: 'pointer',
          '&:hover': { bgcolor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)' },
          transition: 'background 0.15s ease',
        }}>
          <Avatar
            sx={{
              width: 32, height: 32,
              bgcolor: 'primary.main',
              fontSize: '0.75rem',
              fontWeight: 800,
              border: '1.5px solid',
              borderColor: isLight ? 'rgba(59,17,26,0.25)' : 'rgba(114,56,61,0.4)',
              flexShrink: 0,
            }}
          >
            {userInitials}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{
              fontSize: '0.82rem', fontWeight: 700,
              color: 'text.primary', lineHeight: 1.2,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {user?.full_name || 'Portal Admin'}
            </Typography>
            <Typography sx={{
              fontSize: '0.62rem', fontWeight: 700,
              color: mutedText, letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}>
              {user?.role || 'admin'}
            </Typography>
          </Box>
          <Tooltip title="Logout">
            <IconButton
              onClick={handleLogout}
              size="small"
              sx={{ color: mutedText, '&:hover': { color: 'error.main', bgcolor: 'transparent' } }}
            >
              <LogoutIcon sx={{ fontSize: '1rem' }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'persistent'}
      open={sidebarOpen}
      onClose={() => setSidebarOpen(false)}
      sx={{
        width: sidebarOpen ? DRAWER_WIDTH : 0,
        flexShrink: 0,
        transition: 'width 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
