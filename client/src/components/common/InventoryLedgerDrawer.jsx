/**
 * InventoryLedgerDrawer Component
 * Right-side drawer that opens on history row click with full ERP audit trail details,
 * before/after stock breakdown, machine/supplier metadata, and timeline view.
 */
import {
  Drawer, Box, Typography, IconButton, Divider, Chip, Avatar,
  Table, TableBody, TableCell, TableRow, Button, Paper
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ImageIcon from '@mui/icons-material/Image';
import PersonIcon from '@mui/icons-material/Person';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import ReceiptIcon from '@mui/icons-material/Receipt';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { useNavigate } from 'react-router-dom';

const InventoryLedgerDrawer = ({ open, onClose, item, onRollback, onDeleteRecord, onUpdateStock, isAdmin }) => {
  const navigate = useNavigate();

  if (!item) return null;

  const formattedDate = new Date(item.created_at).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
  const formattedTime = new Date(item.created_at).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true
  });

  const sId = item.saree_id;
  const sCode = item.sarees?.series_code || item.series_code || item.details?.sari_number || '—';
  const sName = item.sarees?.sari_name || '—';
  const bName = item.beam_name || item.details?.beam_name || '—';
  const cName = item.combination_name || item.details?.combination_name || '—';
  const imgUrl = item.image_url || item.details?.image_url;

  const isRolledBackOrUndo = item.is_rolled_back || item.is_rollback || item.action === 'Undo' || item.action === 'Rollback';
  const canRollback = !isRolledBackOrUndo && isAdmin &&
    ['Stock', 'Stock Delivery', 'Return', 'Damage', 'Manual Adjustment', 'Increase', 'Decrease', 'Stock Added', 'Delivery'].includes(item.action);

  return (
    <Drawer anchor="right" open={open} onClose={onClose} slotProps={{ backdrop: { invisible: false } }}>
      <Box sx={{ width: { xs: 340, sm: 460 }, p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 800, color: 'primary.main' }}>
              TRANSACTION #{item.id?.slice(0, 12)}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Inventory Audit Detail
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 0.5 }}>
          {/* Main Combination & Saree Banner */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2.5, bgcolor: 'background.default' }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {imgUrl ? (
                <Box component="img" src={imgUrl} sx={{ width: 64, height: 64, borderRadius: 2, objectFit: 'cover' }} />
              ) : (
                <Box sx={{ width: 64, height: 64, borderRadius: 2, bgcolor: 'primary.light', opacity: 0.2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>
                  🧵
                </Box>
              )}
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main' }}>
                  {sCode}
                </Typography>
                <Typography variant="body2" color="text.secondary">{sName}</Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mt: 0.5 }}>
                  Beam: {bName} | Combo: {cName}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Action & Stock Summary Card */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2.5, bgcolor: item.is_rolled_back ? 'error.light' : 'success.light' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>
              Stock Movement
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Opening</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>{item.old_stock} pcs</Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: item.new_stock >= item.old_stock ? 'success.main' : 'error.main' }}>
                →
              </Typography>
              <Box>
                <Typography variant="caption" color="text.secondary">Closing</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>{item.new_stock} pcs</Typography>
              </Box>
              <Chip
                label={`${item.new_stock - item.old_stock >= 0 ? '+' : ''}${item.new_stock - item.old_stock} pcs`}
                color={item.new_stock >= item.old_stock ? 'success' : 'error'}
                sx={{ fontWeight: 800 }}
              />
            </Box>
          </Paper>

          {/* Ledger Attribute Table */}
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>Transaction Attributes</Typography>
          <Table size="small" sx={{ mb: 2.5 }}>
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', width: 140 }}>Action Event</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>{item.action}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Date & Time</TableCell>
                <TableCell>{formattedDate} at {formattedTime}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Performed By</TableCell>
                <TableCell>{item.changed_by_name || 'System'}</TableCell>
              </TableRow>
              {item.supplier_name && (
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Supplier</TableCell>
                  <TableCell>{item.supplier_name}</TableCell>
                </TableRow>
              )}
              {item.customer_name && (
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Customer</TableCell>
                  <TableCell>{item.customer_name}</TableCell>
                </TableRow>
              )}
              {item.machine_name && (
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Machine</TableCell>
                  <TableCell>{item.machine_name}</TableCell>
                </TableRow>
              )}
              {item.invoice_number && (
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Invoice #</TableCell>
                  <TableCell>{item.invoice_number}</TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Remarks / Reason</TableCell>
                <TableCell>{item.details?.remarks || item.reason || 'None recorded'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {/* WhatsApp message snippet if present */}
          {item.whatsapp_message && (
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2.5, bgcolor: 'success.light', borderColor: 'success.main' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <WhatsAppIcon sx={{ color: 'success.main', fontSize: 18 }} />
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'success.dark' }}>
                  RELATED WHATSAPP MESSAGE
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', color: 'success.dark' }}>
                {item.whatsapp_message}
              </Typography>
            </Paper>
          )}

          {/* Navigation Shortcuts */}
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>Navigation & Quick Actions</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            {onUpdateStock && (
              <Button size="small" variant="contained" sx={{ bgcolor: '#25D366', color: 'common.white', fontWeight: 800, '&:hover': { bgcolor: 'success.main' } }} startIcon={<WhatsAppIcon />} onClick={() => { onClose(); onUpdateStock(item); }}>
                Update Stock (WhatsApp)
              </Button>
            )}
            {sId && (
              <Button size="small" variant="outlined" startIcon={<OpenInNewIcon />} onClick={() => navigate(`/sarees/${sId}`)}>
                Open Saree {sCode}
              </Button>
            )}
          </Box>
        </Box>

        {/* Footer Actions */}
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          {canRollback && (
            <Button
              fullWidth
              variant="contained"
              color="error"
              startIcon={<DeleteOutlinedIcon />}
              onClick={() => onRollback(item)}
            >
              Delete / Rollback Event
            </Button>
          )}
          {isAdmin && isRolledBackOrUndo && (
            <Button
              fullWidth
              variant="contained"
              color="error"
              startIcon={<DeleteOutlinedIcon />}
              onClick={() => onDeleteRecord(item)}
            >
              Delete History Record
            </Button>
          )}
          <Button fullWidth variant="outlined" onClick={onClose}>Close</Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default InventoryLedgerDrawer;
