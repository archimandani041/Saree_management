/**
 * StatusBadge — Reusable stock status chip
 * Variants: in-stock, low-stock, out-of-stock, pending, delivery, rollback
 */
import { Chip } from '@mui/material';

const VARIANT_MAP = {
  'in-stock': {
    label: 'In Stock',
    bg: 'success.light',
    color: 'success.dark',
    borderColor: 'success.main',
  },
  'low-stock': {
    label: 'Low Stock',
    bg: 'warning.light',
    color: 'warning.dark',
    borderColor: 'warning.main',
  },
  'out-of-stock': {
    label: 'Out of Stock',
    bg: 'error.light',
    color: 'error.dark',
    borderColor: 'error.main',
  },
  'pending': {
    label: 'Pending',
    bg: 'info.light',
    color: 'info.dark',
    borderColor: 'info.main',
  },
  'delivery': {
    label: 'In Delivery',
    bg: 'info.light',
    color: 'info.dark',
    borderColor: 'info.main',
  },
  'critical': {
    label: 'Critical',
    bg: 'error.light',
    color: 'error.dark',
    borderColor: 'error.main',
  },
  'healthy': {
    label: 'Healthy',
    bg: 'success.light',
    color: 'success.dark',
    borderColor: 'success.main',
  },
  'rollback': {
    label: 'Rollback',
    bg: 'action.hover',
    color: 'text.secondary',
    borderColor: 'divider',
  },
};

/**
 * Determine variant from stock numbers
 */
export const getStockVariant = (total, min) => {
  if (!total || total === 0) return 'out-of-stock';
  if (total <= (min ?? 0)) return 'low-stock';
  return 'in-stock';
};

const StatusBadge = ({
  variant,        // predefined variant key
  label,          // override label
  size = 'small', // 'small' | 'medium'
  sx = {},
}) => {
  const meta = VARIANT_MAP[variant] || VARIANT_MAP['in-stock'];
  const displayLabel = label || meta.label;

  return (
    <Chip
      label={displayLabel}
      size={size}
      sx={{
        bgcolor: meta.bg,
        color: meta.color,
        border: '1px solid',
        borderColor: meta.borderColor,
        fontWeight: 700,
        fontSize: size === 'small' ? '0.67rem' : '0.75rem',
        height: size === 'small' ? 22 : 26,
        letterSpacing: '0.01em',
        borderRadius: 6,
        ...sx,
      }}
    />
  );
};

export default StatusBadge;
