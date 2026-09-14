/**
 * StatusBadge — Reusable stock status chip
 * Variants: in-stock, low-stock, out-of-stock, pending, delivery, rollback
 */
import { Chip } from '@mui/material';

const VARIANT_MAP = {
  'in-stock': {
    label: 'In Stock',
    bg: 'rgba(22,163,74,0.10)',
    color: '#14532D',
    border: '1px solid rgba(22,163,74,0.22)',
  },
  'low-stock': {
    label: 'Low Stock',
    bg: 'rgba(217,119,6,0.10)',
    color: '#78350F',
    border: '1px solid rgba(217,119,6,0.22)',
  },
  'out-of-stock': {
    label: 'Out of Stock',
    bg: 'rgba(220,38,38,0.10)',
    color: '#7F1D1D',
    border: '1px solid rgba(220,38,38,0.20)',
  },
  'pending': {
    label: 'Pending',
    bg: 'rgba(37,99,235,0.09)',
    color: '#1E3A8A',
    border: '1px solid rgba(37,99,235,0.18)',
  },
  'delivery': {
    label: 'In Delivery',
    bg: 'rgba(37,99,235,0.09)',
    color: '#1E3A8A',
    border: '1px solid rgba(37,99,235,0.18)',
  },
  'critical': {
    label: 'Critical',
    bg: 'rgba(220,38,38,0.12)',
    color: '#7F1D1D',
    border: '1px solid rgba(220,38,38,0.24)',
  },
  'healthy': {
    label: 'Healthy',
    bg: 'rgba(22,163,74,0.10)',
    color: '#14532D',
    border: '1px solid rgba(22,163,74,0.22)',
  },
  'rollback': {
    label: 'Rollback',
    bg: 'rgba(107,114,128,0.10)',
    color: '#374151',
    border: '1px solid rgba(107,114,128,0.18)',
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
        border: meta.border,
        fontWeight: 700,
        fontSize: size === 'small' ? '0.67rem' : '0.75rem',
        height: size === 'small' ? 22 : 26,
        letterSpacing: '0.01em',
        borderRadius: '5px',
        ...sx,
      }}
    />
  );
};

export default StatusBadge;
