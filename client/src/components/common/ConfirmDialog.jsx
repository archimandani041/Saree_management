/**
 * ConfirmDialog — Premium delete/destructive action dialog
 * Shows consequence, requires explicit confirmation
 */
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Warning as WarningIcon, DeleteOutlined as DeleteIcon } from '@mui/icons-material';

const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed? This action cannot be undone.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'delete', // 'delete' | 'warning' | 'info'
  loading = false,
  itemName,
}) => {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';

  const variantConfig = {
    delete: {
      icon: DeleteIcon,
      iconColor: '#DC2626',
      iconBg: 'rgba(220,38,38,0.10)',
      confirmColor: 'error',
      confirmBg: '#DC2626',
      confirmHover: '#B91C1C',
    },
    warning: {
      icon: WarningIcon,
      iconColor: '#D97706',
      iconBg: 'rgba(217,119,6,0.10)',
      confirmColor: 'warning',
      confirmBg: '#D97706',
      confirmHover: '#B45309',
    },
    info: {
      icon: WarningIcon,
      iconColor: '#2563EB',
      iconBg: 'rgba(37,99,235,0.10)',
      confirmColor: 'primary',
      confirmBg: '#3B111A',
      confirmHover: '#2A0B12',
    },
  };

  const config = variantConfig[variant] || variantConfig.delete;
  const IconComponent = config.icon;

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 0.5,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, pt: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '10px',
              bgcolor: config.iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconComponent sx={{ color: config.iconColor, fontSize: '1.2rem' }} />
          </Box>
          <Typography
            sx={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontWeight: 700,
              fontSize: '1.1rem',
              color: 'text.primary',
            }}
          >
            {title}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pb: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, lineHeight: 1.65 }}>
          {message}
        </Typography>

        {itemName && (
          <Box
            sx={{
              mt: 1.5,
              p: 1.5,
              bgcolor: isLight ? 'rgba(59,17,26,0.04)' : 'rgba(220,38,38,0.06)',
              border: `1px solid ${config.iconColor}22`,
              borderRadius: '7px',
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                color: config.iconColor,
                fontSize: '0.84rem',
              }}
            >
              {itemName}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={loading}
          sx={{
            fontWeight: 600,
            color: 'text.secondary',
            borderColor: 'divider',
            '&:hover': { borderColor: 'text.secondary', bgcolor: 'action.hover' },
          }}
        >
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          disabled={loading}
          sx={{
            bgcolor: config.confirmBg,
            color: '#fff',
            fontWeight: 700,
            '&:hover': { bgcolor: config.confirmHover },
          }}
        >
          {loading ? 'Processing...' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
