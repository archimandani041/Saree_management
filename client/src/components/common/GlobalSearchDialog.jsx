/**
 * Global Search Dialog (Ctrl+K)
 * Real-time instant search overlay with quick shortcuts
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { sareeAPI } from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';
import {
  Dialog, DialogContent, InputBase, Box, List, ListItemButton,
  ListItemAvatar, Avatar, ListItemText, Typography, Divider, CircularProgress,
  Chip
} from '@mui/material';
import {
  Search as SearchIcon, SearchOff, Inventory2 as InventoryIcon,
  WarningAmber as WarningIcon, Inbox as InboxIcon, People as PeopleIcon,
  Add as AddIcon
} from '@mui/icons-material';

const QUICK_ACTIONS = [
  { label: 'Browse All Inventory', href: '/sarees', icon: <InventoryIcon fontSize="small" sx={{ color: 'primary.main' }} /> },
  { label: 'Needs Stock Alerts', href: '/low-stock', icon: <WarningIcon fontSize="small" sx={{ color: 'warning.main' }} /> },
  { label: 'Stock Requests Pipeline', href: '/stock-requests', icon: <InboxIcon fontSize="small" sx={{ color: 'info.main' }} /> },
  { label: 'Suppliers Directory', href: '/suppliers', icon: <PeopleIcon fontSize="small" sx={{ color: 'success.main' }} /> },
];

const GlobalSearchDialog = () => {
  const { searchOpen, setSearchOpen } = useApp();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 250);
  const navigate = useNavigate();

  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const { data } = await sareeAPI.getAll({ search: debouncedQuery, limit: 10 });
        setResults(data.sarees || []);
      } catch (error) {
        console.error('Failed to perform search:', error);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  const handleClose = () => {
    setQuery('');
    setResults([]);
    setSearchOpen(false);
  };

  const handleItemClick = (id) => {
    handleClose();
    navigate(`/sarees/${id}`);
  };

  const handleActionClick = (href) => {
    handleClose();
    navigate(href);
  };

  return (
    <Dialog
      open={searchOpen}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          sx: {
            borderRadius: '14px',
            top: { xs: 0, sm: '-10%' },
            boxShadow: (theme) => theme.palette.mode === 'light' ? '0 20px 60px rgba(0,0,0,0.12)' : '0 20px 60px rgba(0,0,0,0.5)',
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper'
          }
        }
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <SearchIcon sx={{ color: 'primary.main', fontSize: 22 }} />
        <InputBase
          placeholder="Search saree name, series code, beam, color, brand, supplier…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          fullWidth
          sx={{ fontSize: '0.95rem', flex: 1, fontWeight: 550 }}
        />
        {loading && <CircularProgress size={18} color="inherit" sx={{ opacity: 0.6 }} />}
      </Box>
      <Divider />
      <DialogContent sx={{ p: 0, maxHeight: 380, overflowY: 'auto' }}>
        {query.trim() === '' ? (
          <Box sx={{ p: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary', px: 1, display: 'block', mb: 1 }}>
              Quick Navigation
            </Typography>
            <List sx={{ py: 0 }}>
              {QUICK_ACTIONS.map((act) => (
                <ListItemButton
                  key={act.href}
                  onClick={() => handleActionClick(act.href)}
                  sx={{
                    borderRadius: '8px',
                    py: 1,
                    px: 1.5,
                    mb: 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '6px', bgcolor: 'action.hover' }}>
                    {act.icon}
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    {act.label}
                  </Typography>
                </ListItemButton>
              ))}
            </List>
          </Box>
        ) : results.length === 0 && !loading ? (
          <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <SearchOff sx={{ fontSize: 36, color: 'text.disabled' }} />
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              No inventory found matching "{query}"
            </Typography>
          </Box>
        ) : (
          <List sx={{ py: 0 }}>
            {results.map((saree) => {
              const totalStock = saree.total_stock ?? saree.current_stock ?? 0;
              const minStock = saree.min_stock ?? saree.minimum_stock ?? 20;
              const isShortage = totalStock <= minStock;

              return (
                <ListItemButton
                  key={saree.id}
                  onClick={() => handleItemClick(saree.id)}
                  sx={{
                    py: 1.25,
                    px: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:last-child': { borderBottom: 'none' },
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      src={saree.image_url || saree.beams?.flatMap(b => b.combinations || []).find(c => c.image_url)?.image_url}
                      variant="rounded"
                      sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: 'sidebar.active', color: 'primary.main', fontSize: '1.1rem' }}
                    >
                      🧵
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontWeight: 750, fontSize: '0.88rem' }} noWrap>
                          {saree.sari_name}
                        </Typography>
                        {saree.brand && (
                          <Chip
                            label={saree.brand}
                            size="small"
                            sx={{
                              height: 16, fontSize: '0.6rem', fontWeight: 800,
                              bgcolor: saree.brand === 'KP' ? 'secondary.light' : 'warning.light',
                              color: saree.brand === 'KP' ? 'secondary.contrastText' : 'warning.dark'
                            }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Code: <Box component="span" sx={{ fontWeight: 800, color: 'primary.main' }}>{saree.series_code}</Box>
                        {saree.beams && saree.beams.length > 0 && (
                          <span> · {saree.beams.length} Beams</span>
                        )}
                      </Typography>
                    }
                  />
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        color: totalStock === 0 ? 'error.main' : isShortage ? 'warning.main' : 'success.main'
                      }}
                    >
                      {totalStock} pcs
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      {isShortage ? 'Low Stock' : 'In Stock'}
                    </Typography>
                  </Box>
                </ListItemButton>
              );
            })}
          </List>
        )}
      </DialogContent>
      <Divider />
      <Box sx={{ px: 2, py: 1, bgcolor: 'action.hover', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem', fontWeight: 600 }}>
          Navigate with mouse or keyboard
        </Typography>
        <Chip label="ESC to close" size="small" sx={{ height: 20, fontSize: '0.64rem', fontWeight: 700 }} />
      </Box>
    </Dialog>
  );
};

export default GlobalSearchDialog;
