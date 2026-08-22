import { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Grid, Chip, Alert, Snackbar,
  Avatar, Tooltip, Skeleton, InputAdornment, LinearProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PhoneIcon from '@mui/icons-material/Phone';
import BusinessIcon from '@mui/icons-material/Business';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import SearchIcon from '@mui/icons-material/Search';
import PeopleIcon from '@mui/icons-material/People';
import { supplierAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';

const EMPTY_FORM = { name: '', company_name: '', mobile: '', email: '', address: '', notes: '' };

const Suppliers = () => {
  const { isAdmin, isStaff } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [snack, setSnack] = useState('');

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supplierAPI.getAll();
      setSuppliers(data.suppliers || []);
    } catch (e) {
      setError('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

  const openCreate = () => { setEditId(null); setForm(EMPTY_FORM); setError(''); setDialogOpen(true); };
  const openEdit = (s) => { setEditId(s.id); setForm({ name: s.name, company_name: s.company_name || '', mobile: s.mobile, email: s.email || '', address: s.address || '', notes: s.notes || '' }); setError(''); setDialogOpen(true); };
  const openDelete = (id) => { setDeleteId(id); setDeleteOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Supplier name is required'); return; }
    if (!form.mobile.trim()) { setError('Mobile number is required'); return; }
    setSaving(true); setError('');
    try {
      if (editId) {
        await supplierAPI.update(editId, form);
        setSnack('Supplier updated successfully');
      } else {
        await supplierAPI.create(form);
        setSnack('Supplier created successfully');
      }
      setDialogOpen(false);
      fetchSuppliers();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to save supplier');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await supplierAPI.delete(deleteId);
      setDeleteOpen(false);
      setSnack('Supplier removed');
      fetchSuppliers();
    } catch (e) {
      setError('Failed to delete supplier');
    }
  };

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.company_name || '').toLowerCase().includes(search.toLowerCase()) ||
    s.mobile.includes(search)
  );

  return (
    <Box>
      {/* Header */}
      <PageHeader
        title="Suppliers & Weavers"
        icon={<PeopleIcon />}
        subtitle={`${suppliers.length} active suppliers · Coordinate stock orders & fabric contacts`}
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Suppliers' }]}
        actions={
          (isAdmin || isStaff) && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} size="small">
              Add Supplier
            </Button>
          )
        }
      />

      {/* Search */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: '10px' }}>
        <TextField
          fullWidth size="small" placeholder="Search by name, company, or mobile..."
          value={search} onChange={e => setSearch(e.target.value)}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
        />
      </Paper>

      {loading && suppliers.length > 0 && (
        <LinearProgress sx={{ height: 2, mb: 2, borderRadius: 0 }} />
      )}
      {/* Table */}
      <Paper sx={{ borderRadius: '10px', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Supplier</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Company</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Mobile / WhatsApp</TableCell>
                {(isAdmin || isStaff) && <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && suppliers.length === 0 ? (
                [...Array(4)].map((_, i) => (
                  <TableRow key={i}>
                    {[1, 2, 3, 4].map(j => <TableCell key={j}><Skeleton /></TableCell>)}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                    <EmptyState
                      variant={search ? 'no-results' : 'no-products'}
                      title={search ? 'No suppliers match your search' : 'No suppliers registered'}
                      description={search ? 'Try searching with another keyword or mobile number.' : 'Add your primary fabric weavers and yarn suppliers.'}
                      onCta={search ? undefined : openCreate}
                    />
                  </TableCell>
                </TableRow>
              ) : filtered.map(s => (
                <TableRow key={s.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 38, height: 38, fontSize: '0.85rem', fontWeight: 800 }}>
                        {s.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontWeight: 750, color: 'text.primary' }}>{s.name}</Typography>
                        {s.address && <Typography variant="caption" color="text.secondary">{s.address}</Typography>}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {s.company_name ? (
                      <Chip icon={<BusinessIcon sx={{ fontSize: '0.9rem !important' }} />} label={s.company_name} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Tooltip title="Direct WhatsApp Message">
                        <IconButton size="small" color="success"
                          onClick={() => {
                            let num = s.mobile.replace(/[\s\-()]/g, '');
                            if (!num.startsWith('+') && !num.startsWith('91') && num.replace(/\D/g, '').length === 10) {
                              num = '91' + num;
                            }
                            num = num.replace(/\D/g, '');
                            window.open(`https://wa.me/${num}`, '_blank');
                          }}
                        >
                          <WhatsAppIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Typography variant="body2" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{s.mobile}</Typography>
                    </Box>
                  </TableCell>
                  {(isAdmin || isStaff) && (
                    <TableCell align="right">
                      <Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => openEdit(s)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => openDelete(s.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: '10px', p: 1 } } }}>
        <DialogTitle sx={{ fontWeight: 800, fontFamily: '"Playfair Display", Georgia, serif' }}>{editId ? 'Edit Supplier' : 'Add New Supplier'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Supplier Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><PersonIcon color="action" fontSize="small" /></InputAdornment> } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Company Name" value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><BusinessIcon color="action" fontSize="small" /></InputAdornment> } }} />
            </Grid>
            <Grid size={12}>
              <TextField fullWidth label="Mobile Number *" value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))}
                placeholder="+91XXXXXXXXXX"
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><PhoneIcon color="action" fontSize="small" /></InputAdornment> } }} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} variant="outlined">Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : editId ? 'Update Supplier' : 'Create Supplier'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} slotProps={{ paper: { sx: { borderRadius: '10px' } } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Remove Supplier?</DialogTitle>
        <DialogContent sx={{ color: 'text.secondary' }}>This will deactivate the supplier and remove them from all combination links.</DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setDeleteOpen(false)} variant="outlined">Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Remove</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')} message={snack} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Box>
  );
};

export default Suppliers;
