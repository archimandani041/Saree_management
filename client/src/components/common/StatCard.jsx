/**
 * StatCard — Premium KPI Card Component
 * Used throughout Dashboard and key overview screens.
 * Shows: icon, label, value, sublabel, and optional trend chip.
 */
import { Box, Typography, Chip, Skeleton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

const StatCard = ({
  label,
  value,
  unit,
  sublabel,
  icon,
  tint,
  trendPercent,
  loading = false,
  onClick,
}) => {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';

  const hasTrend = typeof trendPercent === 'number';
  const isPositive = hasTrend && trendPercent >= 0;

  return (
    <Box
      onClick={onClick}
      sx={{
        bgcolor: 'background.paper',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: '10px',
        p: 2.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.75,
        minHeight: 128,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.22s ease, border-color 0.22s ease, transform 0.22s ease',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${tint}CC, ${tint}44)`,
          opacity: 0,
          transition: 'opacity 0.22s ease',
        },
        '&:hover': onClick ? {
          boxShadow: `0 4px 20px rgba(59,17,26,0.08)`,
          borderColor: isLight ? tint + '55' : 'rgba(216,202,186,0.15)',
          transform: 'translateY(-2px)',
          '&::before': { opacity: 1 },
        } : {},
      }}
    >
      {/* Header row */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Typography
          sx={{
            fontSize: '0.67rem',
            fontWeight: 800,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'text.secondary',
          }}
        >
          {label}
        </Typography>

        {/* Icon badge */}
        <Box
          sx={{
            color: tint,
            bgcolor: `${tint}18`,
            p: '6px',
            borderRadius: '7px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '& .MuiSvgIcon-root': { fontSize: '1.05rem' },
          }}
        >
          {icon}
        </Box>
      </Box>

      {/* Value */}
      {loading ? (
        <Skeleton width="60%" height={40} />
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: '2rem',
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              color: 'text.primary',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {value}
          </Typography>
          {unit && (
            <Typography
              component="span"
              sx={{ fontSize: '0.88rem', fontWeight: 500, color: 'text.secondary' }}
            >
              {unit}
            </Typography>
          )}
        </Box>
      )}

      {/* Sublabel + trend */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minHeight: 22 }}>
        {hasTrend && !loading && (
          <Chip
            icon={
              isPositive
                ? <TrendingUp sx={{ fontSize: '0.75rem !important', ml: '4px !important' }} />
                : <TrendingDown sx={{ fontSize: '0.75rem !important', ml: '4px !important' }} />
            }
            label={`${Math.abs(trendPercent)}%`}
            size="small"
            sx={{
              height: 20,
              fontSize: '0.65rem',
              fontWeight: 800,
              borderRadius: '5px',
              bgcolor: isPositive
                ? 'rgba(22,163,74,0.12)'
                : 'rgba(220,38,38,0.10)',
              color: isPositive ? 'success.main' : 'error.main',
              '& .MuiChip-icon': { color: 'inherit' },
            }}
          />
        )}
        {sublabel && (
          <Typography
            sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 500 }}
          >
            {sublabel}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default StatCard;
