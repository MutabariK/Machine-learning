import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, TextField, Button, Typography, Alert, Link,
  InputAdornment, IconButton,
} from '@mui/material';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuthShell from '../components/AuthShell';
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
    <AuthShell title="Sign In" subtitle="Citizen Engagement Platform">
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth margin="normal" label="Email Address" type="email"
          value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus
        />
        <TextField
          fullWidth margin="normal" label="Password" required
          type={showPassword ? 'text' : 'password'}
          value={password} onChange={(e) => setPassword(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                  {showPassword ? <EyeOff size={19} strokeWidth={1.75} /> : <Eye size={19} strokeWidth={1.75} />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <Box sx={{ textAlign: 'right', mt: 1 }}>
          <Link component={RouterLink} to="/forgot-password" variant="body2" sx={{ color: nairobiColors.green.main, fontWeight: 500 }}>
            Forgot password?
          </Link>
        </Box>
        <Button type="submit" fullWidth variant="contained" disabled={loading} sx={{ mt: 3, mb: 2, py: 1.5 }}>
          {loading ? 'Signing In...' : 'Sign In'}
        </Button>
      </form>

      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Don't have an account?{' '}
          <Link component={RouterLink} to="/register" sx={{ color: nairobiColors.green.main, fontWeight: 600 }}>
            Register here
          </Link>
        </Typography>
      </Box>
    </AuthShell>
  );
};

export default LoginPage;
