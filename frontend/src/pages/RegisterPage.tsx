import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, TextField, Button, Typography, Alert, Link,
  InputAdornment, IconButton,
} from '@mui/material';
import { Eye, EyeOff } from 'lucide-react';
import { authAPI } from '../services/api';
import AuthShell from '../components/AuthShell';
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
    <AuthShell title="Create Account" subtitle="Join Nairobi County Citizen Engagement Platform">
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

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
                  {showPassword ? <EyeOff size={19} strokeWidth={1.75} /> : <Eye size={19} strokeWidth={1.75} />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <TextField fullWidth margin="normal" label="Confirm Password" name="password_confirm" type="password" value={form.password_confirm} onChange={handleChange} required />
        <Button type="submit" fullWidth variant="contained" disabled={loading} sx={{ mt: 3, mb: 2, py: 1.5 }}>
          {loading ? 'Creating Account...' : 'Register'}
        </Button>
      </form>

      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Already have an account?{' '}
          <Link component={RouterLink} to="/login" sx={{ color: nairobiColors.green.main, fontWeight: 600 }}>
            Sign In
          </Link>
        </Typography>
      </Box>
    </AuthShell>
  );
};

export default RegisterPage;
