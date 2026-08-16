/**
 * Settings Page — KP Creation Premium
 * Application settings management (Admin only)
 */
import { useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';
import {
  Box, Paper, TextField, Button, Typography, Grid, Alert,
  FormControl, InputLabel, Select, MenuItem, Skeleton, Divider
} from '@mui/material';
import { Save, SettingsOutlined, BusinessOutlined, PaletteOutlined, Inventory2Outlined } from '@mui/icons-material';
import PageHeader from '../components/common/PageHeader';

const SectionCard = ({ icon, title, description, children }) => (
  <Paper
    sx={{
      borderRadius: '10px',
      overflow: 'hidden',
      mb: 2.5,
    }}
    elevation={0}
  >
    {/* Section header */}
    <Box sx={{
      px: 3, py: 2,
      display: 'flex', alignItems: 'center', gap: 1.5,
      borderBottom: '1px solid',
      borderColor: 'divider',
      bgcolor: (theme) => theme.palette.mode === 'light' ? '#FAFAF9' : 'rgba(255,255,255,0.02)',
    }}>
      <Box sx={{
        color: 'primary.main',
        bgcolor: 'rgba(59,17,26,0.08)',
        p: '6px',
        borderRadius: '7px',
        display: 'flex',
        '& .MuiSvgIcon-root': { fontSize: '1.1rem' },
      }}>
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: 'text.primary' }}>
          {title}
        </Typography>
        {description && (
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
            {description}
          </Typography>
        )}
      </Box>
    </Box>

    {/* Section body */}
    <Box sx={{ p: 3 }}>
      {children}
    </Box>
  </Paper>
);

const Settings = () => {
  const [companyName, setCompanyName]       = useState('');
  const [logoUrl, setLogoUrl]               = useState('');
  const [themeMode, setThemeMode]           = useState('light');
  const [defaultMinStock, setDefaultMinStock] = useState(20);

  const [loading, setLoading]  = useState(true);
  const [saving, setSaving]    = useState(false);
  const [error, setError]      = useState('');
  const [success, setSuccess]  = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await settingsAPI.get();
        if (data.settings) {
          setCompanyName(data.settings.company_name || '');
          setLogoUrl(data.settings.logo_url || '');
          setThemeMode(data.settings.theme || 'light');
          setDefaultMinStock(data.settings.default_minimum_stock || 20);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load application settings.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await settingsAPI.update({
        company_name: companyName,
        logo_url: logoUrl,
        theme: themeMode,
        default_minimum_stock: defaultMinStock,
      });
      setSuccess('Settings saved successfully!');
    } catch (err) {
      console.error(err);
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ maxWidth: 700 }}>
        <Box sx={{ mb: 3 }}>
          <Skeleton height={36} width="30%" sx={{ borderRadius: 2, mb: 0.5 }} />
          <Skeleton height={16} width="55%" sx={{ borderRadius: 2 }} />
        </Box>
        {[1, 2, 3].map(i => (
          <Paper key={i} sx={{ borderRadius: '10px', mb: 2.5 }} elevation={0}>
            <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Skeleton height={18} width="40%" sx={{ borderRadius: 2 }} />
            </Box>
            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Skeleton height={56} sx={{ borderRadius: '7px' }} />
              <Skeleton height={56} sx={{ borderRadius: '7px' }} />
            </Box>
          </Paper>
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 700 }}>
      <PageHeader
        title="System Settings"
        icon={<SettingsOutlined />}
        subtitle="Configure company details, branding, and operational defaults"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Settings' }]}
      />

      {error   && <Alert severity="error"   sx={{ mb: 2.5, borderRadius: '8px' }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2.5, borderRadius: '8px' }}>{success}</Alert>}

      <Box component="form" onSubmit={handleSubmit}>
        {/* Company Information */}
        <SectionCard
          icon={<BusinessOutlined />}
          title="Company Information"
          description="Basic details about your business"
        >
          <Grid container spacing={2.5}>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Company / Shop Name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                helperText="This name appears throughout the portal"
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Logo Image URL"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                helperText="Optional: provide a URL to your company logo"
              />
            </Grid>
          </Grid>
        </SectionCard>

        {/* Appearance */}
        <SectionCard
          icon={<PaletteOutlined />}
          title="Appearance"
          description="Customize the visual experience"
        >
          <FormControl fullWidth>
            <InputLabel>Default UI Theme</InputLabel>
            <Select
              value={themeMode}
              label="Default UI Theme"
              onChange={(e) => setThemeMode(e.target.value)}
            >
              <MenuItem value="light">Light Mode</MenuItem>
              <MenuItem value="dark">Dark Mode</MenuItem>
            </Select>
          </FormControl>
        </SectionCard>

        {/* Inventory Defaults */}
        <SectionCard
          icon={<Inventory2Outlined />}
          title="Inventory Defaults"
          description="Operational defaults for stock management"
        >
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Default Minimum Stock Level"
                value={defaultMinStock}
                onChange={(e) => setDefaultMinStock(parseInt(e.target.value) || 0)}
                required
                helperText="Alert threshold for low stock warnings"
                inputProps={{ min: 0, max: 9999 }}
              />
            </Grid>
          </Grid>
        </SectionCard>

        {/* Save button */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, pt: 1 }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            startIcon={<Save />}
            disabled={saving}
            sx={{ py: 1.25, px: 3, fontWeight: 700 }}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default Settings;
