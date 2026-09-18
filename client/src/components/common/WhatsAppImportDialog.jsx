/**
 * WhatsAppImportDialog — Production-Ready WhatsApp Paste & Import
 *
 * Features:
 *   - Two-step flow: Paste → Preview (with editing)
 *   - Confidence score per entry (color-coded)
 *   - Inline editing of all fields before import
 *   - Duplicate detection with skip/update/create options
 *   - Series validation (wrong saree warning)
 *   - Error recovery stats (X imported, Y failed)
 *   - Image attachment support
 *   - Select/unselect entries
 *   - Expandable F-color detail view
 */
import { useState, useEffect, useRef } from 'react';
import { parserAPI, duplicateAPI } from '../../services/api';
import {
  Box, Paper, TextField, Button, Typography, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Chip, Tooltip, Alert, LinearProgress, Collapse,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Checkbox, Fade, Divider, InputAdornment,
} from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';

// ── Confidence badge ────────────────────────────────────────────
const ConfidenceBadge = ({ score }) => {
  let color = 'success';
  let icon = <CheckCircleIcon sx={{ fontSize: 14 }} />;
  if (score < 80) { color = 'error'; icon = <ErrorIcon sx={{ fontSize: 14 }} />; }
  else if (score < 95) { color = 'warning'; icon = <WarningIcon sx={{ fontSize: 14 }} />; }
  return (
    <Chip icon={icon} label={`${score}%`} size="small" color={color} variant="outlined"
      sx={{ fontWeight: 800, fontSize: '0.7rem', height: 22 }} />
  );
};

// ── Canonical status taxonomy (mirrors the server — spec §11) ────────────────
const STATUS_CONFIG = {
  NEW_SARI:             { label: '🆕 New Sari',            color: '#16A34A', bg: '#F0FDF4' },
  NEW_COMBINATION:      { label: '🆕 New Combination',     color: '#0D9488', bg: '#F0FDFA' },
  SARI_EXISTS:          { label: '⚠️ Sari Exists',          color: '#D97706', bg: '#FFFBEB' },
  COMBINATION_EXISTS:   { label: '⚠️ Combination Exists',   color: '#DC2626', bg: '#FEF2F2' },
  SIMILAR:              { label: '⚠️ Similar',              color: '#D97706', bg: '#FFFBEB' },
  DUPLICATE_IN_MESSAGE: { label: '⚠️ Duplicate in Message', color: '#DC2626', bg: '#FEF2F2' },
  MISSING_INFO:         { label: '⚠️ Missing Info',         color: '#D97706', bg: '#FFFBEB' },
  INVALID:              { label: '❌ Invalid',              color: '#6B7280', bg: '#F3F4F6' },
  CHECKING:             { label: '… checking',             color: '#6B7280', bg: '#F9FAFB' },
  // legacy fallthroughs (older server responses)
  NEW: { label: '🆕 New', color: '#16A34A', bg: '#F0FDF4' },
};
const STATUS_HELP = {
  NEW_SARI: 'This sari code is not in the database yet — you can add it.',
  NEW_COMBINATION: 'This sari already exists; this beam/combination is new to it.',
  SARI_EXISTS: 'This sari already exists in the database.',
  COMBINATION_EXISTS: 'This exact combination & colours already exist in the database.',
  SIMILAR: 'A very similar combination already exists — please review.',
  DUPLICATE_IN_MESSAGE: 'This entry is repeated earlier in the pasted message.',
  MISSING_INFO: 'Some fields could not be confidently identified — please correct them.',
  INVALID: 'No recognisable sari information could be extracted from this block.',
};
const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.NEW_SARI;
  const badge = (
    <Chip label={cfg.label} size="small"
      sx={{ height: 22, fontSize: '0.62rem', fontWeight: 800, maxWidth: '100%',
        color: cfg.color, bgcolor: cfg.bg, border: `1px solid ${cfg.color}44` }} />
  );
  return STATUS_HELP[status]
    ? <Tooltip title={STATUS_HELP[status]}>{badge}</Tooltip>
    : badge;
};

