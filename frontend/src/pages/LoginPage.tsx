import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Container, Paper, TextField, Button, Typography, Alert, Link,
  InputAdornment, IconButton, alpha, Fade, Chip,
} from '@mui/material';
import { Visibility, VisibilityOff, AutoAwesome } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import NairobiCoatOfArms from '../components/NairobiCoatOfArms';
import { WildlifeBanner } from '../components/WildlifeIllustrations';
import ShaderBackground from '../components/ShaderBackground';
import { nairobiColors } from '../theme/nairobiTheme';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password');
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

      {/* Gold accent lines */}
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
            boxShadow: `0 16px 48px ${alpha('#000', 0.12)}, 0 0 0 1px ${alpha('#fff', 0.05)}`,
          }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <NairobiCoatOfArms size={80} />
              <Typography variant="h4" fontWeight={800} sx={{ color: nairobiColors.green.dark, mt: 2 }}>
                Nairobi County
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                Citizen Engagement Platform
              </Typography>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.5,
                mt: 1.5,
              }}>
                <Box sx={{
                  width: 40, height: 2,
                  background: `linear-gradient(90deg, transparent, ${nairobiColors.green.main})`,
                  borderRadius: 2,
                }} />
                <Chip
                  icon={<AutoAwesome sx={{ fontSize: 12 }} />}
                  label="AI-Enhanced"
                  size="small"
                  sx={{
                    bgcolor: alpha(nairobiColors.green.main, 0.08),
                    color: nairobiColors.green.main,
                    fontWeight: 600,
                    fontSize: '0.62rem',
                    height: 22,
                    border: `1px solid ${alpha(nairobiColors.green.main, 0.15)}`,
                    '& .MuiChip-icon': { color: nairobiColors.gold.main },
                  }}
                />
                <Box sx={{
                  width: 40, height: 2,
                  background: `linear-gradient(90deg, ${nairobiColors.gold.main}, transparent)`,
                  borderRadius: 2,
                }} />
              </Box>
            </Box>

            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 2,
                  borderRadius: 2,
                  border: `1px solid ${alpha(nairobiColors.maroon.main, 0.2)}`,
                }}
              >
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth margin="normal" label="Email Address" type="email"
                value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    transition: 'all 0.2s',
                    '&:hover': { boxShadow: `0 2px 8px ${alpha(nairobiColors.green.main, 0.08)}` },
                    '&.Mui-focused': { boxShadow: `0 2px 12px ${alpha(nairobiColors.green.main, 0.12)}` },
                  },
                }}
              />
              <TextField
                fullWidth margin="normal" label="Password" required
                type={showPassword ? 'text' : 'password'}
                value={password} onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    transition: 'all 0.2s',
                    '&:hover': { boxShadow: `0 2px 8px ${alpha(nairobiColors.green.main, 0.08)}` },
                    '&.Mui-focused': { boxShadow: `0 2px 12px ${alpha(nairobiColors.green.main, 0.12)}` },
                  },
                }}
              />
              <Box sx={{ textAlign: 'right', mt: 1 }}>
                <Link
                  component={RouterLink}
                  to="/forgot-password"
                  variant="body2"
                  sx={{ color: nairobiColors.green.main, fontWeight: 500, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                  Forgot password?
                </Link>
              </Box>
              <Button
                type="submit" fullWidth variant="contained" disabled={loading}
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.5,
                  borderRadius: 2.5,
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  background: `linear-gradient(135deg, ${nairobiColors.green.main} 0%, ${nairobiColors.green.dark} 100%)`,
                  boxShadow: `0 4px 16px ${alpha(nairobiColors.green.main, 0.3)}`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: `0 6px 24px ${alpha(nairobiColors.green.main, 0.4)}`,
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  },
                }}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <Link
                  component={RouterLink}
                  to="/register"
                  sx={{
                    color: nairobiColors.green.main,
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    '&:hover': {
                      textDecoration: 'underline',
                      color: nairobiColors.green.dark,
                    },
                  }}
                >
                  Register here
                </Link>
              </Typography>
            </Box>
          </Paper>
        </Fade>

        <WildlifeBanner variant="login" />
      </Container>

      {/* Bottom gold accent */}
      <Box sx={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, transparent, ${nairobiColors.gold.main}, transparent)`,
      }} />
    </Box>
  );
};

export default LoginPage;
