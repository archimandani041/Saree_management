import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sareeAPI } from '../services/api';
import { supabase } from '../services/supabase';
import RequestStockDialog from '../components/common/RequestStockDialog';
import { getStockHealth } from '../constants/terms';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';
import { ListSkeleton } from '../components/common/SkeletonLoader';

import {
  Box, Paper, Typography, Chip, Button, LinearProgress
} from '@mui/material';
import { WarningAmber, WhatsApp as WhatsAppIcon, Visibility as ViewIcon } from '@mui/icons-material';

const LowStock = () => {
  const navigate = useNavigate();
  const [sarees, setSarees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Request Stock Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCombo, setSelectedCombo] = useState(null);
  const [selectedBeamName, setSelectedBeamName] = useState('');
  const [selectedSeriesCode, setSelectedSeriesCode] = useState('');
  const [selectedSareeId, setSelectedSareeId] = useState('');


  const fetchLowStockSarees = async () => {
    setLoading(true);
    try {
      const { data } = await sareeAPI.getAll({ status: 'low', limit: 100 });
      setSarees(data.sarees || []);
    } catch (error) {
      console.error('Failed to load low stock sarees:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLowStockSarees(); }, []);

  // Real-time subscriptions
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel('realtime-low-stock')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'combinations' }, () => fetchLowStockSarees())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sarees' }, () => fetchLowStockSarees())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  // Build a flat list of low-stock combinations across all sarees
  const lowItems = [];
  sarees.forEach(saree => {
    (saree.beams || []).forEach(beam => {
      (beam.combinations || []).forEach(combo => {
        const stock = combo.current_stock ?? 0;
        const min = combo.minimum_stock ?? 20;
        if (stock <= min) {
          lowItems.push({ saree, beam, combo, stock, min, shortage: Math.max(0, min - stock) });
        }
      });
    });
    // Also include sarees with aggregated low stock but no combination-level data
    if ((!saree.beams || saree.beams.length === 0) && (saree.total_stock ?? 0) <= (saree.min_stock ?? 20)) {
      lowItems.push({ saree, beam: null, combo: null, stock: saree.total_stock ?? 0, min: saree.min_stock ?? 20, shortage: Math.max(0, (saree.min_stock ?? 20) - (saree.total_stock ?? 0)) });
    }
  });

  // Sort: out of stock first, then by shortage desc
  lowItems.sort((a, b) => {
    if (a.stock === 0 && b.stock !== 0) return -1;
    if (b.stock === 0 && a.stock !== 0) return 1;
    return b.shortage - a.shortage;
  });

  const openRequest = (item) => {
    if (!item.combo) {
      navigate(`/sarees/${item.saree.id}`);
      return;
    }
    setSelectedCombo({ ...item.combo, brand: item.saree.brand || item.combo.brand });
    setSelectedBeamName(item.beam?.beam_name || 'Beam');
    setSelectedSeriesCode(item.saree.series_code || '');
    setSelectedSareeId(item.saree.id);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <PageHeader
          title="Needs Stock"
          icon={<WarningAmber />}
          subtitle="Items below minimum stock levels — take action immediately."
        />
        <ListSkeleton rows={5} />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Needs Stock"
        icon={<WarningAmber />}
        subtitle={`${lowItems.length} item${lowItems.length !== 1 ? 's' : ''} below minimum stock levels. Take action immediately.`}
      />

      {lowItems.length === 0 ? (
        <EmptyState
          variant="all-clear"
          title="All stock levels are healthy!"
          description="No items are currently below their minimum stock thresholds. Great work keeping inventory topped up!"
        />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {lowItems.map((item, idx) => {
            const health = getStockHealth(item.stock, item.min);
            const isCritical = item.stock === 0;
            const pct = item.min > 0 ? Math.round((item.stock / item.min) * 100) : 0;

            return (
              <Box
                key={`${item.saree.id}-${item.combo?.id || idx}`}
                sx={{
                  p: { xs: 2, sm: 2.5 },
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderLeft: `3px solid ${health.color}`,
                  borderRadius: '10px',
                  transition: 'box-shadow 0.18s ease',
                  '&:hover': { boxShadow: '0 4px 20px rgba(59,17,26,0.07)' },
                }}
              >
                {/* Top: severity badge */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, cursor: 'pointer', '&:hover': { color: 'primary.main' } }} onClick={() => navigate(`/sarees/${item.saree.id}`)}>
                        {item.saree.series_code}
                      </Typography>
                      <Chip
                        label={isCritical ? 'CRITICAL' : 'LOW'}
                        size="small"
                        sx={{
                          height: 20, fontSize: '0.62rem', fontWeight: 800,
                          bgcolor: isCritical ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                          color: isCritical ? 'error.main' : 'warning.dark'
                        }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      {item.beam ? `${item.beam.beam_name} · ` : ''}{item.combo?.combination_name || item.saree.sari_name || 'Unnamed'}
                    </Typography>

                    {/* Saree Combination Colors */}
                    {item.combo?.combination_colors && item.combo.combination_colors.length > 0 && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6, mt: 1 }}>
                        {item.combo.combination_colors.map((col, cIdx) => (
                          <Chip
                            key={col.id || cIdx}
                            label={`${col.f_number || `F-${cIdx + 1}`}: ${col.color_name}${col.company_name ? ` (${col.company_name})` : ''}`}
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              bgcolor: 'rgba(59, 130, 246, 0.08)',
                              color: '#1E40AF',
                              border: '1px solid rgba(59, 130, 246, 0.2)',
                              borderRadius: '6px'
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                </Box>

                {/* Stock info */}
                <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: health.color }}>{item.stock} pcs</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Minimum</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>{item.min} pcs</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Shortage</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: 'error.main' }}>−{item.shortage} pcs</Typography>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 120 }}>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(pct, 100)}
                      sx={{
                        height: 6, borderRadius: 3, bgcolor: 'action.hover',
                        '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: health.color }
                      }}
                    />
                  </Box>
                </Box>

                {/* Action */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<WhatsAppIcon />}
                    onClick={() => openRequest(item)}
                    sx={{ fontWeight: 700, borderRadius: '6px', textTransform: 'none', bgcolor: '#16A34A', '&:hover': { bgcolor: '#15803D' } }}
                  >
                    Request Stock
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<ViewIcon />}
                    onClick={() => navigate(`/sarees/${item.saree.id}`)}
                    sx={{ fontWeight: 600, borderRadius: '6px', textTransform: 'none' }}
                  >
                    View
                  </Button>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Request Stock Dialog — opens inline, user stays on this page */}
      <RequestStockDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        combination={selectedCombo}
        beamName={selectedBeamName}
        seriesCode={selectedSeriesCode}
        sareeId={selectedSareeId}
        initialMovementType="STOCK"
        onSuccess={() => {
          fetchLowStockSarees();
          setDialogOpen(false);
        }}
      />
    </Box>
  );
};

export default LowStock;
