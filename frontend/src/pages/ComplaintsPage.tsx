import React, { useEffect, useState } from 'react';
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, TextField, MenuItem, Grid, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TablePagination,
  Alert, LinearProgress, Divider, alpha, Rating,
} from '@mui/material';
import {
  Eye, Pencil, CheckCircle2, Circle,
  Clock, CalendarClock, Sparkles, Wand2,
} from 'lucide-react';
import { complaintsAPI, usersAPI, aiAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Complaint, Category, Ward, User } from '../types';
import { nairobiColors } from '../theme/nairobiTheme';

const statusColors: Record<string, 'default' | 'warning' | 'info' | 'success' | 'primary'> = {
  submitted: 'warning', under_review: 'info', in_progress: 'primary',
  resolved: 'success', closed: 'default',
};

const STATUS_PIPELINE = ['submitted', 'under_review', 'in_progress', 'resolved', 'closed'];
const STATUS_LABELS: Record<string, string> = {
  submitted: 'Submitted', under_review: 'Under Review', in_progress: 'In Progress',
  resolved: 'Resolved', closed: 'Closed',
};
const STATUS_COLORS: Record<string, string> = {
  submitted: '#ED6C02',
  under_review: '#0288D1',
  in_progress: nairobiColors.green.main,
  resolved: '#2E7D32',
  closed: '#757575',
};

function getProgress(status: string): number {
  const idx = STATUS_PIPELINE.indexOf(status);
  if (idx < 0) return 0;
  return Math.round(((idx + 1) / STATUS_PIPELINE.length) * 100);
}

