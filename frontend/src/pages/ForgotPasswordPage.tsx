import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box, Container, Paper, TextField, Button, Typography, Alert, Link, alpha, Fade,
} from '@mui/material';
import { authAPI } from '../services/api';
import NairobiCoatOfArms from '../components/NairobiCoatOfArms';
import ShaderBackground from '../components/ShaderBackground';
import { nairobiColors } from '../theme/nairobiTheme';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authAPI.requestPasswordReset(email);
      setSent(true);
    } catch (err: any) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', position: 'relative',
      overflowX: 'hidden', py: 4,
      background: `linear-gradient(160deg, ${nairobiColors.green.dark} 0%, ${nairobiColors.green.main} 35%, #1a5c38 65%, ${nairobiColors.green.dark} 100%)`,
    }}>
      <ShaderBackground />
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Fade in timeout={800}>
          <Paper elevation={0} sx={{
            p: { xs: 4, sm: 5 }, borderRadius: 4, background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(24px)', border: `1px solid ${alpha(nairobiColors.gold.main, 0.2)}`,
            boxShadow: `0 16px 48px ${alpha('#000', 0.12)}`,
          }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <NairobiCoatOfArms size={72} />
              <Typography variant="h5" fontWeight={800} sx={{ color: nairobiColors.green.dark, mt: 2 }}>
                Forgot Password
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Enter your email and we'll send you a reset link.
              </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {sent ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                If an account exists with that email, a password reset link has been sent.
              </Alert>
            ) : (
              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth margin="normal" label="Email Address" type="email"
                  value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus
                />
                <Button type="submit" fullWidth variant="contained" disabled={loading} sx={{ mt: 3, mb: 2, py: 1.5 }}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>
            )}

            <Box sx={{ textAlign: 'center' }}>
              <Link component={RouterLink} to="/login" sx={{ color: nairobiColors.green.main, fontWeight: 600 }}>
                Back to Sign In
              </Link>
            </Box>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default ForgotPasswordPage;