// ── Inline edit row ─────────────────────────────────────────────
const InlineEditRow = ({ entry, index, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState({ ...entry });

  const save = () => {
    onUpdate(index, local);
    setEditing(false);
  };

  if (!editing) {
    return (
      <Tooltip title="Edit this entry">
        <IconButton size="small" onClick={() => setEditing(true)}>
          <EditIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, py: 1, px: 0.5 }}>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <TextField size="small" label="Beam" value={local.beam_name || ''}
          onChange={(e) => setLocal({ ...local, beam_name: e.target.value })}
          sx={{ flex: '1 1 120px', minWidth: 100 }} />
        <TextField size="small" label="Series" value={local.series_code || ''}
          onChange={(e) => {
            const code = e.target.value.toUpperCase();
            const lm = code.match(/^([A-Z]+\d+)([A-Z])$/);
            setLocal({
              ...local,
              series_code: code,
              series_base: lm ? lm[1] : code,
              series_letter: lm ? lm[2] : 'A',
            });
          }}
          sx={{ flex: '1 1 100px', minWidth: 80 }} />
        <TextField size="small" label="Combination" value={local.combination_name || ''}
          onChange={(e) => setLocal({ ...local, combination_name: e.target.value })}
          sx={{ flex: '1 1 140px', minWidth: 100 }} />
        <TextField size="small" label="Stock" type="number" value={local.stock ?? ''}
          onChange={(e) => setLocal({ ...local, stock: e.target.value === '' ? null : parseInt(e.target.value, 10) })}
          sx={{ flex: '0 1 80px', minWidth: 60 }}
          slotProps={{ htmlInput: { min: 0 } }} />
      </Box>
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <Button size="small" variant="contained" onClick={save} sx={{ fontSize: '0.7rem', py: 0.25 }}>
          Save
        </Button>
        <Button size="small" variant="text" onClick={() => { setLocal({ ...entry }); setEditing(false); }}
          sx={{ fontSize: '0.7rem', py: 0.25 }}>
          Cancel
        </Button>
      </Box>
    </Box>
  );
};

