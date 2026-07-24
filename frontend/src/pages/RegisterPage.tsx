import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Container, Paper, TextField, Button, Typography, Alert, Link,
  InputAdornment, IconButton, alpha, Fade, Chip,
} from '@mui/material';
import { Visibility, VisibilityOff, AutoAwesome } from '@mui/icons-material';
import { authAPI } from '../services/api';
import NairobiCoatOfArms from '../components/NairobiCoatOfArms';
import { WildlifeBanner } from '../components/WildlifeIllustrations';
import ShaderBackground from '../components/ShaderBackground';
import { nairobiColors } from '../theme/nairobiTheme';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '', full_name: '', phone_number: '',
    password: '', password_confirm: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (form.password !== form.password_confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await authAPI.register(form);
      navigate('/login');
    } catch (err: any) {
      const data = err.response?.data;
      if (data) {
        const messages = Object.values(data).flat().join(' ');
        setError(messages);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
      overflowX: 'hidden',
      py: 4,
      background: `linear-gradient(160deg, ${nairobiColors.green.dark} 0%, ${nairobiColors.green.main} 35%, #1a5c38 65%, ${nairobiColors.green.dark} 100%)`,
    }}>
      <ShaderBackground />

      <Box sx={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, transparent, ${nairobiColors.gold.main}, transparent)`,
      }} />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Fade in timeout={800}>
          <Paper elevation={0} sx={{
            p: { xs: 4, sm: 5 },
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(24px)',
            border: `1px solid ${alpha(nairobiColors.gold.main, 0.2)}`,
            boxShadow: `0 16px 48px ${alpha('#000', 0.12)}`,
          }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <NairobiCoatOfArms size={70} />
              <Typography variant="h5" fontWeight={800} sx={{ color: nairobiColors.green.dark, mt: 1.5 }}>
                Create Account
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Join Nairobi County Citizen Engagement Platform
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 1.5 }}>
                <Box sx={{ width: 40, height: 2, background: `linear-gradient(90deg, transparent, ${nairobiColors.green.main})`, borderRadius: 2 }} />
                <Chip
                  icon={<AutoAwesome sx={{ fontSize: 12 }} />}
                  label="AI-Enhanced"
                  size="small"
                  sx={{
                    bgcolor: alpha(nairobiColors.green.main, 0.08),
                    color: nairobiColors.green.main,
                    fontWeight: 600, fontSize: '0.62rem', height: 22,
                    border: `1px solid ${alpha(nairobiColors.green.main, 0.15)}`,
                    '& .MuiChip-icon': { color: nairobiColors.gold.main },
                  }}
                />
                <Box sx={{ width: 40, height: 2, background: `linear-gradient(90deg, ${nairobiColors.gold.main}, transparent)`, borderRadius: 2 }} />
              </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

            <form onSubmit={handleSubmit}>
              <TextField fullWidth margin="normal" label="Full Name" name="full_name" value={form.full_name} onChange={handleChange} required />
              <TextField fullWidth margin="normal" label="Email Address" name="email" type="email" value={form.email} onChange={handleChange} required />
              <TextField fullWidth margin="normal" label="Phone Number" name="phone_number" value={form.phone_number} onChange={handleChange} placeholder="+254..." />
              <TextField
                fullWidth margin="normal" label="Password" name="password" required
                type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleChange}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField fullWidth margin="normal" label="Confirm Password" name="password_confirm" type="password" value={form.password_confirm} onChange={handleChange} required />
              <Button
                type="submit" fullWidth variant="contained" disabled={loading}
                sx={{
                  mt: 3, mb: 2, py: 1.5, borderRadius: 2.5, fontSize: '0.95rem', fontWeight: 700,
                  background: `linear-gradient(135deg, ${nairobiColors.green.main} 0%, ${nairobiColors.green.dark} 100%)`,
                  boxShadow: `0 4px 16px ${alpha(nairobiColors.green.main, 0.3)}`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': { transform: 'translateY(-1px)', boxShadow: `0 6px 24px ${alpha(nairobiColors.green.main, 0.4)}` },
                }}
              >
                {loading ? 'Creating Account...' : 'Register'}
              </Button>
            </form>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link component={RouterLink} to="/login" sx={{
                  color: nairobiColors.green.main, fontWeight: 600, textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline', color: nairobiColors.green.dark },
                }}>
                  Sign In
                </Link>
              </Typography>
            </Box>
          </Paper>
        </Fade>

        <WildlifeBanner variant="login" />
      </Container>

      <Box sx={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, transparent, ${nairobiColors.gold.main}, transparent)`,
      }} />
    </Box>
  );
};

export default RegisterPage;
