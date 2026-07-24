import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, TextField, Button, Alert, Link } from '@mui/material';
import { authAPI } from '../services/api';
import AuthShell from '../components/AuthShell';
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
    <AuthShell title="Forgot Password" subtitle="Enter your email and we'll send you a reset link.">
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
    </AuthShell>
  );
};

export default ForgotPasswordPage;
