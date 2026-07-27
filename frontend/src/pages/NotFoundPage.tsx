import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { SearchX } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import EmptyState from '../components/EmptyState';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <EmptyState
        icon={SearchX}
        title="Page Not Found"
        description="The page you're looking for doesn't exist or may have been moved."
        action={{
          label: user ? 'Go to Dashboard' : 'Go to Home',
          onClick: () => navigate(user ? '/dashboard' : '/'),
        }}
      />
    </Box>
  );
};

export default NotFoundPage;
