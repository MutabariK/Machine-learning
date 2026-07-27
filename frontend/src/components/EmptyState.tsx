import React from 'react';
import { Box, Typography, Button, alpha } from '@mui/material';
import { LucideIcon } from 'lucide-react';
import { nairobiColors } from '../theme/nairobiTheme';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  compact?: boolean;
}

/** Shared empty-state treatment: icon badge, title, optional description/action. */
const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, action, compact }) => (
  <Box sx={{ textAlign: 'center', py: compact ? 3 : 6, px: 2 }}>
    <Box sx={{
      width: compact ? 48 : 64,
      height: compact ? 48 : 64,
      borderRadius: '50%',
      bgcolor: alpha(nairobiColors.green.main, 0.08),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      mx: 'auto',
      mb: 2,
    }}>
      <Icon size={compact ? 22 : 28} color={nairobiColors.green.main} strokeWidth={1.75} />
    </Box>
    <Typography variant="subtitle1" fontWeight={600} sx={{ color: 'text.primary', mb: description ? 0.5 : 0 }}>
      {title}
    </Typography>
    {description && (
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360, mx: 'auto' }}>
        {description}
      </Typography>
    )}
    {action && (
      <Button variant="outlined" size="small" onClick={action.onClick} sx={{ mt: 2.5 }}>
        {action.label}
      </Button>
    )}
  </Box>
);

export default EmptyState;
