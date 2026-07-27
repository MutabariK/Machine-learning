import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, TextField, MenuItem, Button, Alert, Grid, IconButton, alpha,
  Chip, Fade, CircularProgress, Collapse,
} from '@mui/material';
import {
  Send, Upload, Trash2, Sparkles, Lightbulb, CheckCircle2,
} from 'lucide-react';
import { complaintsAPI, aiAPI } from '../services/api';
import { Category, Ward } from '../types';
import { nairobiColors } from '../theme/nairobiTheme';

const SubmitComplaintPage: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [form, setForm] = useState({
    category: '', ward: '', title: '', description: '', location: '',
  });
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{
    suggested_category: string | null;
    confidence: number;
    alternatives: string[];
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    Promise.all([complaintsAPI.getCategories(), complaintsAPI.getWards()])
      .then(([catRes, wardRes]) => {
        setCategories(catRes.data.results || catRes.data);
        setWards(wardRes.data.results || wardRes.data);
      });
  }, []);

  useEffect(() => {
    return () => { if (imagePreview) URL.revokeObjectURL(imagePreview); };
  }, [imagePreview]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB');
        return;
      }
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  const fetchAiSuggestion = useCallback(async () => {
    if (!form.title && !form.description) return;
    setAiLoading(true);
    try {
      const res = await aiAPI.suggestCategory({
        title: form.title,
        description: form.description,
      });
      setAiSuggestion(res.data);
    } catch {
      // AI suggestion is optional, fail silently
    } finally {
      setAiLoading(false);
    }
  }, [form.title, form.description]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (form.title.length > 5 || form.description.length > 10) {
        fetchAiSuggestion();
      }
    }, 800);
    return () => clearTimeout(debounce);
  }, [form.title, form.description, fetchAiSuggestion]);

  const applySuggestion = (categoryName: string) => {
    const cat = categories.find(c =>
      c.name.toLowerCase().includes(categoryName.toLowerCase()) ||
      categoryName.toLowerCase().includes(c.name.toLowerCase())
    );
    if (cat) {
      setForm({ ...form, category: String(cat.id) });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('category', form.category);
      if (form.ward) formData.append('ward', form.ward);
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('location', form.location);
      if (image) formData.append('image', image);

      await complaintsAPI.create(formData);
      setSubmitted(true);
      setTimeout(() => navigate('/my-complaints'), 2000);
    } catch (err: any) {
      const data = err.response?.data;
      setError(data ? Object.values(data).flat().join(' ') : 'Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Fade in timeout={500}>
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <CheckCircle2 size={80} color={nairobiColors.green.main} strokeWidth={1.5} style={{ marginBottom: 16 }} />
          <Typography variant="h5" fontWeight={700} sx={{ color: nairobiColors.green.dark }}>
            Complaint Submitted Successfully!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Redirecting to your complaints...
          </Typography>
        </Box>
      </Fade>
    );
  }

  return (
    <Fade in timeout={600}>
      <Box>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" fontWeight={800} sx={{ color: nairobiColors.green.dark }}>
            Submit a Complaint
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Report a public service issue in Nairobi County
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4 },
            maxWidth: 800,
            borderRadius: 3,
            border: `1px solid ${alpha(nairobiColors.green.main, 0.08)}`,
          }}
        >
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth label="Title" name="title" value={form.title}
                  onChange={handleChange} required
                  placeholder="Brief description of the issue"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth label="Description" name="description" value={form.description}
                  onChange={handleChange} required multiline rows={4}
                  placeholder="Provide detailed information about the issue"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>

              {/* AI Category Suggestion */}
              <Grid item xs={12}>
                <Collapse in={!!(aiSuggestion?.suggested_category || aiLoading)}>
                  <Box
                    sx={{
                      p: 2,
                      mb: 1,
                      borderRadius: 2,
                      bgcolor: alpha(nairobiColors.gold.main, 0.05),
                      border: `1px solid ${alpha(nairobiColors.gold.main, 0.15)}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                    }}
                  >
                    {aiLoading ? (
                      <>
                        <CircularProgress size={16} sx={{ color: nairobiColors.gold.main }} />
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem' }}>
                          AI is analyzing your complaint...
                        </Typography>
                      </>
                    ) : aiSuggestion?.suggested_category ? (
                      <>
                        <Sparkles size={18} color={nairobiColors.gold.main} strokeWidth={1.75} />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Lightbulb size={14} color={nairobiColors.gold.main} strokeWidth={1.75} />
                            AI Suggestion: {aiSuggestion.suggested_category}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Confidence: {Math.round(aiSuggestion.confidence * 100)}%
                            {aiSuggestion.alternatives.length > 0 && (
                              <> | Also consider: {aiSuggestion.alternatives.join(', ')}</>
                            )}
                          </Typography>
                        </Box>
                        <Chip
                          label="Apply"
                          size="small"
                          onClick={() => applySuggestion(aiSuggestion.suggested_category!)}
                          sx={{
                            cursor: 'pointer',
                            bgcolor: nairobiColors.green.main,
                            color: '#fff',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            '&:hover': { bgcolor: nairobiColors.green.dark },
                          }}
                        />
                      </>
                    ) : null}
                  </Box>
                </Collapse>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth label="Category" name="category" select
                  value={form.category} onChange={handleChange} required
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                >
                  {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth label="Ward" name="ward" select
                  value={form.ward} onChange={handleChange}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                >
                  <MenuItem value="">-- Select Ward --</MenuItem>
                  {wards.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth label="Location" name="location" value={form.location}
                  onChange={handleChange} required
                  placeholder="e.g., Ngong Road near Adams Arcade"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  component="label" variant="outlined" startIcon={<Upload size={18} strokeWidth={1.75} />}
                  sx={{
                    borderStyle: 'dashed',
                    py: 1.5,
                    textTransform: 'none',
                    borderRadius: 2,
                    color: nairobiColors.green.main,
                    borderColor: alpha(nairobiColors.green.main, 0.3),
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: nairobiColors.green.main,
                      bgcolor: alpha(nairobiColors.green.main, 0.04),
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  Upload Photo (optional)
                  <input type="file" hidden accept="image/*" onChange={handleImageChange} />
                </Button>
                {imagePreview && (
                  <Box sx={{ mt: 2, position: 'relative', display: 'inline-block' }}>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={{ maxWidth: 300, maxHeight: 200, borderRadius: 12, display: 'block' }}
                    />
                    <IconButton
                      onClick={handleRemoveImage} size="small"
                      sx={{
                        position: 'absolute', top: -8, right: -8,
                        bgcolor: nairobiColors.maroon.main, color: '#fff',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        '&:hover': { bgcolor: nairobiColors.maroon.dark },
                      }}
                    >
                      <Trash2 size={18} strokeWidth={1.75} />
                    </IconButton>
                  </Box>
                )}
              </Grid>
              <Grid item xs={12}>
                <Button
                  type="submit" variant="contained" size="large" disabled={loading}
                  startIcon={<Send size={18} strokeWidth={1.75} />}
                  sx={{
                    py: 1.5,
                    px: 5,
                    borderRadius: 2.5,
                    fontWeight: 700,
                    background: `linear-gradient(135deg, ${nairobiColors.green.main} 0%, ${nairobiColors.green.dark} 100%)`,
                    boxShadow: `0 4px 16px ${alpha(nairobiColors.green.main, 0.3)}`,
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 6px 24px ${alpha(nairobiColors.green.main, 0.4)}`,
                    },
                  }}
                >
                  {loading ? 'Submitting...' : 'Submit Complaint'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Box>
    </Fade>
  );
};

export default SubmitComplaintPage;
