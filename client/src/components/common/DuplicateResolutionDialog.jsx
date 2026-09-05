/**
 * DuplicateResolutionDialog
 *
 * A universal dialog shown whenever a duplicate or similar entry is detected.
 * Covers all 6 levels from the spec:
 *
 *  L1  – Saree already exists         → Open Existing / Cancel
 *  L2  – Beam already exists          → Add to Existing Beam / Cancel
 *  L3  – Exact combination duplicate  → Update Existing / Create New / Skip / Cancel
 *  L4  – Smart color match (100%)     → same as L3
 *  L5  – Image conflict               → Replace Image / Keep Existing / Cancel
 *  L6  – WhatsApp import: SIMILAR     → Update Existing / Create New / Skip / Cancel
 *
 * Props:
 *   open        {boolean}
 *   onClose     {() => void}
 *   conflict    {object}   — see below
 *   onResolve   {(resolution: string) => void}
 *
 * conflict shape:
 * {
 *   level: 'SAREE' | 'BEAM' | 'DUPLICATE' | 'SIMILAR' | 'IMAGE_CONFLICT',
 *   entry: { beam_name, series_code, combination_name, stock, colors[] },
 *   existingId?: string,
 *   existingCode?: string,
 *   existingName?: string,
 *   existingBeamId?: string,
 *   existingBeamName?: string,
 *   existingCombo?: { id, combination_name, image_url, combination_colors[] },
 *   score?: number,
 *   diff?: { added[], removed[], changed[], unchanged[] }
 * }
 */
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Button, Chip, Divider, Alert,
  Table, TableBody, TableCell, TableHead, TableRow,
  LinearProgress, Fade,
} from '@mui/material';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditNoteIcon from '@mui/icons-material/EditNote';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import ImageIcon from '@mui/icons-material/Image';

// ── Status color / icon config ─────────────────────────────────
const STATUS_CONFIG = {
  SAREE:         { color: '#DC2626', icon: <ErrorRoundedIcon />,         label: 'Saree Already Exists',      bg: '#FEF2F2' },
  BEAM:          { color: '#D97706', icon: <WarningAmberRoundedIcon />,  label: 'Beam Already Exists',       bg: '#FFFBEB' },
  DUPLICATE:     { color: '#DC2626', icon: <ErrorRoundedIcon />,         label: 'Exact Duplicate',           bg: '#FEF2F2' },
  SIMILAR:       { color: '#D97706', icon: <WarningAmberRoundedIcon />,  label: 'Similar Combination',       bg: '#FFFBEB' },
  IMAGE_CONFLICT:{ color: '#2563EB', icon: <InfoRoundedIcon />,          label: 'Image Conflict',            bg: '#EFF6FF' },
};

// ── Diff row helpers ───────────────────────────────────────────
const DiffTable = ({ diff }) => {
  if (!diff) return null;
  const rows = [];

  (diff.unchanged || []).forEach((c) =>
    rows.push({ type: 'unchanged', f: c.f_number, colorName: c.color_name, company: c.company_name }));
  (diff.changed || []).forEach((c) =>
    rows.push({ type: 'changed', f: c.f_number, from: c.from, to: c.to }));
  (diff.added || []).forEach((c) =>
    rows.push({ type: 'added', f: c.f_number, colorName: c.color_name, company: c.company_name }));
  (diff.removed || []).forEach((c) =>
    rows.push({ type: 'removed', f: c.f_number, colorName: c.color_name, company: c.company_name }));

  // Sort by F number
  rows.sort((a, b) => {
    const numA = parseInt((a.f || '').replace(/\D/g, '')) || 0;
    const numB = parseInt((b.f || '').replace(/\D/g, '')) || 0;
    return numA - numB;
  });

  const rowStyle = {
    unchanged: { bg: 'transparent', label: null, labelColor: '#6B7280' },
    changed:   { bg: '#FFFBEB',     label: 'Changed',  labelColor: '#92400E' },
    added:     { bg: '#F0FDF4',     label: 'Added',    labelColor: '#14532D' },
    removed:   { bg: '#FEF2F2',     label: 'Removed',  labelColor: '#7F1D1D' },
  };

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell sx={{ fontWeight: 800, fontSize: '0.68rem', py: 0.75 }}>F#</TableCell>
          <TableCell sx={{ fontWeight: 800, fontSize: '0.68rem', py: 0.75 }}>Current</TableCell>
          <TableCell sx={{ fontWeight: 800, fontSize: '0.68rem', py: 0.75 }}>Incoming</TableCell>
          <TableCell sx={{ fontWeight: 800, fontSize: '0.68rem', py: 0.75 }}>Change</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row, i) => {
          const cfg = rowStyle[row.type];
          return (
            <TableRow key={i} sx={{ bgcolor: cfg.bg }}>
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700, py: 0.5 }}>{row.f}</TableCell>
              <TableCell sx={{ fontSize: '0.75rem', py: 0.5 }}>
                {row.type === 'changed'
                  ? <span style={{ color: '#DC2626', textDecoration: 'line-through' }}>{row.from?.color_name}</span>
                  : row.type === 'added' ? <span style={{ color: '#6B7280' }}>—</span>
                  : row.colorName}
                {row.type !== 'changed' && row.company && (
                  <Chip label={row.company} size="small" sx={{ ml: 0.5, height: 16, fontSize: '0.6rem' }} />
                )}
              </TableCell>
              <TableCell sx={{ fontSize: '0.75rem', py: 0.5 }}>
                {row.type === 'changed'
                  ? <span style={{ color: '#16A34A', fontWeight: 700 }}>{row.to?.color_name}</span>
                  : row.type === 'removed' ? <span style={{ color: '#6B7280' }}>—</span>
                  : row.colorName}
                {row.type !== 'changed' && row.company && (
                  <Chip label={row.company} size="small" sx={{ ml: 0.5, height: 16, fontSize: '0.6rem' }} />
                )}
              </TableCell>
              <TableCell sx={{ py: 0.5 }}>
                {cfg.label && (
                  <Chip
                    label={cfg.label}
                    size="small"
                    sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, color: cfg.labelColor, borderColor: cfg.labelColor }}
                    variant="outlined"
                  />
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

