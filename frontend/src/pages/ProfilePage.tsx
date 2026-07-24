import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Alert, Grid, Avatar, IconButton,
} from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { nairobiColors } from '../theme/nairobiTheme';

const ProfilePage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    phone_number: user?.phone_number || '',
  });
  const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '' });
  const [emailForm, setEmailForm] = useState({ new_email: '', current_password: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    setForm({ full_name: user?.full_name || '', phone_number: user?.phone_number || '' });
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await authAPI.updateProfile(form);
      await refreshProfile();
      setMessage('Profile updated successfully');
    } catch (err: any) {
      setError('Failed to update profile');
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMessage('');
    setError('');
    setAvatarUploading(true);
    try {
      await authAPI.updateProfile({ avatar: file });
      await refreshProfile();
      setMessage('Profile photo updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.avatar?.[0] || 'Failed to upload photo');
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await authAPI.changePassword(passwordForm);
      setPasswordForm({ old_password: '', new_password: '' });
      setMessage('Password changed successfully');
    } catch (err: any) {
      setError(err.response?.data?.old_password?.[0] || 'Failed to change password');
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await authAPI.changeEmail(emailForm);
      await refreshProfile();
      setEmailForm({ new_email: '', current_password: '' });
      setMessage('Email updated successfully');
    } catch (err: any) {
      const data = err.response?.data;
      setError(data?.new_email?.[0] || data?.current_password?.[0] || 'Failed to update email');
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom sx={{ color: nairobiColors.green.dark }}>My Profile</Typography>

      {message && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage('')}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ color: nairobiColors.green.dark }}>Profile Information</Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar
                src={user?.avatar || undefined}
                sx={{ width: 72, height: 72, bgcolor: nairobiColors.gold.main, color: nairobiColors.green.dark, fontWeight: 800, fontSize: '1.5rem' }}
              >
                {user?.full_name?.charAt(0)}
              </Avatar>
              <Box>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" hidden onChange={handleAvatarChange} />
                <Button
                  size="small" variant="outlined" startIcon={<PhotoCamera />}
                  disabled={avatarUploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {avatarUploading ? 'Uploading...' : 'Change Photo'}
                </Button>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                  JPEG, PNG, GIF, or WebP. Max 5MB.
                </Typography>
              </Box>
            </Box>

            <form onSubmit={handleUpdateProfile}>
              <TextField fullWidth margin="normal" label="Email" value={user?.email || ''} disabled />
              <TextField fullWidth margin="normal" label="Role" value={user?.role?.toUpperCase() || ''} disabled />
              <TextField fullWidth margin="normal" label="Full Name" value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
              <TextField fullWidth margin="normal" label="Phone Number" value={form.phone_number}
                onChange={(e) => setForm({ ...form, phone_number: e.target.value })} />
              <Button type="submit" variant="contained" sx={{ mt: 2 }}>
                Update Profile
              </Button>
            </form>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 4, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ color: nairobiColors.green.dark }}>Change Password</Typography>
            <form onSubmit={handleChangePassword}>
              <TextField fullWidth margin="normal" label="Current Password" type="password"
                value={passwordForm.old_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })} required />
              <TextField fullWidth margin="normal" label="New Password" type="password"
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })} required />
              <Button type="submit" variant="contained" sx={{ mt: 2 }}>
                Change Password
              </Button>
            </form>
          </Paper>

          <Paper sx={{ p: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ color: nairobiColors.green.dark }}>Change Email</Typography>
            <form onSubmit={handleChangeEmail}>
              <TextField fullWidth margin="normal" label="New Email Address" type="email"
                value={emailForm.new_email}
                onChange={(e) => setEmailForm({ ...emailForm, new_email: e.target.value })} required />
              <TextField fullWidth margin="normal" label="Current Password" type="password"
                value={emailForm.current_password}
                onChange={(e) => setEmailForm({ ...emailForm, current_password: e.target.value })} required />
              <Button type="submit" variant="contained" sx={{ mt: 2 }}>
                Change Email
              </Button>
            </form>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProfilePage;
