import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import { SearchOff } from '@mui/icons-material';
import { nairobiColors } from '../theme/nairobiTheme';
import { useAuth } from '../contexts/AuthContext';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <Box sx={{
      minHeight: '60vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center', p: 4,
    }}>
      <SearchOff sx={{ fontSize: 80, color: nairobiColors.gold.main, mb: 2 }} />
      <Typography variant="h4" fontWeight={800} sx={{ color: nairobiColors.green.dark }}>404</Typography>
      <Typography variant="h6" fontWeight={600} gutterBottom>Page Not Found</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 420 }}>
        The page you're looking for doesn't exist or may have been moved.
      </Typography>
      <Button variant="contained" onClick={() => navigate(user ? '/dashboard' : '/')}>
        {user ? 'Go to Dashboard' : 'Go to Home'}
      </Button>
    </Box>
  );
};

export default NotFoundPage;