// ── Score bar ──────────────────────────────────────────────────
const ScoreBar = ({ score }) => {
  const color = score >= 95 ? '#DC2626' : score >= 80 ? '#D97706' : '#16A34A';
  return (
    <Box sx={{ mb: 1.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color }}>
          Similarity Score
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 800, color }}>
          {score}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={score}
        sx={{
          height: 6, borderRadius: 3,
          bgcolor: '#F3F4F6',
          '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 },
        }}
      />
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: 'block' }}>
        {score >= 95 ? 'Exact or near-exact duplicate' : score >= 80 ? 'Highly similar — review before importing' : 'Partial match'}
      </Typography>
    </Box>
  );
};

// ══════════════════════════════════════════════════════════════════
// Main Dialog
// ══════════════════════════════════════════════════════════════════
const DuplicateResolutionDialog = ({ open, onClose, conflict, onResolve }) => {
  if (!conflict) return null;

  const { level, entry, existingId, existingCode, existingName,
          existingBeamName, existingCombo, score, diff } = conflict;

  const cfg = STATUS_CONFIG[level] || STATUS_CONFIG.DUPLICATE;

  const resolve = (action) => {
    onResolve(action);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      TransitionComponent={Fade}
      transitionDuration={180}
    >
      {/* ── Header ──────────────────────────────────── */}
      <DialogTitle sx={{ pb: 0 }}>
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1.5,
          p: 2, borderRadius: 2, bgcolor: cfg.bg, mb: 1,
          border: `1.5px solid ${cfg.color}22`,
        }}>
          <Box sx={{ color: cfg.color, display: 'flex' }}>{cfg.icon}</Box>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: cfg.color, letterSpacing: '0.04em', fontSize: '0.7rem' }}>
              {cfg.label}
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary', mt: 0.25 }}>
              {level === 'SAREE' && `Series Code ${existingCode} already exists`}
              {level === 'BEAM'  && `"${existingBeamName}" already exists in this saree`}
              {level === 'DUPLICATE' && 'This combination already exists'}
              {level === 'SIMILAR' && 'A similar combination was found'}
              {level === 'IMAGE_CONFLICT' && 'Same combination, different image'}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 3 }}>
        {/* Incoming entry summary */}
        <Box sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 2, mb: 1.5, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="overline" color="text.secondary">Incoming Entry</Typography>
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 0.5 }}>
            {entry?.series_code && <Chip label={entry.series_code} size="small" color="primary" sx={{ fontWeight: 700 }} />}
            {entry?.beam_name   && <Chip label={entry.beam_name}   size="small" variant="outlined" />}
            {entry?.combination_name && <Chip label={entry.combination_name} size="small" variant="outlined" />}
            {entry?.stock != null && <Chip label={`${entry.stock} pcs`} size="small" variant="outlined" />}
          </Box>
          {entry?.colors?.length > 0 && (
            <Box sx={{ mt: 1 }}>
              {entry.colors.map((c, i) => (
                <Typography key={i} variant="caption" sx={{ display: 'block', color: 'text.secondary', fontFamily: 'monospace' }}>
                  <strong>{c.f_number}</strong>: {c.color_name}{c.company_name ? ` (${c.company_name})` : ''}
                </Typography>
              ))}
            </Box>
          )}
        </Box>

        {/* Similarity score for SIMILAR */}
        {level === 'SIMILAR' && score != null && <ScoreBar score={score} />}

        {/* SAREE: show existing saree info */}
        {level === 'SAREE' && (
          <Alert severity="error" sx={{ mb: 1 }}>
            <Typography variant="body2">
              A saree with code <strong>{existingCode}</strong>
              {existingName ? ` ("${existingName}")` : ''} already exists in your inventory.
              Creating a duplicate is not allowed.
            </Typography>
          </Alert>
        )}

        {/* BEAM: info */}
        {level === 'BEAM' && (
          <Alert severity="warning" sx={{ mb: 1 }}>
            <Typography variant="body2">
              <strong>{existingBeamName}</strong> already exists. The new combination will be added into the existing beam.
            </Typography>
          </Alert>
        )}

        {/* Color diff for SIMILAR / DUPLICATE / IMAGE_CONFLICT */}
        {diff && (level === 'SIMILAR' || level === 'DUPLICATE' || level === 'IMAGE_CONFLICT') && (
          <>
            <Divider sx={{ my: 1.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Color Comparison</Typography>
            </Divider>
            <Box sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
              <DiffTable diff={diff} />
            </Box>
          </>
        )}

        {/* Image conflict */}
        {level === 'IMAGE_CONFLICT' && (
          <Alert severity="info" icon={<ImageIcon />} sx={{ mt: 1.5 }}>
            <Typography variant="body2">
              Every field matches, but the images are different. How would you like to handle this?
            </Typography>
          </Alert>
        )}
      </DialogContent>

      {/* ── Actions ────────────────────────────────────── */}
      <DialogActions sx={{ px: 3, pb: 2.5, flexDirection: 'column', gap: 1 }}>

        {/* LEVEL 1: Saree */}
        {level === 'SAREE' && (
          <>
            <Button fullWidth variant="contained" startIcon={<OpenInNewIcon />}
              onClick={() => resolve('open_existing')}>
              Open Existing Saree
            </Button>
            <Button fullWidth variant="outlined" onClick={() => resolve('cancel')}>
              Cancel
            </Button>
          </>
        )}

        {/* LEVEL 2: Beam */}
        {level === 'BEAM' && (
          <>
            <Button fullWidth variant="contained" startIcon={<EditNoteIcon />}
              onClick={() => resolve('add_to_existing_beam')}>
              Add to Existing Beam
            </Button>
            <Button fullWidth variant="outlined" color="error" onClick={() => resolve('cancel')}>
              Cancel
            </Button>
          </>
        )}

        {/* LEVEL 3/4: Exact Duplicate */}
        {level === 'DUPLICATE' && (
          <>
            <Button fullWidth variant="contained" color="primary" startIcon={<EditNoteIcon />}
              onClick={() => resolve('update_existing')}>
              Update Existing Stock
            </Button>
            <Button fullWidth variant="outlined" color="success" startIcon={<AddCircleOutlineIcon />}
              onClick={() => resolve('create_new')}>
              Create New Combination
            </Button>
            <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
              <Button fullWidth variant="outlined" startIcon={<SkipNextIcon />}
                onClick={() => resolve('skip')}>
                Skip
              </Button>
              <Button fullWidth variant="text" color="error" onClick={() => resolve('cancel')}>
                Cancel
              </Button>
            </Box>
          </>
        )}

        {/* LEVEL 6: Similar */}
        {level === 'SIMILAR' && (
          <>
            <Button fullWidth variant="contained" color="warning" startIcon={<EditNoteIcon />}
              onClick={() => resolve('update_existing')}
              sx={{ color: '#fff' }}>
              Update Existing Combination
            </Button>
            <Button fullWidth variant="outlined" color="success" startIcon={<AddCircleOutlineIcon />}
              onClick={() => resolve('create_new')}>
              Create New Combination
            </Button>
            <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
              <Button fullWidth variant="outlined" startIcon={<SkipNextIcon />}
                onClick={() => resolve('skip')}>
                Skip
              </Button>
              <Button fullWidth variant="text" color="error" onClick={() => resolve('cancel')}>
                Cancel
              </Button>
            </Box>
          </>
        )}

        {/* LEVEL 5: Image Conflict */}
        {level === 'IMAGE_CONFLICT' && (
          <>
            <Button fullWidth variant="contained" startIcon={<ImageIcon />}
              onClick={() => resolve('replace_image')}>
              Replace Image
            </Button>
            <Button fullWidth variant="outlined" onClick={() => resolve('keep_existing')}>
              Keep Existing Image
            </Button>
            <Button fullWidth variant="text" color="error" onClick={() => resolve('cancel')}>
              Cancel
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default DuplicateResolutionDialog;
