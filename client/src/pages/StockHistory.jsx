/**
 * StockHistory — Professional Inventory Ledger Page
 *
 * Implements SAP/Odoo style ERP inventory audit trail.
 * Displays all 20 action events, color codes, timeline view, grouping,
 * instant filters, stats header cards, drawer audit views, and export options.
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { stockAPI, sareeAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import InventoryLedgerDrawer from '../components/common/InventoryLedgerDrawer';
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, Typography, FormControl, Select,
  MenuItem, TextField, Chip, Tooltip, IconButton, Snackbar,
  InputAdornment, LinearProgress, Button, Avatar, Grid, Tabs, Tab,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
  Stack
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import FilterListIcon from '@mui/icons-material/FilterList';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import TimelineIcon from '@mui/icons-material/Timeline';
import TableRowsIcon from '@mui/icons-material/TableRows';
import PrintIcon from '@mui/icons-material/Print';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { utils as xlsxUtils, writeFile as xlsxWriteFile } from 'xlsx';

// Action badges and colors configuration for 20 event types
const ACTION_BADGES = {
  'Stock':                   { label: 'STOCK IN', bg: '#DCFCE7', color: '#15803D' },
  'Stock Delivery':          { label: 'STOCK DELIVERY', bg: '#FFEDD5', color: '#C2410C' },
  'Delivery':                { label: 'DELIVERY (MACHINE)', bg: '#DBEAFE', color: '#1D4ED8' },
  'Return':                  { label: 'RETURN', bg: '#F3E8FF', color: '#7E22CE' },
  'Damage':                  { label: 'DAMAGE', bg: '#FEE2E2', color: '#DC2626' },
  'Transfer':                { label: 'TRANSFER', bg: '#E0F2FE', color: '#0369A1' },
  'Manual Adjustment':       { label: 'ADJUSTMENT', bg: '#FEF9C3', color: '#A16207' },
  'WhatsApp Import':         { label: 'WA IMPORT', bg: '#DCFCE7', color: '#16A34A' },
  'WhatsApp Stock Request':  { label: 'WA REQUEST', bg: '#DCFCE7', color: '#16A34A' },
  'Purchase Request Created':{ label: 'PURCHASE REQ', bg: '#DBEAFE', color: '#1D4ED8' },
  'Purchase Received':       { label: 'PURCHASE REC', bg: '#DCFCE7', color: '#15803D' },
  'Combination Created':     { label: 'COMBO CREATE', bg: '#DBEAFE', color: '#1D4ED8' },
  'Combination Edited':      { label: 'COMBO EDIT', bg: '#FEF9C3', color: '#A16207' },
  'Combination Deleted':     { label: 'COMBO DELETE', bg: '#FEE2E2', color: '#DC2626' },
  'Image Uploaded':          { label: 'IMG UPLOAD', bg: '#DBEAFE', color: '#1D4ED8' },
  'Image Replaced':          { label: 'IMG REPLACE', bg: '#FEF9C3', color: '#A16207' },
  'Image Deleted':           { label: 'IMG DELETE', bg: '#FEE2E2', color: '#DC2626' },
  'Rollback':                { label: 'ROLLBACK', bg: '#F3F4F6', color: '#4B5563' },
  'Import Failed':           { label: 'IMPORT FAIL', bg: '#FEE2E2', color: '#DC2626' },
  'Duplicate Updated':       { label: 'DUP UPDATE', bg: '#FFEDD5', color: '#C2410C' },
};

const StockHistory = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [total, setTotal] = useState(0);
  const [viewMode, setViewMode] = useState('ledger'); // 'ledger' | 'timeline'

  // Summary stats
  const [stats, setStats] = useState({
    todayStockAdded: 0, todayDeliveries: 0, todayStockDeliveries: 0,
    todayReturns: 0, todayDamage: 0, todayRollbacks: 0
  });

  // Drawer & Rollback state
  const [selectedDrawerItem, setSelectedDrawerItem] = useState(null);
  const [rollbackModalOpen, setRollbackModalOpen] = useState(false);
  const [targetRollbackItem, setTargetRollbackItem] = useState(null);
  const [rollbackReasonInput, setRollbackReasonInput] = useState('Admin Audit Rollback');
  const [rollbackLoading, setRollbackLoading] = useState(false);
  const [snack, setSnack] = useState('');

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(0); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchStats = async () => {
    try {
      const { data } = await stockAPI.getStats();
      setStats(data);
    } catch (_) {}
  };

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await stockAPI.getHistory({
        page: page + 1, limit: rowsPerPage,
        action: action === 'all' ? undefined : action,
        search: debouncedSearch || undefined
      });
      setHistory(data.history || []);
      setTotal(data.pagination?.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, action, debouncedSearch]);

  useEffect(() => {
    fetchHistory();
    fetchStats();
  }, [fetchHistory]);

  const handleExecuteRollback = async () => {
    if (!targetRollbackItem) return;
    setRollbackLoading(true);
    try {
      const res = await stockAPI.rollback(targetRollbackItem.id, { reason: rollbackReasonInput });
      setSnack(res.data.message || 'Transaction successfully rolled back.');
      setRollbackModalOpen(false);
      setTargetRollbackItem(null);
      fetchHistory();
      fetchStats();
    } catch (err) {
      setSnack(err.response?.data?.error || 'Failed to rollback transaction.');
    } finally {
      setRollbackLoading(false);
    }
  };

  const handleExport = (format) => {
    const rows = history.map(h => ({
      'Transaction ID': h.id,
      'Date': new Date(h.created_at).toLocaleDateString(),
      'Time': new Date(h.created_at).toLocaleTimeString(),
      'Sari Number': h.sarees?.series_code || h.series_code || '',
      'Beam': h.beam_name || '',
      'Combination': h.combination_name || '',
      'Action': h.action,
      'Opening Stock': h.old_stock,
      'Closing Stock': h.new_stock,
      'User': h.changed_by_name || 'System',
      'Supplier': h.supplier_name || '',
      'Customer': h.customer_name || '',
      'Machine': h.machine_name || '',
      'Invoice': h.invoice_number || '',
      'Status': h.is_rolled_back ? 'Rolled Back' : 'Completed'
    }));

    if (format === 'excel') {
      const ws = xlsxUtils.json_to_sheet(rows);
      const wb = xlsxUtils.book_new();
      xlsxUtils.book_append_sheet(wb, ws, 'Inventory Ledger');
      xlsxWriteFile(wb, 'Inventory_Ledger.xlsx');
    } else if (format === 'print') {
      window.print();
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3.5 }, maxWidth: 1400, mx: 'auto' }}>
      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack('')} message={snack} />

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 600, fontSize: { xs: '1.6rem', md: '2rem' } }}>
              Inventory Audit Ledger
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Single source of truth for every sari stock movement, machine delivery, and master edit event.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <Button
              variant={viewMode === 'ledger' ? 'contained' : 'outlined'}
              startIcon={<TableRowsIcon />}
              onClick={() => setViewMode('ledger')}
              size="small"
            >
              Ledger View
            </Button>
            <Button
              variant={viewMode === 'timeline' ? 'contained' : 'outlined'}
              startIcon={<TimelineIcon />}
              onClick={() => setViewMode('timeline')}
              size="small"
            >
              Timeline View
            </Button>
            <Button
              variant="contained"
              startIcon={<FileDownloadIcon />}
              onClick={() => handleExport('excel')}
              size="small"
              sx={{ bgcolor: '#3B111A' }}
            >
              Export Ledger
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Top Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4, md: 2 }}>
          <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>TODAY'S STOCK ADDED</Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'success.main', mt: 0.5 }}>+{stats.todayStockAdded}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4, md: 2 }}>
          <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>TODAY'S DELIVERIES</Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main', mt: 0.5 }}>{stats.todayDeliveries}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4, md: 2 }}>
          <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>STOCK DELIVERIES</Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'error.main', mt: 0.5 }}>-{stats.todayStockDeliveries}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4, md: 2 }}>
          <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>RETURNS</Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#7E22CE', mt: 0.5 }}>+{stats.todayReturns}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4, md: 2 }}>
          <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>DAMAGE</Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'error.main', mt: 0.5 }}>{stats.todayDamage}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4, md: 2 }}>
          <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>ROLLBACKS</Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.secondary', mt: 0.5 }}>{stats.todayRollbacks}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Filter and Search Bar */}
      <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search by Saree, Beam, Combo, Invoice, Machine, Supplier..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ flexGrow: 1, minWidth: 260 }}
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
                endAdornment: search ? (
                  <IconButton size="small" onClick={() => setSearch('')}><ClearIcon /></IconButton>
                ) : null
              }
            }}
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <Select value={action} onChange={e => { setAction(e.target.value); setPage(0); }}>
              <MenuItem value="all">All Action Events (20 Types)</MenuItem>
              <MenuItem value="Stock">Stock In</MenuItem>
              <MenuItem value="Stock Delivery">Stock Delivery</MenuItem>
              <MenuItem value="Delivery">Delivery (Machine)</MenuItem>
              <MenuItem value="Return">Return</MenuItem>
              <MenuItem value="Damage">Damage</MenuItem>
              <MenuItem value="WhatsApp Import">WhatsApp Import</MenuItem>
              <MenuItem value="Combination Created">Combination Created</MenuItem>
              <MenuItem value="Image Uploaded">Image Uploaded</MenuItem>
              <MenuItem value="Rollback">Rollbacks</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Audit Table (ERP Ledger View) */}
      {viewMode === 'ledger' ? (
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
          {loading && <LinearProgress />}
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'background.default' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Tx ID / Date</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Saree & Image</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Beam / Combination</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Action Event</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Stock Movement</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Metadata (User/Machine/Supplier)</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.length === 0 && !loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">No ledger records match your search.</Typography>
                    </TableCell>
                  </TableRow>
                ) : history.map((item) => {
                  const badge = ACTION_BADGES[item.action] || { label: item.action, bg: '#F3F4F6', color: '#374151' };
                  const isRolledBack = item.is_rolled_back;

                  return (
                    <TableRow key={item.id} hover sx={{ opacity: isRolledBack ? 0.6 : 1 }}>
                      <TableCell>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 800, color: 'primary.main', display: 'block' }}>
                          #{item.id?.slice(0, 8)}
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                          {new Date(item.created_at).toLocaleDateString()}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {item.image_url ? (
                            <Box component="img" src={item.image_url} sx={{ width: 32, height: 32, borderRadius: 1, objectFit: 'cover' }} />
                          ) : (
                            <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem' }}>🧵</Avatar>
                          )}
                          <Typography variant="body2" sx={{ fontWeight: 800 }}>
                            {item.sarees?.series_code || item.series_code || '—'}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.beam_name}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.combination_name}</Typography>
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={badge.label}
                          size="small"
                          sx={{ fontWeight: 800, fontSize: '0.65rem', bgcolor: badge.bg, color: badge.color }}
                        />
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>
                          {item.old_stock} → {item.new_stock}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 700 }}>
                          User: {item.changed_by_name || 'System'}
                        </Typography>
                        {item.machine_name && (
                          <Typography variant="caption" color="primary" sx={{ display: 'block' }}>
                            Machine: {item.machine_name}
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <Tooltip title="View Drawer Details">
                            <IconButton size="small" onClick={() => setSelectedDrawerItem(item)}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {isAdmin && !isRolledBack && (
                            <Tooltip title="Rollback Transaction">
                              <IconButton size="small" color="error" onClick={() => { setTargetRollbackItem(item); setRollbackModalOpen(true); }}>
                                <RotateLeftIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={total}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          />
        </Paper>
      ) : (
        /* Timeline View */
        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          {history.map((item) => (
            <Box key={item.id} sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <Typography variant="caption" sx={{ fontFamily: 'monospace', minWidth: 90, color: 'text.secondary', pt: 0.5 }}>
                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>
              <Chip label={item.action} size="small" sx={{ fontWeight: 800 }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>
                  {item.sarees?.series_code || item.series_code} — {item.beam_name} ({item.combination_name})
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Stock: {item.old_stock} → {item.new_stock} | By {item.changed_by_name || 'System'}
                </Typography>
              </Box>
            </Box>
          ))}
        </Paper>
      )}

      {/* Inventory Drawer */}
      <InventoryLedgerDrawer
        open={Boolean(selectedDrawerItem)}
        onClose={() => setSelectedDrawerItem(null)}
        item={selectedDrawerItem}
        isAdmin={isAdmin}
        onRollback={(item) => {
          setSelectedDrawerItem(null);
          setTargetRollbackItem(item);
          setRollbackModalOpen(true);
        }}
      />

      {/* Rollback Dialog */}
      <Dialog open={rollbackModalOpen} onClose={() => setRollbackModalOpen(false)}>
        <DialogTitle sx={{ color: 'error.main', fontWeight: 800 }}>Rollback Inventory Event</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Rolling back this transaction will reverse the stock change and add a permanent audit reversal log.
          </Typography>
          <TextField
            fullWidth
            label="Rollback Reason"
            value={rollbackReasonInput}
            onChange={e => setRollbackReasonInput(e.target.value)}
            size="small"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRollbackModalOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleExecuteRollback} disabled={rollbackLoading}>
            Confirm Rollback
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StockHistory;