function getEstimatedDays(status: string): string | null {
  switch (status) {
    case 'submitted': return 'Estimated: 7–14 working days';
    case 'under_review': return 'Estimated: 5–10 working days';
    case 'in_progress': return 'Estimated: 3–7 working days';
    default: return null;
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const ComplaintsPage: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({ status: '', category: '', ward: '', search: '' });
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [updateForm, setUpdateForm] = useState<{ status: string; resolution_notes: string; assigned_to: number | '' }>({ status: '', resolution_notes: '', assigned_to: '' });
  const [departmentOfficials, setDepartmentOfficials] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [ratingValue, setRatingValue] = useState<number | null>(null);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [aiPriority, setAiPriority] = useState<{ priority: string; recommendation: string } | null>(null);
  const [draftingResponse, setDraftingResponse] = useState(false);

  const loadComplaints = async () => {
    try {
      const params: Record<string, string | number> = { page: page + 1 };
      if (filters.status) params.status = filters.status;
      if (filters.category) params.category = filters.category;
      if (filters.ward) params.ward = filters.ward;
      if (filters.search) params.search = filters.search;
      const res = await complaintsAPI.list(params);
      setComplaints(res.data.results || []);
      setTotal(res.data.count || 0);
    } catch (err) { setError('Failed to load complaints. Please try again.'); }
  };

  useEffect(() => {
    Promise.all([complaintsAPI.getCategories(), complaintsAPI.getWards()])
      .then(([catRes, wardRes]) => {
        setCategories(catRes.data.results || catRes.data);
        setWards(wardRes.data.results || wardRes.data);
      });
  }, []);

  useEffect(() => { loadComplaints(); }, [page, filters]);

  const handleViewDetail = async (id: number) => {
    try {
      const res = await complaintsAPI.get(id);
      setSelectedComplaint(res.data);
      setRatingValue(null);
      setRatingComment('');
      setDetailOpen(true);
    } catch (err) { setError('Failed to load complaint details.'); }
  };

  const handleSubmitRating = async () => {
    if (!selectedComplaint || !ratingValue) return;
    setRatingSubmitting(true);
    try {
      const res = await complaintsAPI.submitFeedback({
        complaint: selectedComplaint.id,
        rating: ratingValue,
        comment: ratingComment,
      });
      setSelectedComplaint({ ...selectedComplaint, feedback: res.data });
      setMessage('Thank you for rating this resolution.');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit rating.');
    } finally {
      setRatingSubmitting(false);
    }
  };

  const handleOpenUpdate = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setUpdateForm({ status: complaint.status, resolution_notes: '', assigned_to: complaint.assigned_to ?? '' });
    setDepartmentOfficials([]);
    setAiPriority(null);
    setUpdateOpen(true);
    if (user?.role === 'admin') {
      usersAPI.list({ role: 'official', departments: complaint.category, is_active: 'true' })
        .then(res => setDepartmentOfficials(res.data.results || res.data))
        .catch(() => setDepartmentOfficials([]));
    }
    aiAPI.analyzePriority({
      title: complaint.title,
      description: complaint.description || '',
      category: complaint.category_name,
    }).then(res => setAiPriority(res.data)).catch(() => setAiPriority(null));
  };

  const handleDraftResponse = async () => {
    if (!selectedComplaint) return;
    setDraftingResponse(true);
    try {
      const res = await aiAPI.draftResponse({
        title: selectedComplaint.title,
        description: selectedComplaint.description || '',
        status: updateForm.status,
        category: selectedComplaint.category_name,
      });
      setUpdateForm({ ...updateForm, resolution_notes: res.data.draft });
    } catch (err) {
      setError('Failed to generate a draft response.');
    } finally {
      setDraftingResponse(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedComplaint) return;
    try {
      await complaintsAPI.update(selectedComplaint.id, {
        ...updateForm,
        assigned_to: updateForm.assigned_to === '' ? null : updateForm.assigned_to,
      });
      setUpdateOpen(false);
      setMessage('Complaint updated successfully.');
      loadComplaints();
    } catch (err: any) {
      const detail = err.response?.data?.status?.[0] || err.response?.data?.assigned_to?.[0] || err.response?.data?.detail || 'Failed to update complaint.';
      setError(detail);
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom sx={{ color: nairobiColors.green.dark }}>
        {user?.role === 'citizen' ? 'My Complaints' : 'Complaint Management'}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {message && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage('')}>{message}</Alert>}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={3}>
            <TextField fullWidth size="small" label="Search" value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField fullWidth size="small" label="Status" select value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="submitted">Submitted</MenuItem>
              <MenuItem value="under_review">Under Review</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField fullWidth size="small" label="Category" select value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
              <MenuItem value="">All</MenuItem>
              {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField fullWidth size="small" label="Ward" select value={filters.ward}
              onChange={(e) => setFilters({ ...filters, ward: e.target.value })}>
              <MenuItem value="">All</MenuItem>
              {wards.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Mobile: stacked cards -- an 8-column table has no readable way to fit
          a phone screen; scrolling it sideways with no visible affordance
          reads as broken, not just cramped. */}
      <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
        {complaints.map((c) => (
          <Paper key={c.id} sx={{ p: 2, mb: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" fontWeight={700}>#{c.id} {c.title}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {c.category_name} · {c.ward_name || '-'}
                </Typography>
              </Box>
              <Chip label={c.status.replace('_', ' ')} size="small" color={statusColors[c.status] || 'default'} sx={{ flexShrink: 0 }} />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                Submitted {new Date(c.created_at).toLocaleDateString()} · Updated {timeAgo(c.updated_at)}
              </Typography>
              <Box>
                <IconButton size="small" onClick={() => handleViewDetail(c.id)} aria-label="View complaint details">
                  <Eye size={20} color={nairobiColors.green.main} strokeWidth={1.75} />
                </IconButton>
                {user?.role !== 'citizen' && (
                  <IconButton size="small" onClick={() => handleOpenUpdate(c)} aria-label="Update complaint status">
                    <Pencil size={20} color={nairobiColors.gold.dark} strokeWidth={1.75} />
                  </IconButton>
                )}
              </Box>
            </Box>
          </Paper>
        ))}
        {complaints.length === 0 && (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">No complaints found</Typography>
          </Paper>
        )}
        <Paper>
          <TablePagination
            component="div" count={total} page={page} onPageChange={(_, p) => setPage(p)}
            rowsPerPage={20} rowsPerPageOptions={[20]}
          />
        </Paper>
      </Box>

      {/* Tablet/desktop: full table */}
      <TableContainer component={Paper} sx={{ display: { xs: 'none', sm: 'block' } }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Ward</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Submitted</TableCell>
              <TableCell>Last Updated</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {complaints.map((c) => (
              <TableRow key={c.id} hover>
                <TableCell>{c.id}</TableCell>
                <TableCell>{c.title}</TableCell>
                <TableCell>{c.category_name}</TableCell>
                <TableCell>{c.ward_name || '-'}</TableCell>
                <TableCell>
                  <Chip label={c.status.replace('_', ' ')} size="small" color={statusColors[c.status] || 'default'} />
                </TableCell>
                <TableCell>{new Date(c.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Typography variant="body2">{timeAgo(c.updated_at)}</Typography>
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleViewDetail(c.id)} aria-label="View complaint details">
                    <Eye size={20} color={nairobiColors.green.main} strokeWidth={1.75} />
                  </IconButton>
                  {user?.role !== 'citizen' && (
                    <IconButton size="small" onClick={() => handleOpenUpdate(c)} aria-label="Update complaint status">
                      <Pencil size={20} color={nairobiColors.gold.dark} strokeWidth={1.75} />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {complaints.length === 0 && (
              <TableRow><TableCell colSpan={8} align="center">No complaints found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div" count={total} page={page} onPageChange={(_, p) => setPage(p)}
          rowsPerPage={20} rowsPerPageOptions={[20]}
        />
      </TableContainer>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{
          background: `linear-gradient(135deg, ${nairobiColors.green.dark} 0%, ${nairobiColors.green.main} 100%)`,
          color: 'white',
          borderBottom: `3px solid ${nairobiColors.gold.main}`,
        }}>
          Complaint #{selectedComplaint?.id}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedComplaint && (
            <Box>
              <Typography variant="h6" sx={{ mt: 1 }}>{selectedComplaint.title}</Typography>

              {/* Progress Bar */}
              <Box sx={{ mt: 2, mb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" fontWeight={600}>
                    Progress: {STATUS_LABELS[selectedComplaint.status] || selectedComplaint.status}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {getProgress(selectedComplaint.status)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={getProgress(selectedComplaint.status)}
                  sx={{
                    '& .MuiLinearProgress-bar': {
                      bgcolor: STATUS_COLORS[selectedComplaint.status] || nairobiColors.green.main,
                    },
                  }}
                />
                {getEstimatedDays(selectedComplaint.status) && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, color: 'text.secondary' }}>
                    <CalendarClock size={14} color="currentColor" />
                    <Typography variant="caption" color="text.secondary">
                      {getEstimatedDays(selectedComplaint.status)}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Status Pipeline */}
              <Box sx={{ display: 'flex', alignItems: 'center', my: 2, flexWrap: 'wrap', gap: 0.5 }}>
                {STATUS_PIPELINE.map((step, i) => {
                  const currentIdx = STATUS_PIPELINE.indexOf(selectedComplaint.status);
                  const reached = i <= currentIdx;
                  return (
                    <React.Fragment key={step}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {reached ? (
                          <CheckCircle2 size={20} color={STATUS_COLORS[step]} />
                        ) : (
                          <Circle size={20} color="#bdbdbd" />
                        )}
                        <Typography variant="caption" sx={{ fontWeight: reached ? 600 : 400, color: reached ? STATUS_COLORS[step] : '#9e9e9e' }}>
                          {STATUS_LABELS[step]}
                        </Typography>
                      </Box>
                      {i < STATUS_PIPELINE.length - 1 && (
                        <Box sx={{ width: 24, height: 2, bgcolor: i < currentIdx ? STATUS_COLORS[STATUS_PIPELINE[i + 1]] : '#e0e0e0' }} />
                      )}
                    </React.Fragment>
                  );
                })}
              </Box>

              {/* Citizen rating prompt / display */}
              {user?.role === 'citizen' && ['resolved', 'closed'].includes(selectedComplaint.status) && (
                <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: nairobiColors.green.pale }}>
                  {selectedComplaint.feedback ? (
                    <>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>Your Rating</Typography>
                      <Rating value={selectedComplaint.feedback.rating} readOnly />
                      {selectedComplaint.feedback.comment && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          "{selectedComplaint.feedback.comment}"
                        </Typography>
                      )}
                    </>
                  ) : (
                    <>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        How was this resolution handled?
                      </Typography>
                      <Rating
                        size="large"
                        value={ratingValue}
                        onChange={(_, val) => setRatingValue(val)}
                      />
                      <TextField
                        fullWidth multiline rows={2} placeholder="Optional comment"
                        value={ratingComment}
                        onChange={(e) => setRatingComment(e.target.value)}
                        sx={{ mt: 1.5 }}
                      />
                      <Button
                        variant="contained" sx={{ mt: 1.5 }}
                        disabled={!ratingValue || ratingSubmitting}
                        onClick={handleSubmitRating}
                      >
                        Submit Rating
                      </Button>
                    </>
                  )}
                </Paper>
              )}
              {user?.role !== 'citizen' && selectedComplaint.feedback && (
                <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: nairobiColors.green.pale }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>Citizen Rating</Typography>
                  <Rating value={selectedComplaint.feedback.rating} readOnly />
                  {selectedComplaint.feedback.comment && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      "{selectedComplaint.feedback.comment}"
                    </Typography>
                  )}
                </Paper>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Details */}
              <Grid container spacing={2}>
                <Grid item xs={6}><Typography variant="body2" color="text.secondary">Category</Typography><Typography>{selectedComplaint.category_name}</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2" color="text.secondary">Ward</Typography><Typography>{selectedComplaint.ward_name || '-'}</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2" color="text.secondary">Submitted</Typography><Typography>{new Date(selectedComplaint.created_at).toLocaleDateString()}</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2" color="text.secondary">Last Updated</Typography><Typography>{new Date(selectedComplaint.updated_at).toLocaleDateString()} ({timeAgo(selectedComplaint.updated_at)})</Typography></Grid>
                <Grid item xs={12}><Typography variant="body2" color="text.secondary">Location</Typography><Typography>{selectedComplaint.location}</Typography></Grid>
                <Grid item xs={12}><Typography variant="body2" color="text.secondary">Description</Typography><Typography>{selectedComplaint.description}</Typography></Grid>
                {selectedComplaint.image && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>Attached Photo</Typography>
                    <img src={selectedComplaint.image} alt="Complaint" style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8 }} />
                  </Grid>
                )}
                {selectedComplaint.resolution_notes && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, bgcolor: nairobiColors.green.pale, border: `1px solid ${alpha(nairobiColors.green.main, 0.2)}` }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>Resolution Notes</Typography>
                      <Typography>{selectedComplaint.resolution_notes}</Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>

              {/* Timeline */}
              {selectedComplaint.status_history && selectedComplaint.status_history.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>Activity Timeline</Typography>
                  <Box sx={{ pl: 2, borderLeft: `3px solid ${alpha(nairobiColors.green.main, 0.2)}` }}>
                    {selectedComplaint.status_history.map((h) => (
                      <Box key={h.id} sx={{ pb: 2, position: 'relative' }}>
                        <Box sx={{
                          position: 'absolute', left: -14, top: 2,
                          width: 10, height: 10, borderRadius: '50%',
                          bgcolor: STATUS_COLORS[h.new_status] || '#757575',
                          border: '2px solid white',
                        }} />
                        <Box sx={{ pl: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={STATUS_LABELS[h.new_status] || h.new_status}
                              size="small"
                              sx={{ bgcolor: STATUS_COLORS[h.new_status], color: 'white', fontWeight: 600, fontSize: '0.7rem' }}
                            />
                            {h.old_status && (
                              <Typography variant="caption" color="text.secondary">
                                from {STATUS_LABELS[h.old_status] || h.old_status}
                              </Typography>
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, color: 'text.secondary' }}>
                            <Clock size={12} color="currentColor" />
                            <Typography variant="caption" color="text.secondary">
                              {new Date(h.changed_at).toLocaleString()} ({timeAgo(h.changed_at)})
                            </Typography>
                          </Box>
                          {h.changed_by_name && (
                            <Typography variant="caption" color="text.secondary">
                              By: {h.changed_by_name}
                            </Typography>
                          )}
                          {h.notes && (
                            <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic', color: 'text.secondary' }}>
                              "{h.notes}"
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Update Dialog */}
      <Dialog open={updateOpen} onClose={() => setUpdateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{
          background: `linear-gradient(135deg, ${nairobiColors.green.dark} 0%, ${nairobiColors.green.main} 100%)`,
          color: 'white',
          borderBottom: `3px solid ${nairobiColors.gold.main}`,
        }}>
          Update Complaint Status
        </DialogTitle>
        <DialogContent>
          {aiPriority && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, mb: 1 }}>
              <Sparkles size={16} color={nairobiColors.gold.dark} />
              <Typography variant="body2" color="text.secondary">
                AI-suggested priority:
              </Typography>
              <Chip
                label={aiPriority.priority}
                size="small"
                sx={{
                  textTransform: 'capitalize', fontWeight: 700,
                  bgcolor: {
                    critical: '#FDECEA', high: '#FFF4E5', medium: '#E8F0FE', low: '#EAF6EC',
                  }[aiPriority.priority] || '#eee',
                  color: {
                    critical: '#C62828', high: '#B26A00', medium: '#1A56DB', low: '#1E7E34',
                  }[aiPriority.priority] || '#333',
                }}
              />
            </Box>
          )}
          <TextField fullWidth margin="normal" label="Status" select value={updateForm.status}
            onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}>
            <MenuItem value="submitted">Submitted</MenuItem>
            <MenuItem value="under_review">Under Review</MenuItem>
            <MenuItem value="in_progress">In Progress</MenuItem>
            <MenuItem value="resolved">Resolved</MenuItem>
            <MenuItem value="closed">Closed</MenuItem>
          </TextField>
          {user?.role === 'admin' && (
            <TextField fullWidth margin="normal" label="Assign To Official" select
              value={updateForm.assigned_to}
              onChange={(e) => setUpdateForm({ ...updateForm, assigned_to: e.target.value === '' ? '' : Number(e.target.value) })}
              helperText={departmentOfficials.length === 0
                ? `No officials assigned to the ${selectedComplaint?.category_name || ''} department yet`
                : `Officials in the ${selectedComplaint?.category_name || ''} department`}>
              <MenuItem value="">— Unassigned —</MenuItem>
              {departmentOfficials.map(o => (
                <MenuItem key={o.id} value={o.id}>{o.full_name}</MenuItem>
              ))}
            </TextField>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, mb: -1 }}>
            <Typography variant="body2" color="text.secondary">Resolution Notes</Typography>
            <Button
              size="small" startIcon={<Wand2 size={16} />}
              disabled={draftingResponse}
              onClick={handleDraftResponse}
            >
              {draftingResponse ? 'Drafting...' : 'Draft with AI'}
            </Button>
          </Box>
          <TextField fullWidth margin="normal" multiline rows={3}
            value={updateForm.resolution_notes}
            onChange={(e) => setUpdateForm({ ...updateForm, resolution_notes: e.target.value })}
            helperText="Review and edit the AI-drafted text before saving, or write your own." />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdate}>Update</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ComplaintsPage;