// ── Color detail expander ───────────────────────────────────────
const ColorDetail = ({ colors }) => {
  const [open, setOpen] = useState(false);
  if (!colors || colors.length === 0) return <Typography variant="caption" color="text.disabled">—</Typography>;
  return (
    <Box>
      <Button
        size="small" variant="text"
        onClick={() => setOpen(!open)}
        endIcon={open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        sx={{ fontSize: '0.7rem', textTransform: 'none', fontWeight: 700, px: 0.5, py: 0, minWidth: 0 }}
      >
        {colors.length} color{colors.length !== 1 ? 's' : ''}
      </Button>
      <Collapse in={open}>
        <Box sx={{ pl: 0.5, pt: 0.5 }}>
          {colors.map((c, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 0.75, alignItems: 'center', mb: 0.25 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', minWidth: 28 }}>
                {c.f_number}
              </Typography>
              <Typography variant="caption">{c.color_name}</Typography>
              {c.company_name && (
                <Chip label={c.company_name} size="small" variant="outlined"
                  sx={{ height: 16, fontSize: '0.6rem', fontWeight: 600 }} />
              )}
            </Box>
          ))}
        </Box>
      </Collapse>
    </Box>
  );
};

// ════════════════════════════════════════════════════════════════
// Main Component
// ════════════════════════════════════════════════════════════════
const WhatsAppImportDialog = ({ open, onClose, onImport, currentSeriesBase, currentBrand }) => {
  // Step 1: Paste
  const [pasteText, setPasteText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState('');

  // Screenshot / OCR
  const [ocrEnabled, setOcrEnabled] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Ask the server whether OCR (Gemini) is configured, to show/hide the button.
  useEffect(() => {
    if (!open) return;
    let active = true;
    parserAPI.ocrStatus()
      .then(({ data }) => { if (active) setOcrEnabled(!!data.enabled); })
      .catch(() => { if (active) setOcrEnabled(false); });
    return () => { active = false; };
  }, [open]);

  const handleScreenshot = async (e) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = ''; // allow re-selecting same file
    if (!file) return;
    setParseError('');
    setOcrLoading(true);
    try {
      const { data } = await parserAPI.ocrImage(file);
      const text = (data.text || '').trim();
      if (!text) { setParseError('No text could be read from the screenshot.'); return; }
      // Append to any existing pasted text so multiple screenshots accumulate.
      setPasteText((prev) => (prev.trim() ? `${prev.trim()}\n${text}` : text));
    } catch (err) {
      setParseError(err.response?.data?.error || 'Failed to read text from the screenshot.');
    } finally {
      setOcrLoading(false);
    }
  };

  // Step 2: Preview
  const [step, setStep] = useState('paste');
  const [entries, setEntries] = useState([]);
  const [duplicateEntries, setDuplicateEntries] = useState([]);
  const [invalidBlocks, setInvalidBlocks] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [majorityCode, setMajorityCode] = useState(null);
  const [counts, setCounts] = useState({ duplicate: 0, different: 0 });
  const [stats, setStats] = useState({ parsed: 0, failed: 0 });
  const [selected, setSelected] = useState([]);
  const [dupResults, setDupResults] = useState([]); // index → full batch result { status, existingSareeName, diff, ... }
  const [dupChecking, setDupChecking] = useState(false);

  // Expanded rows
  const [expandedRows, setExpandedRows] = useState(new Set());

  const reset = () => {
    setPasteText('');
    setParsing(false);
    setParseError('');
    setStep('paste');
    setEntries([]);
    setDuplicateEntries([]);
    setInvalidBlocks([]);
    setWarnings([]);
    setMajorityCode(null);
    setCounts({ duplicate: 0, different: 0 });
    setStats({ parsed: 0, failed: 0 });
    setSelected([]);
    setDupResults([]);
    setDupChecking(false);
    setExpandedRows(new Set());
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // ── Parse + duplicate batch check ────────────────────────────
  const runBatchCheck = async (parsedEntries) => {
    setDupChecking(true);
    try {
      // Scope DB duplicate detection to the shop being imported into. A per-entry
      // shop parsed from KP/KPR headers overrides this on the server.
      const { data: batchData } = await duplicateAPI.checkWhatsAppBatch({ entries: parsedEntries, brand: currentBrand || null });
      // Align results to entries by index (server preserves order 1:1).
      setDupResults(batchData.results || []);
    } catch { /* non-fatal — statuses simply stay unknown */ } finally {
      setDupChecking(false);
    }
  };

  const handleParse = async () => {
    setParseError('');
    setParsing(true);
    setDupResults([]);
    try {
      const { data } = await parserAPI.parseWhatsApp(pasteText);
      const parsedEntries = data.entries || [];
      const invalids = data.invalidBlocks || [];
      if (parsedEntries.length === 0 && invalids.length === 0) {
        setParseError('Could not parse any entries from the message.');
        return;
      }
      setEntries(parsedEntries);
      setDuplicateEntries(data.duplicateEntries || []);
      setInvalidBlocks(invalids);
      setWarnings(data.warnings || []);
      setMajorityCode(data.majorityCode || null);
      setCounts({ duplicate: data.duplicateCount || 0, different: data.differentCodeCount || 0 });
      setStats({ parsed: data.totalParsed || parsedEntries.length, failed: data.totalFailed || invalids.length });
      // Pre-select everything EXCEPT in-message duplicates (kept but unchecked by default).
      setSelected(parsedEntries.map((e, i) => (e.duplicate_in_message ? null : i)).filter((i) => i !== null));
      setStep('preview');
      if (parsedEntries.length > 0) await runBatchCheck(parsedEntries);
    } catch (e) {
      setParseError(e.response?.data?.error || 'Could not parse message. Please check the format.');
    } finally {
      setParsing(false);
    }
  };

  // ── Update entry ──────────────────────────────────────────────
  const handleUpdateEntry = (index, updated) => {
    const next = [...entries];
    next[index] = updated;
    // Recalculate confidence
    let score = 0;
    if (updated.beam_name) score += 20;
    if (updated.series_code) score += 25;
    if (updated.combination_name) score += 10;
    if (updated.colors?.length > 0) score += 25;
    if (updated.stock !== null && updated.stock !== undefined) score += 20;
    next[index].confidence = score;
    setEntries(next);
    // Re-validate against the DB since identity fields may have changed.
    runBatchCheck(next);
  };

  // ── Delete entry ──────────────────────────────────────────────
  const handleDeleteEntry = (index) => {
    const next = entries.filter((_, i) => i !== index);
    setEntries(next);
    setDupResults((prev) => prev.filter((_, i) => i !== index));
    setSelected(selected.filter((s) => s !== index).map((s) => (s > index ? s - 1 : s)));
  };

  // ── Select / Deselect ────────────────────────────────────────
  const toggleSelect = (index) => {
    setSelected((prev) => prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]);
  };

  const toggleSelectAll = () => {
    if (selected.length === entries.length) setSelected([]);
    else setSelected(entries.map((_, i) => i));
  };

  // ── Import ────────────────────────────────────────────────────
  const handleImport = () => {
    const checkedEntries = entries.filter((_, i) => selected.includes(i));
    if (checkedEntries.length === 0) return;
    onImport(checkedEntries, duplicateEntries, warnings);
    handleClose();
  };

  // ── Series mismatch detection ─────────────────────────────────
  const getMismatchedEntries = () => {
    if (!currentSeriesBase) return [];
    const base = currentSeriesBase.trim().toUpperCase();
    return entries
      .map((e, i) => ({ entry: e, index: i }))
      .filter(({ entry }) => {
        const entryBase = (entry.series_base || '').trim().toUpperCase();
        return entryBase && entryBase !== base;
      });
  };

  const mismatched = step === 'preview' ? getMismatchedEntries() : [];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth={step === 'preview' ? 'lg' : 'sm'} fullWidth
      TransitionComponent={Fade} transitionDuration={200}>

      {/* ──────────── STEP 1: PASTE ──────────── */}
      {step === 'paste' && (
        <>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 800, fontSize: '1.3rem', pb: 1 }}>
            <Box sx={{
              width: 40, height: 40, borderRadius: '10px',
              background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <WhatsAppIcon sx={{ color: '#fff', fontSize: 22 }} />
            </Box>
            Import from WhatsApp
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
              Paste your WhatsApp message containing saree information. The AI parser will automatically detect
              beam names, series codes, combination names, F-colors, and stock quantities — even from inconsistent messages.
            </Typography>

            {/* Example card */}
            <Paper variant="outlined" sx={{
              p: 1.5, mb: 2, borderRadius: 2,
              bgcolor: 'rgba(37, 211, 102, 0.04)',
              borderColor: 'rgba(37, 211, 102, 0.2)',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                <AutoFixHighIcon sx={{ fontSize: 16, color: '#25D366' }} />
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#128C7E', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Example Format
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{
                fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                whiteSpace: 'pre', display: 'block', fontSize: '0.68rem', lineHeight: 1.6,
              }}>
{`WHITE Beam:
KS526F (Urgent Delivery)
F-1 : White
F-2 : Normal Champion
F-3 : Silver Filatex
99 pcs`}
              </Typography>
            </Paper>

            <TextField
              multiline rows={12} fullWidth
              placeholder="Paste one or more WhatsApp messages here..."
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              autoFocus
              slotProps={{
                input: {
                  startAdornment: pasteText ? null : (
                    <InputAdornment position="start" sx={{ position: 'absolute', top: 24, left: 12, pointerEvents: 'none' }}>
                      <ContentPasteIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                  fontSize: '0.78rem',
                  lineHeight: 1.6,
                },
              }}
            />

            {ocrEnabled && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleScreenshot}
                />
                <Button
                  variant="outlined"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={ocrLoading || parsing}
                  startIcon={<ImageOutlinedIcon />}
                  sx={{ mt: 1.5, textTransform: 'none', borderColor: 'rgba(37,211,102,0.4)', color: '#128C7E' }}
                >
                  {ocrLoading ? 'Reading screenshot…' : 'Upload WhatsApp screenshot'}
                </Button>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  The screenshot is transcribed to text, then parsed with the same rules — review everything before importing.
                </Typography>
              </>
            )}

            {(parsing || ocrLoading) && <LinearProgress sx={{ mt: 1.5, borderRadius: 2 }} />}
            {parseError && <Alert severity="error" sx={{ mt: 1.5 }}>{parseError}</Alert>}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button onClick={handleClose} variant="outlined">Cancel</Button>
            <Button
              variant="contained"
              onClick={handleParse}
              disabled={!pasteText.trim() || parsing || ocrLoading}
              startIcon={<AutoFixHighIcon />}
              sx={{
                background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                '&:hover': { background: 'linear-gradient(135deg, #20C55E 0%, #0E7A6E 100%)' },
              }}
            >
              {parsing ? 'Parsing...' : 'Parse & Preview'}
            </Button>
          </DialogActions>
        </>
      )}

      {/* ──────────── STEP 2: PREVIEW ──────────── */}
      {step === 'preview' && (
        <>
          <DialogTitle sx={{ pb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, fontSize: '1.35rem' }}>
                  📋 Import Preview
                </Typography>
                <Chip label={`${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`}
                  size="small" color="primary" sx={{ fontWeight: 800 }} />
              </Box>
              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                {stats.parsed > 0 && (
                  <Chip icon={<CheckCircleIcon />} label={`${stats.parsed} parsed`}
                    size="small" color="success" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.68rem' }} />
                )}
                {stats.failed > 0 && (
                  <Chip icon={<ErrorIcon />} label={`${stats.failed} failed`}
                    size="small" color="error" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.68rem' }} />
                )}
              </Box>
            </Box>
          </DialogTitle>

          <DialogContent dividers sx={{ p: 0 }}>
            {/* Warnings */}
            {warnings.length > 0 && (
              <Box sx={{ p: 2, pb: 0 }}>
                <Alert severity="warning" sx={{ '& .MuiAlert-message': { fontSize: '0.78rem' } }}>
                  {warnings.map((w, i) => <Typography key={i} variant="body2" sx={{ fontSize: '0.78rem' }}>{w}</Typography>)}
                </Alert>
              </Box>
            )}

            {/* Series mismatch warning */}
            {mismatched.length > 0 && (
              <Box sx={{ p: 2, pb: 0 }}>
                <Alert severity="error">
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {mismatched.length} entr{mismatched.length === 1 ? 'y belongs' : 'ies belong'} to a different saree
                    ({[...new Set(mismatched.map((m) => m.entry.series_code))].join(', ')}).
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    You are currently editing <strong>{currentSeriesBase}</strong>. Mismatched entries are highlighted below.
                  </Typography>
                </Alert>
              </Box>
            )}

            {/* In-message duplicates (KEPT, not removed — user decides) */}
            {counts.duplicate > 0 && (
              <Box sx={{ p: 2, pb: 0 }}>
                <Alert severity="warning" icon={<WarningIcon />}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {counts.duplicate} duplicate {counts.duplicate === 1 ? 'entry' : 'entries'} detected inside this message.
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    They are kept and highlighted below (unchecked by default) so nothing is lost — you decide whether to import them.
                  </Typography>
                </Alert>
              </Box>
            )}

            {/* Different / outlier sari codes */}
            {counts.different > 0 && majorityCode && (
              <Box sx={{ p: 2, pb: 0 }}>
                <Alert severity="warning" icon={<WarningIcon />}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {counts.different} entr{counts.different === 1 ? 'y has a' : 'ies have a'} different sari code
                    from the main code <strong>{majorityCode}</strong>.
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Highlighted below and kept for your review — nothing was auto-removed or modified.
                  </Typography>
                </Alert>
              </Box>
            )}

            {/* Invalid / unrecognised blocks (never silently dropped) */}
            {invalidBlocks.length > 0 && (
              <Box sx={{ p: 2, pb: 0 }}>
                <Alert severity="info" icon={<ErrorIcon />}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {invalidBlocks.length} block{invalidBlocks.length !== 1 ? 's' : ''} could not be recognised as a sari.
                  </Typography>
                  {invalidBlocks.map((b, i) => (
                    <Typography key={i} variant="caption" sx={{
                      display: 'block', fontFamily: 'monospace', color: 'text.secondary',
                      whiteSpace: 'pre-wrap', mt: 0.25,
                    }}>
                      • {b.raw_text}
                    </Typography>
                  ))}
                </Alert>
              </Box>
            )}

            {/* Entries Table */}
            <TableContainer sx={{ mt: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" sx={{ width: 40 }}>
                      <Checkbox
                        checked={entries.length > 0 && selected.length === entries.length}
                        indeterminate={selected.length > 0 && selected.length < entries.length}
                        onChange={toggleSelectAll}
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, minWidth: 100 }}>Beam</TableCell>
                    <TableCell sx={{ fontWeight: 800, minWidth: 90 }}>Series</TableCell>
                    <TableCell sx={{ fontWeight: 800, minWidth: 110 }}>Combination</TableCell>
                    <TableCell sx={{ fontWeight: 800, minWidth: 60 }} align="right">Stock</TableCell>
                    <TableCell sx={{ fontWeight: 800, minWidth: 80 }}>F-Colors</TableCell>
                    <TableCell sx={{ fontWeight: 800, minWidth: 70 }} align="center">Confidence</TableCell>
                    <TableCell sx={{ fontWeight: 800, minWidth: 80 }} align="center">
                      Status {dupChecking && <span style={{ fontSize: '0.6rem', color: '#9CA3AF' }}>checking…</span>}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, width: 80 }} align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entries.map((entry, idx) => {
                    const isChecked = selected.includes(idx);
                    const isMismatch = currentSeriesBase &&
                      entry.series_base &&
                      entry.series_base.toUpperCase() !== currentSeriesBase.toUpperCase();
                    const isLowConf = entry.confidence < 80;
                    const isDuplicate = !!entry.duplicate_in_message;
                    const isDifferent = !!entry.different_code;
                    const missing = entry.missing_fields || [];
                    const status = dupChecking ? 'CHECKING' : (dupResults[idx]?.status || 'NEW_SARI');

                    return (
                      <TableRow
                        key={idx}
                        hover
                        selected={isChecked}
                        sx={{
                          ...((isMismatch || isDuplicate) && {
                            bgcolor: 'rgba(220, 38, 38, 0.05)',
                            '&:hover': { bgcolor: 'rgba(220, 38, 38, 0.09)' },
                          }),
                          ...((isDifferent || (isLowConf && !isMismatch && !isDuplicate)) && !isMismatch && !isDuplicate && {
                            bgcolor: 'rgba(217, 119, 6, 0.05)',
                            '&:hover': { bgcolor: 'rgba(217, 119, 6, 0.09)' },
                          }),
                        }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox checked={isChecked} onChange={() => toggleSelect(idx)} size="small" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {entry.beam_name || <span style={{ color: '#D97706' }}>—</span>}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4, alignItems: 'flex-start' }}>
                            <Chip
                              label={entry.series_code || '—'}
                              size="small"
                              variant="outlined"
                              color={isMismatch || isDifferent ? 'error' : 'default'}
                              sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                            />
                            {entry.brand && (
                              <Tooltip title={`Shop: ${entry.brand}`}>
                                <Chip label={entry.brand} size="small"
                                  sx={{ height: 16, fontSize: '0.55rem', fontWeight: 800, color: '#6D28D9', bgcolor: '#F5F3FF', border: '1px solid #6D28D944' }} />
                              </Tooltip>
                            )}
                            {isDifferent && (
                              <Tooltip title={`Different from the main code ${majorityCode || ''}`}>
                                <Chip label="Different code" size="small"
                                  sx={{ height: 16, fontSize: '0.55rem', fontWeight: 800, color: '#B45309', bgcolor: '#FFFBEB', border: '1px solid #B4530944' }} />
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {entry.combination_name || <span style={{ opacity: 0.4 }}>—</span>}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {entry.stock != null ? `${entry.stock}` : <span style={{ color: '#D97706' }}>—</span>}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <ColorDetail colors={entry.colors} />
                          {entry.color_warnings?.length > 0 && (
                            <Tooltip title={entry.color_warnings.map((w) => `Duplicate ${w.f_number}`).join(', ')}>
                              <Chip label={`⚠ dup F`} size="small"
                                sx={{ height: 16, fontSize: '0.55rem', fontWeight: 800, color: '#DC2626', bgcolor: '#FEF2F2', mt: 0.3 }} />
                            </Tooltip>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <ConfidenceBadge score={entry.confidence} />
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4, alignItems: 'center' }}>
                            <StatusBadge status={status} />
                            {missing.length > 0 && (
                              <Tooltip title={`Unable to confidently identify: ${missing.join(', ')}`}>
                                <Chip label={`missing: ${missing.join(', ')}`} size="small"
                                  sx={{ height: 16, fontSize: '0.52rem', fontWeight: 700, color: '#B45309', bgcolor: '#FFFBEB', maxWidth: 140 }} />
                              </Tooltip>
                            )}
                            {dupResults[idx]?.existingSareeName && (status === 'SARI_EXISTS' || status === 'NEW_COMBINATION' || status === 'COMBINATION_EXISTS') && (
                              <Typography variant="caption" sx={{ fontSize: '0.55rem', color: 'text.secondary' }}>
                                in DB: {dupResults[idx].existingSareeName}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 0.25, justifyContent: 'center' }}>
                            {entry.raw_text && (
                              <Tooltip title={<span style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.7rem' }}>{entry.raw_text}</span>}>
                                <IconButton size="small">
                                  <InfoOutlinedIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                                </IconButton>
                              </Tooltip>
                            )}
                            <InlineEditRow entry={entry} index={idx} onUpdate={handleUpdateEntry} />
                            <Tooltip title="Remove">
                              <IconButton size="small" color="error" onClick={() => handleDeleteEntry(idx)}>
                                <DeleteOutlinedIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2, gap: 1, justifyContent: 'space-between' }}>
            <Button variant="text" onClick={() => setStep('paste')} sx={{ fontSize: '0.78rem' }}>
              ← Back to Paste
            </Button>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" onClick={handleClose}>Cancel</Button>
              <Button
                variant="contained"
                onClick={handleImport}
                disabled={selected.length === 0}
                sx={{
                  background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                  '&:hover': { background: 'linear-gradient(135deg, #20C55E 0%, #0E7A6E 100%)' },
                  fontWeight: 800,
                }}
              >
                Import {selected.length > 0 ? `(${selected.length})` : ''}
              </Button>
            </Box>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

export default WhatsAppImportDialog;
