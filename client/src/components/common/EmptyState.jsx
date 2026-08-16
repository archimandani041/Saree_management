/**
 * EmptyState — Beautiful, contextual empty state component
 * Used when there is no data to display on any screen.
 */
import { Box, Typography, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Checkroom as SareeIcon,
  SearchOff as SearchOffIcon,
  History as HistoryIcon,
  CheckCircle as CheckCircleIcon,
  Inventory2 as InventoryIcon,
  LocalShipping as ShippingIcon,
  People as PeopleIcon,
  Inbox as InboxIcon,
} from '@mui/icons-material';

const VARIANTS = {
  'no-products': {
    icon: SareeIcon,
    title: 'No sarees yet',
    description: 'Start building your collection by adding your first saree.',
    cta: 'Add First Saree',
  },
  'no-results': {
    icon: SearchOffIcon,
    title: 'No results found',
    description: 'Try adjusting your search or filters to find what you\'re looking for.',
    cta: null,
  },
  'no-history': {
    icon: HistoryIcon,
    title: 'No stock history',
    description: 'Stock movements will appear here as inventory changes are recorded.',
    cta: null,
  },
  'all-clear': {
    icon: CheckCircleIcon,
    title: 'All stock levels are healthy',
    description: 'No items are currently below their minimum stock thresholds. Great work!',
    cta: null,
    accentColor: '#16A34A',
  },
  'no-inventory': {
    icon: InventoryIcon,
    title: 'No inventory items',
    description: 'No items match the current filters. Try clearing filters or add new products.',
    cta: null,
  },
  'no-suppliers': {
    icon: PeopleIcon,
    title: 'No suppliers added',
    description: 'Add your suppliers to link them with saree combinations for easy reordering.',
    cta: 'Add Supplier',
  },
  'no-requests': {
    icon: InboxIcon,
    title: 'No stock requests',
    description: 'Stock requests created via WhatsApp or manual entry will appear here.',
    cta: null,
  },
  'no-delivery': {
    icon: ShippingIcon,
    title: 'No deliveries found',
    description: 'Delivery records will be shown here once orders are processed.',
    cta: null,
  },
};

const EmptyState = ({
  variant = 'no-results',
  title,
  description,
  cta,
  onCta,
  icon: CustomIcon,
  accentColor,
  compact = false,
}) => {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const meta = VARIANTS[variant] || VARIANTS['no-results'];

  const DisplayIcon = CustomIcon || meta.icon;
  const displayTitle = title || meta.title;
  const displayDescription = description || meta.description;
  const displayCta = cta !== undefined ? cta : meta.cta;
  const iconColor = accentColor || meta.accentColor || theme.palette.primary.main;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: compact ? 4 : 8,
        px: 3,
        textAlign: 'center',
        animation: 'fadeInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
        '@keyframes fadeInUp': {
          from: { opacity: 0, transform: 'translateY(12px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
      }}
    >
      {/* Icon container */}
      <Box
        sx={{
          width: compact ? 56 : 72,
          height: compact ? 56 : 72,
          borderRadius: '18px',
          bgcolor: isLight
            ? `${iconColor}12`
            : `${iconColor}18`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: compact ? 1.5 : 2.5,
          border: `1px solid ${iconColor}22`,
        }}
      >
        <DisplayIcon
          sx={{
            fontSize: compact ? '1.75rem' : '2.25rem',
            color: iconColor,
          }}
        />
      </Box>

      {/* Title */}
      <Typography
        variant={compact ? 'subtitle1' : 'h6'}
        sx={{
          fontFamily: '"Playfair Display", Georgia, serif',
          fontWeight: 700,
          color: 'text.primary',
          mb: 0.75,
          letterSpacing: '-0.01em',
        }}
      >
        {displayTitle}
      </Typography>

      {/* Description */}
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          maxWidth: 380,
          fontWeight: 500,
          lineHeight: 1.6,
          mb: displayCta && onCta ? 2.5 : 0,
        }}
      >
        {displayDescription}
      </Typography>

      {/* CTA */}
      {displayCta && onCta && (
        <Button
          variant="contained"
          onClick={onCta}
          size={compact ? 'small' : 'medium'}
          sx={{
            bgcolor: 'primary.main',
            color: '#fff',
            fontWeight: 700,
            '&:hover': { filter: 'brightness(1.1)', transform: 'translateY(-1px)' },
          }}
        >
          {displayCta}
        </Button>
      )}
    </Box>
  );
};

export default EmptyState;
