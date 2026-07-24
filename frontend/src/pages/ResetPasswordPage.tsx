import React, { useState } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { Box, TextField, Button, Alert, Link } from '@mui/material';
import { authAPI } from '../services/api';
import AuthShell from '../components/AuthShell';
import { nairobiColors } from '../theme/nairobiTheme';

const ResetPasswordPage: React.FC = () => {
  const { uid, token } = useParams<{ uid: string; token: string }>();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!uid || !token) {
      setError('Invalid reset link.');
      return;
    }
    setLoading(true);
    try {
      await authAPI.confirmPasswordReset({ uid, token, new_password: newPassword });
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: any) {
      const data = err.response?.data;
      setError(data?.token?.[0] || data?.uid?.[0] || data?.new_password?.[0] || 'This reset link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Reset Password" subtitle="Choose a new password for your account.">
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {done ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          Password reset successfully. Redirecting you to sign in...
        </Alert>
      ) : (
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth margin="normal" label="New Password" type="password" required autoFocus
            value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
            helperText="At least 8 characters"
          />
          <TextField
            fullWidth margin="normal" label="Confirm New Password" type="password" required
            value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <Button type="submit" fullWidth variant="contained" disabled={loading} sx={{ mt: 3, mb: 2, py: 1.5 }}>
            {loading ? 'Resetting...' : 'Reset Password'}
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

export default ResetPasswordPage;
