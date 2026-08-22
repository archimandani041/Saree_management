/**
 * Stock Requests — Visual Pipeline (spec §13)
 * Shows a progress stepper (Requested → Confirmed → Received) per request card.
 * Elevated to match the luxury catalog design system (deep burgundy highlights, 8px borders, clean flat surfaces).
 */
import { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Chip, Select, MenuItem, FormControl, InputLabel,
  IconButton, Tooltip, Alert, Skeleton, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, Snackbar, Grid, LinearProgress
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import HistoryIcon from '@mui/icons-material/History';
import InboxIcon from '@mui/icons-material/Inbox';
import { stockRequestAPI } from '../services/api';
import { MOVEMENT_LABELS } from '../constants/terms';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';

const PIPELINE_STEPS = ['Requested', 'Confirmed', 'Received'];
const STATUS_COLORS = { Requested: 'warning.main', Confirmed: 'info.main', Received: 'success.main', Cancelled: 'error.main' };

const PipelineStepper = ({ currentStatus }) => {
  if (currentStatus === 'Cancelled') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main' }} />
        <Typography variant="caption" sx={{ fontWeight: 800, color: 'error.main', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cancelled</Typography>
      </Box>
    );
  }
  const currentIdx = PIPELINE_STEPS.indexOf(currentStatus);
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
      {PIPELINE_STEPS.map((step, idx) => {
        const done = idx <= currentIdx;
        const active = idx === currentIdx;

        return (
          <Box key={step} sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: active ? STATUS_COLORS[step] : (done ? 'text.primary' : 'divider'),
                transition: 'bgcolor 0.2s ease',
              }} />
              <Typography variant="caption" sx={{
                fontWeight: active ? 800 : (done ? 650 : 500),
                color: active ? 'text.primary' : (done ? 'text.primary' : 'text.disabled'),
                fontSize: '0.75rem',
              }}>
                {step}
              </Typography>
            </Box>
            {idx < PIPELINE_STEPS.length - 1 && (
              <Box sx={{ width: { xs: 16, sm: 32 }, height: 1, bgcolor: 'divider' }} />
            )}
          </Box>
        );
      })}
    </Box>
  );
};

const StockRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [receiveConfirm, setReceiveConfirm] = useState(null);
  const [snack, setSnack] = useState('');
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await stockRequestAPI.getAll({ status: statusFilter });
      setRequests(data.requests || []);
    } catch (e) {
      setError('Failed to load stock requests');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleStatusChange = async (id, newStatus) => {
    if (newStatus === 'Received') {
      const req = requests.find(r => r.id === id);
      setReceiveConfirm(req);
      return;
    }
    try {
      await stockRequestAPI.updateStatus(id, { status: newStatus });
      setSnack(`Status updated to ${newStatus}`);
      fetchRequests();
    } catch (e) {
      setError('Failed to update status');
    }
  };

  const confirmReceive = async () => {
    if (!receiveConfirm) return;
    setActionLoading(true);
    try {
      await stockRequestAPI.updateStatus(receiveConfirm.id, { status: 'Received' });
      setSnack('Marked as Received — stock updated');
      setReceiveConfirm(null);
      fetchRequests();
    } catch (e) {
      setError('Failed to mark as received');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await stockRequestAPI.delete(deleteId);
      setDeleteId(null);
      setSnack('Request deleted');
      fetchRequests();
    } catch (e) {
      setError('Failed to delete request');
    } finally {
      setActionLoading(false);
    }
  };

  const openWhatsApp = (req) => {
    const mobile = (req.suppliers?.mobile || '').replace(/\D/g, '');
    if (!mobile) return;
    const msg = req.whatsapp_message || '';
    window.open(`https://wa.me/${mobile}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const getMovementLabel = (req) => {
    if (req.movement_type === 'DELIVERY_OUT' || req.notes?.startsWith('DELIVERY_OUT')) return 'Delivery Out';
    return 'Stock In';
  };

  // Stats
  const stats = { Requested: 0, Confirmed: 0, Received: 0, Cancelled: 0 };
  requests.forEach(r => { if (stats[r.status] !== undefined) stats[r.status]++; });

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 0, md: 1 }, py: 1 }}>
      {/* Header */}
      <PageHeader
        title="Stock Requests"
        icon={<InboxIcon />}
        subtitle="Track supplier orders from request to warehouse receipt"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Stock Requests' }]}
        actions={
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="filter-status-label" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>Filter Status</InputLabel>
            <Select
              labelId="filter-status-label"
              value={statusFilter}
              label="Filter Status"
              onChange={e => setStatusFilter(e.target.value)}
              sx={{
                borderRadius: '8px',
                fontSize: '0.84rem',
                fontWeight: 650,
              }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="Requested">Requested</MenuItem>
              <MenuItem value="Confirmed">Confirmed</MenuItem>
              <MenuItem value="Received">Received</MenuItem>
              <MenuItem value="Cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
        }
      />

      {/* Stats pills */}
      <Grid container spacing={2} sx={{ mb: 3.5 }}>
        {Object.entries(stats).map(([status, count]) => {
          const isFilterActive = statusFilter === status;
          return (
            <Grid size={{ xs: 6, sm: 3 }} key={status}>
              <Paper
                onClick={() => setStatusFilter(isFilterActive ? '' : status)}
                sx={{
                  p: 2.5,
                  borderRadius: '10px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: isFilterActive ? 'primary.main' : 'divider',
                  bgcolor: isFilterActive ? 'sidebar.active' : 'background.paper',
                  boxShadow: 'none',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: (theme) => theme.palette.surface?.shadowHover || '0 4px 16px rgba(59,17,26,0.06)',
                  }
                }}
              >
                <Typography
                  variant="h2"
                  sx={{
                    fontFamily: '"Playfair Display", Georgia, serif',
                    fontWeight: 700,
                    fontSize: '2rem',
                    mb: 0.5,
                    color: 'text.primary'
                  }}
                >
                  {count}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    fontSize: '0.68rem',
                    color: 'text.secondary'
                  }}
                >
                  {status}
                </Typography>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>{error}</Alert>}

      {loading && requests.length > 0 && (
        <LinearProgress sx={{ height: 2, mb: 3, borderRadius: 0 }} />
      )}

      {/* Request cards */}
      {loading && requests.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[1, 2, 3].map(i => <Skeleton key={i} variant="rounded" height={130} sx={{ borderRadius: '10px' }} />)}
        </Box>
      ) : requests.length === 0 ? (
        <Paper sx={{ p: 4, borderRadius: '10px' }}>
          <EmptyState
            variant="no-products"
            title="No stock requests found"
            description="When low stock items are ordered via WhatsApp, requests will be tracked here in real-time."
          />
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {requests.map(req => {
            const movementLabel = getMovementLabel(req);
            const isDelivery = movementLabel === 'Delivery Out';

            return (
              <Paper
                key={req.id}
                sx={{
                  p: 2.5,
                  borderRadius: '10px',
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  boxShadow: 'none',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                  '&:hover': {
                    borderColor: 'primary.light',
                    boxShadow: (theme) => theme.palette.surface?.shadowHover || '0 4px 16px rgba(59,17,26,0.06)'
                  }
                }}
              >
                {/* Top row: Stepper + Date */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
                  <PipelineStepper currentStatus={req.status} />
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.78rem' }}>
                    {new Date(req.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {' · '}
                    {new Date(req.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </Typography>
                </Box>

                {/* Details grid layout */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid size={{ xs: 12, md: 7 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 0.75 }}>
                      <Typography
                        variant="h3"
                        sx={{
                          fontSize: '1.2rem',
                          fontWeight: 800,
                          color: 'text.primary',
                          fontFamily: '"Plus Jakarta Sans", sans-serif'
                        }}
                      >
                        {req.series_code}
                      </Typography>
                      <Chip
                        label={movementLabel.toUpperCase()}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.62rem',
                          fontWeight: 800,
                          borderRadius: '4px',
                          bgcolor: isDelivery ? (theme) => alpha(theme.palette.warning.main, 0.12) : (theme) => alpha(theme.palette.success.main, 0.12),
                          color: isDelivery ? 'warning.dark' : 'success.main',
                        }}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 550 }}>
                      {req.beam_name} · {req.combination_name || 'Combination'}
                    </Typography>
                  </Grid>

                  {/* Quantity and Supplier columns */}
                  <Grid size={{ xs: 6, md: 2.5 }} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'center' } }}>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary', display: 'block', mb: 0.25 }}>
                        QTY
                      </Typography>
                      <Typography
                        variant="h4"
                        sx={{
                          fontFamily: '"Playfair Display", Georgia, serif',
                          fontWeight: 700,
                          fontSize: '1.35rem',
                          color: isDelivery ? 'warning.main' : 'success.main'
                        }}
                      >
                        {isDelivery ? '−' : '+'}{req.requested_qty} pcs
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 6, md: 2.5 }} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'center' } }}>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary', display: 'block', mb: 0.25 }}>
                        SUPPLIER
                      </Typography>
                      <Typography
                        variant="h4"
                        sx={{
                          fontFamily: '"Playfair Display", Georgia, serif',
                          fontWeight: 700,
                          fontSize: '1.25rem',
                          color: 'text.primary'
                        }}
                      >
                        {req.suppliers?.name || '—'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Actions row */}
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                  {req.status !== 'Received' && req.status !== 'Cancelled' && (
                    <>
                      {req.suppliers?.mobile && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="success"
                          startIcon={<WhatsAppIcon sx={{ fontSize: 16 }} />}
                          onClick={() => openWhatsApp(req)}
                          sx={{
                            fontWeight: 800,
                            borderRadius: '6px',
                            px: 2,
                            py: 0.6,
                            fontSize: '0.78rem',
                          }}
                        >
                          WhatsApp
                        </Button>
                      )}
                      {req.status === 'Requested' && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleStatusChange(req.id, 'Confirmed')}
                          sx={{
                            fontWeight: 800,
                            borderRadius: '6px',
                            px: 2,
                            py: 0.6,
                            fontSize: '0.78rem',
                          }}
                        >
                          Confirm
                        </Button>
                      )}
                      {(req.status === 'Requested' || req.status === 'Confirmed') && (
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                          onClick={() => handleStatusChange(req.id, 'Received')}
                          sx={{
                            fontWeight: 800,
                            borderRadius: '6px',
                            px: 2.5,
                            py: 0.6,
                            fontSize: '0.78rem',
                          }}
                        >
                          Mark Received
                        </Button>
                      )}
                    </>
                  )}
                  <Tooltip title="Delete Request">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setDeleteId(req.id)}
                      sx={{
                        ml: 'auto',
                        borderRadius: '6px',
                        border: '1px solid',
                        borderColor: 'error.light',
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}

      {/* Receive confirmation dialog (spec §13) */}
      <Dialog open={!!receiveConfirm} onClose={() => setReceiveConfirm(null)} slotProps={{ paper: { sx: { borderRadius: '10px', p: 1 } } }}>
        <DialogTitle sx={{ fontWeight: 800, fontFamily: '"Playfair Display", Georgia, serif' }}>
          Confirm Stock Receipt
        </DialogTitle>
        <DialogContent>
          {receiveConfirm && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600 }}>
                {receiveConfirm.series_code} — {receiveConfirm.beam_name} · {receiveConfirm.combination_name}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: 2, bgcolor: 'action.hover', borderRadius: '8px', border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 550 }}>Current Stock</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{receiveConfirm.current_stock ?? '—'} pcs</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 550 }}>Receiving</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>+{receiveConfirm.requested_qty} pcs</Typography>
                </Box>
                <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1.5, display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>New Stock</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main' }}>{(receiveConfirm.current_stock ?? 0) + receiveConfirm.requested_qty} pcs</Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setReceiveConfirm(null)} variant="outlined" disabled={actionLoading}>
            Cancel
          </Button>
          <Button onClick={confirmReceive} variant="contained" disabled={actionLoading}>
            {actionLoading ? 'Updating…' : 'Confirm & Update Stock'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onClose={() => !actionLoading && setDeleteId(null)} slotProps={{ paper: { sx: { borderRadius: '10px' } } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Delete Request?</DialogTitle>
        <DialogContent sx={{ color: 'text.secondary' }}>This will permanently delete the stock request record.</DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDeleteId(null)} variant="outlined" disabled={actionLoading}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={actionLoading}>
            {actionLoading ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')} message={snack} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Box>
  );
};

export default StockRequests;
