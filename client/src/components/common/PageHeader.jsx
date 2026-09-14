/**
 * PageHeader — Consistent page title + subtitle + action area
 * Used on every main content page for visual consistency.
 */
import { Box, Typography, Breadcrumbs, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

const PageHeader = ({
  title,
  subtitle,
  icon,
  breadcrumbs = [], // [{ label, href }]
  actions,
  className,
}) => {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <Box
      className={className}
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        flexWrap: 'wrap',
        gap: 2,
        mb: 3,
      }}
    >
      <Box>
        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <Breadcrumbs
            separator={<NavigateNextIcon fontSize="inherit" sx={{ fontSize: '0.75rem' }} />}
            sx={{ mb: 0.75 }}
            aria-label="breadcrumb"
          >
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return isLast ? (
                <Typography
                  key={crumb.label}
                  sx={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: 'primary.main',
                    letterSpacing: '0.01em',
                  }}
                >
                  {crumb.label}
                </Typography>
              ) : (
                <Link
                  key={crumb.label}
                  underline="hover"
                  onClick={() => crumb.href && navigate(crumb.href)}
                  sx={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: 'text.secondary',
                    cursor: 'pointer',
                    '&:hover': { color: 'primary.main' },
                  }}
                >
                  {crumb.label}
                </Link>
              );
            })}
          </Breadcrumbs>
        )}

        {/* Title row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {icon && (
            <Box
              sx={{
                color: 'primary.main',
                display: 'flex',
                '& .MuiSvgIcon-root': { fontSize: '1.4rem' },
              }}
            >
              {icon}
            </Box>
          )}
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              letterSpacing: '-0.01em',
              color: 'text.primary',
              lineHeight: 1.2,
            }}
          >
            {title}
          </Typography>
        </Box>

        {/* Subtitle */}
        {subtitle && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, fontWeight: 500 }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>

      {/* Actions slot */}
      {actions && (
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          {actions}
        </Box>
      )}
    </Box>
  );
};

export default PageHeader;
