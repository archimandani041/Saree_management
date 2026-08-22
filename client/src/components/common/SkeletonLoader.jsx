/**
 * SkeletonLoader — Polished loading skeletons
 * Variants: table, card-grid, dashboard, list
 */
import { Box, Skeleton, Grid } from '@mui/material';
import { useTheme } from '@mui/material/styles';

/**
 * Table skeleton — shows N placeholder rows
 */
export const TableSkeleton = ({ rows = 6, cols = 5 }) => {
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 2,
          px: 2,
          py: 1.5,
          bgcolor: theme.palette.background.default,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} height={14} sx={{ borderRadius: 2 }} />
        ))}
      </Box>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <Box
          key={rowIdx}
          sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: 2,
            px: 2,
            py: 1.75,
            borderBottom: `1px solid ${theme.palette.divider}`,
            opacity: 1 - rowIdx * 0.12,
          }}
        >
          {Array.from({ length: cols }).map((_, colIdx) => (
            <Skeleton
              key={colIdx}
              height={16}
              width={colIdx === 0 ? '80%' : colIdx === cols - 1 ? '60%' : `${60 + Math.random() * 30}%`}
              sx={{ borderRadius: 2 }}
            />
          ))}
        </Box>
      ))}
    </Box>
  );
};

/**
 * Stat card skeleton — shows N placeholder KPI cards
 */
export const StatCardSkeleton = ({ count = 4 }) => (
  <Grid container spacing={2.5}>
    {Array.from({ length: count }).map((_, i) => (
      <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
        <Box
          sx={{
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '10px',
            p: 2.5,
            minHeight: 128,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
            <Skeleton height={12} width="40%" sx={{ borderRadius: 2 }} />
            <Skeleton variant="rounded" width={32} height={32} sx={{ borderRadius: '7px' }} />
          </Box>
          <Skeleton height={36} width="55%" sx={{ borderRadius: 2, mb: 0.75 }} />
          <Skeleton height={12} width="70%" sx={{ borderRadius: 2 }} />
        </Box>
      </Grid>
    ))}
  </Grid>
);

/**
 * Card grid skeleton — shows N placeholder content cards
 */
export const CardGridSkeleton = ({ count = 6, cols = 3 }) => (
  <Grid container spacing={2.5}>
    {Array.from({ length: count }).map((_, i) => (
      <Grid key={i} size={{ xs: 12, sm: 6, md: Math.round(12 / cols) }}>
        <Box
          sx={{
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '10px',
            p: 2.5,
            opacity: 1 - i * 0.08,
          }}
        >
          <Skeleton variant="rounded" height={120} sx={{ borderRadius: '8px', mb: 2 }} />
          <Skeleton height={18} width="75%" sx={{ borderRadius: 2, mb: 0.75 }} />
          <Skeleton height={14} width="55%" sx={{ borderRadius: 2, mb: 0.75 }} />
          <Skeleton height={14} width="45%" sx={{ borderRadius: 2 }} />
        </Box>
      </Grid>
    ))}
  </Grid>
);

/**
 * List skeleton — vertical list of placeholder items
 */
export const ListSkeleton = ({ rows = 5 }) => {
  const theme = useTheme();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <Box
          key={i}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 2,
            bgcolor: 'background.paper',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: '8px',
            opacity: 1 - i * 0.12,
          }}
        >
          <Skeleton variant="rounded" width={44} height={44} sx={{ borderRadius: '7px', flexShrink: 0 }} />
          <Box sx={{ flex: 1 }}>
            <Skeleton height={16} width="60%" sx={{ borderRadius: 2, mb: 0.5 }} />
            <Skeleton height={12} width="40%" sx={{ borderRadius: 2 }} />
          </Box>
          <Skeleton variant="rounded" width={72} height={28} sx={{ borderRadius: '5px' }} />
        </Box>
      ))}
    </Box>
  );
};

/**
 * Dashboard skeleton — full dashboard loading state
 */
export const DashboardSkeleton = () => (
  <Box sx={{ flexGrow: 1, p: { xs: 1.5, md: 3 }, maxWidth: 1500, mx: 'auto' }}>
    {/* Header */}
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
      <Box>
        <Skeleton height={36} width={180} sx={{ borderRadius: 2, mb: 0.5 }} />
        <Skeleton height={16} width={280} sx={{ borderRadius: 2 }} />
      </Box>
      <Skeleton variant="rounded" width={160} height={38} sx={{ borderRadius: '7px' }} />
    </Box>

    {/* KPI cards */}
    <StatCardSkeleton count={4} />

    {/* Chart + side panel */}
    <Grid container spacing={2.5} sx={{ mt: 0.5, mb: 2.5 }}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Box
          sx={{
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '10px',
            p: 3,
            height: 380,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Skeleton height={20} width="30%" sx={{ borderRadius: 2 }} />
            <Skeleton variant="rounded" width={180} height={32} sx={{ borderRadius: '7px' }} />
          </Box>
          <Skeleton variant="rounded" height="82%" sx={{ borderRadius: '8px' }} />
        </Box>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Box
          sx={{
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '10px',
            p: 3,
            height: 380,
          }}
        >
          <Skeleton height={20} width="55%" sx={{ borderRadius: 2, mb: 0.5 }} />
          <Skeleton height={14} width="75%" sx={{ borderRadius: 2, mb: 3 }} />
          {[1, 2, 3].map(i => (
            <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', mb: 2.5 }}>
              <Box>
                <Skeleton height={12} width={100} sx={{ borderRadius: 2, mb: 0.5 }} />
                <Skeleton height={10} width={80} sx={{ borderRadius: 2 }} />
              </Box>
              <Skeleton height={28} width={60} sx={{ borderRadius: 2 }} />
            </Box>
          ))}
        </Box>
      </Grid>
    </Grid>

    {/* Action rows */}
    <Grid container spacing={2.5}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Box
          sx={{
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '10px',
            p: 2.5,
          }}
        >
          <Skeleton height={18} width="40%" sx={{ borderRadius: 2, mb: 1.5 }} />
          <ListSkeleton rows={4} />
        </Box>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Box
          sx={{
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '10px',
            p: 2.5,
          }}
        >
          <Skeleton height={18} width="50%" sx={{ borderRadius: 2, mb: 1.5 }} />
          <ListSkeleton rows={4} />
        </Box>
      </Grid>
    </Grid>
  </Box>
);

export default { TableSkeleton, StatCardSkeleton, CardGridSkeleton, ListSkeleton, DashboardSkeleton };
