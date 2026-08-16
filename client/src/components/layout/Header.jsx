/**
 * Header/Navbar Component — KP Creation Premium
 * Features: search pill, notifications, theme toggle with correct icon, user menu
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { dashboardAPI } from '../../services/api';
import {
  AppBar, Toolbar, IconButton, Badge, Box, Menu, MenuItem,
  Typography, Avatar, Divider, ListItemText, ListItemIcon, Tooltip, useTheme
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import AccountCircle from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import WarningIcon from '@mui/icons-material/WarningAmber';
import ErrorIcon from '@mui/icons-material/Error';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import { useKeyboardShortcut } from '../../hooks/useDebounce';

const Header = () => {
  const { user, logout } = useAuth();
  const { sidebarOpen, setSidebarOpen, setSearchOpen, toggleTheme, themeMode } = useApp();
  const navigate = useNavigate();
  const theme = useTheme();

  const [anchorEl, setAnchorEl] = useState(null);
  const [notiAnchorEl, setNotiAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const isLight = themeMode === 'light';

  // Fetch low stock notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data } = await dashboardAPI.get();
        const alerts = [];
        if (data.lowStockSarees && data.lowStockSarees.length > 0) {
          data.lowStockSarees.forEach(s => {
            alerts.push({
              id: s.id,
              type: s.current_stock === 0 ? 'out' : 'low',
              title: s.current_stock === 0 ? 'Out of Stock' : 'Low Stock Alert',
              message: `${s.sari_name} (${s.series_code}) — ${s.current_stock} pcs left`,
            });
          });
        }
        setNotifications(alerts);
      } catch {
        // silent fail
      }
    };
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Ctrl+K search shortcut
  useKeyboardShortcut('k', true, () => setSearchOpen(true));

  const handleProfileMenuOpen  = (e) => setAnchorEl(e.currentTarget);
  const handleProfileMenuClose = () => setAnchorEl(null);
  const handleNotiMenuOpen     = (e) => setNotiAnchorEl(e.currentTarget);
  const handleNotiMenuClose    = () => setNotiAnchorEl(null);

  const handleLogout = async () => {
    handleProfileMenuClose();
    await logout();
    navigate('/login');
  };

  const handleNotificationClick = (sareeId) => {
    handleNotiMenuClose();
    navigate(`/sarees/${sareeId}`);
  };

  const userInitials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'A';

  return (
    <AppBar
      position="sticky"
      sx={{
        bgcolor: isLight ? 'rgba(255,255,255,0.96)' : 'rgba(26,24,21,0.96)',
        color: 'text.primary',
        boxShadow: 'none',
        borderBottom: '1px solid',
        borderColor: 'divider',
        zIndex: theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{
        display: 'flex', justifyContent: 'space-between',
        px: { xs: 2, sm: 3 }, minHeight: '60px !important',
        gap: 1,
      }}>

        {/* ── Left: Menu toggle + Search ────────────────────── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}>
            <IconButton
              edge="start"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              sx={{ color: 'text.secondary', mr: 0.5 }}
              size="small"
            >
              <MenuIcon sx={{ fontSize: '1.25rem' }} />
            </IconButton>
          </Tooltip>

          {/* Search pill */}
          <Box
            component="button"
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Open global search (Ctrl+K)"
            sx={{
              display: 'flex',
              alignItems: 'center',
              bgcolor: isLight ? '#F7F4F1' : 'rgba(255,255,255,0.05)',
              borderRadius: '8px',
              px: 2,
              py: 0.75,
              width: { xs: 160, sm: 340, md: 420 },
              cursor: 'pointer',
              border: `1px solid ${isLight ? '#EAE6E1' : 'rgba(255,255,255,0.08)'}`,
              transition: 'all 0.18s ease',
              font: 'inherit',
              color: 'text.primary',
              textAlign: 'left',
              appearance: 'none',
              '&:hover': {
                bgcolor: isLight ? '#F2EEE9' : 'rgba(255,255,255,0.08)',
                borderColor: isLight ? '#DFD9D0' : 'rgba(255,255,255,0.12)',
              },
              '&:focus-visible': {
                outline: '2px solid rgba(114,56,61,0.5)',
                outlineOffset: '2px',
              },
            }}
          >
            <SearchIcon sx={{ color: 'text.secondary', mr: 1.25, fontSize: '1rem', flexShrink: 0 }} />
            <Typography
              component="span"
              sx={{
                fontSize: '0.82rem', flex: 1,
                color: 'text.secondary', fontWeight: 500,
                pointerEvents: 'none', userSelect: 'none',
              }}
            >
              Search sarees, SKU, fabric...
            </Typography>
            <Typography
              component="span"
              sx={{
                display: { xs: 'none', sm: 'inline-block' },
                bgcolor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.10)',
                px: 1, py: 0.15,
                borderRadius: '5px',
                fontWeight: 700,
                fontSize: '0.62rem',
                color: 'text.secondary',
                letterSpacing: '0.03em',
                border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.10)'}`,
              }}
            >
              ⌘K
            </Typography>
          </Box>
        </Box>

        {/* ── Right: Actions + User ─────────────────────────── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton
              onClick={handleNotiMenuOpen}
              size="small"
              sx={{ color: 'text.secondary' }}
            >
              <Badge
                badgeContent={notifications.length || null}
                color="error"
                variant={notifications.length > 0 ? 'standard' : 'dot'}
                invisible={notifications.length === 0}
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.6rem', minWidth: 16, height: 16,
                    fontWeight: 800,
                  },
                }}
              >
                <NotificationsNoneOutlinedIcon sx={{ fontSize: '1.2rem' }} />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Theme toggle — shows correct icon for current mode */}
          <Tooltip title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}>
            <IconButton
              onClick={toggleTheme}
              size="small"
              sx={{ color: 'text.secondary' }}
            >
              {isLight
                ? <DarkModeOutlinedIcon sx={{ fontSize: '1.1rem' }} />
                : <LightModeOutlinedIcon sx={{ fontSize: '1.1rem' }} />
              }
            </IconButton>
          </Tooltip>

          {/* Vertical divider */}
          <Box sx={{
            width: 1, height: 22, bgcolor: 'divider', mx: 0.5,
          }} />

          {/* User profile */}
          <Box
            onClick={handleProfileMenuOpen}
            sx={{
              display: 'flex', alignItems: 'center', gap: 1,
              cursor: 'pointer', pl: 0.5, pr: 1, py: 0.5,
              borderRadius: '8px',
              transition: 'background 0.15s ease',
              '&:hover': {
                bgcolor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)',
              },
            }}
          >
            <Box sx={{
              display: { xs: 'none', sm: 'flex' },
              flexDirection: 'column', alignItems: 'flex-end',
            }}>
              <Typography sx={{
                fontWeight: 700, fontSize: '0.82rem',
                color: 'text.primary', lineHeight: 1.2,
              }}>
                {user?.full_name?.split(' ')[0] || 'Admin'}
              </Typography>
              <Typography sx={{
                fontSize: '0.6rem', fontWeight: 800,
                color: 'text.secondary', letterSpacing: '0.07em',
                textTransform: 'uppercase',
              }}>
                {user?.role || 'admin'}
              </Typography>
            </Box>
            <Avatar sx={{
              width: 32, height: 32,
              bgcolor: 'primary.main',
              fontSize: '0.75rem', fontWeight: 800,
              border: '1.5px solid rgba(59,17,26,0.25)',
            }}>
              {userInitials}
            </Avatar>
          </Box>
        </Box>
      </Toolbar>

      {/* ── Notifications Menu ─────────────────────────────────── */}
      <Menu
        anchorEl={notiAnchorEl}
        open={Boolean(notiAnchorEl)}
        onClose={handleNotiMenuClose}
        slotProps={{
          paper: {
            sx: {
              width: 340, maxHeight: 440,
              mt: 1, overflow: 'hidden',
            },
          },
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {/* Header */}
        <Box sx={{
          px: 2.5, py: 1.75,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid', borderColor: 'divider',
        }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
            Notifications
          </Typography>
          {notifications.length > 0 && (
            <Box sx={{
              bgcolor: 'rgba(220,38,38,0.10)', color: 'error.main',
              px: 1, py: 0.2, borderRadius: '5px',
              fontSize: '0.68rem', fontWeight: 800,
            }}>
              {notifications.length} Alert{notifications.length > 1 ? 's' : ''}
            </Box>
          )}
        </Box>

        {/* Items */}
        <Box sx={{ overflowY: 'auto', maxHeight: 340 }}>
          {notifications.length === 0 ? (
            <Box sx={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              py: 5, gap: 1,
            }}>
              <CheckCircleOutlinedIcon sx={{ fontSize: '2rem', color: 'success.main' }} />
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                All systems healthy
              </Typography>
              <Typography variant="caption" color="text.secondary">
                No stock alerts at this time
              </Typography>
            </Box>
          ) : (
            notifications.map((noti) => (
              <MenuItem
                key={noti.id}
                onClick={() => handleNotificationClick(noti.id)}
                sx={{
                  py: 1.5, px: 2,
                  borderBottom: '1px solid', borderColor: 'divider',
                  '&:last-child': { borderBottom: 'none' },
                  alignItems: 'flex-start', gap: 1.5,
                }}
              >
                <Box sx={{
                  mt: 0.25, flexShrink: 0,
                  p: '5px',
                  borderRadius: '6px',
                  bgcolor: noti.type === 'out'
                    ? 'rgba(220,38,38,0.10)'
                    : 'rgba(217,119,6,0.10)',
                }}>
                  {noti.type === 'out'
                    ? <ErrorIcon sx={{ color: 'error.main', fontSize: '0.95rem' }} />
                    : <WarningIcon sx={{ color: 'warning.main', fontSize: '0.95rem' }} />
                  }
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{
                    fontSize: '0.82rem', fontWeight: 700,
                    color: noti.type === 'out' ? 'error.main' : 'warning.dark',
                    mb: 0.25,
                  }}>
                    {noti.title}
                  </Typography>
                  <Typography sx={{
                    fontSize: '0.75rem', color: 'text.secondary',
                    fontWeight: 500, whiteSpace: 'normal', lineHeight: 1.4,
                  }}>
                    {noti.message}
                  </Typography>
                </Box>
              </MenuItem>
            ))
          )}
        </Box>
      </Menu>

      {/* ── User Account Menu ─────────────────────────────────── */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        slotProps={{
          paper: { sx: { width: 230, mt: 1 } },
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: 'text.primary' }}>
            {user?.full_name}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap display="block">
            {user?.email || `@${user?.username}`}
          </Typography>
          <Box sx={{
            mt: 0.75, display: 'inline-block',
            bgcolor: 'rgba(59,17,26,0.08)', color: 'primary.main',
            px: 1, py: 0.15, borderRadius: '4px',
            fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            {user?.role || 'admin'}
          </Box>
        </Box>

        <Box sx={{ p: '6px' }}>
          <MenuItem
            onClick={() => { handleProfileMenuClose(); navigate('/settings'); }}
            sx={{ borderRadius: 1.5 }}
          >
            <ListItemIcon><SettingsOutlinedIcon fontSize="small" /></ListItemIcon>
            <ListItemText
              primary="Settings"
              slotProps={{ primary: { fontSize: '0.84rem', fontWeight: 600 } }}
            />
          </MenuItem>
          <Divider sx={{ my: 0.5 }} />
          <MenuItem
            onClick={handleLogout}
            sx={{ borderRadius: 1.5, color: 'error.main' }}
          >
            <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
            <ListItemText
              primary="Logout"
              slotProps={{ primary: { fontSize: '0.84rem', fontWeight: 700, color: 'error.main' } }}
            />
          </MenuItem>
        </Box>
      </Menu>
    </AppBar>
  );
};

export default Header;
