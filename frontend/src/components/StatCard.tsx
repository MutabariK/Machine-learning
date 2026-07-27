import React from 'react';
import { Paper, Typography, Box, alpha, Skeleton } from '@mui/material';
import { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  trend?: { value: number; label: string };
  loading?: boolean;
}

const StatCard: React.FC<Props> = ({ title, value, icon: Icon, color, trend, loading }) => {
  if (loading) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          minHeight: 120,
          borderRadius: 3,
          border: '1px solid',
          borderColor: alpha('#000', 0.06),
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Skeleton width={80} height={16} />
            <Skeleton width={60} height={32} sx={{ mt: 1 }} />
          </Box>
          <Skeleton variant="circular" width={44} height={44} />
        </Box>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        minHeight: 120,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: 3,
        position: 'relative',
        overflow: 'hidden',
        background: `linear-gradient(135deg, ${alpha(color, 0.04)} 0%, ${alpha(color, 0.01)} 100%)`,
        border: `1px solid ${alpha(color, 0.12)}`,
        backdropFilter: 'blur(10px)',
        transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'default',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${color}, ${alpha(color, 0.4)})`,
          borderRadius: '3px 3px 0 0',
        },
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 12px 28px ${alpha(color, 0.18)}, 0 0 0 1px ${alpha(color, 0.08)}`,
          borderColor: alpha(color, 0.25),
          '& .stat-icon': {
            transform: 'scale(1.1) rotate(5deg)',
          },
          '& .stat-value': {
            transform: 'scale(1.02)',
          },
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontSize: '0.68rem',
            }}
            noWrap
          >
            {title}
          </Typography>
          <Typography
            className="stat-value"
            variant="h5"
            sx={{
              fontWeight: 800,
              mt: 0.5,
              color: 'text.primary',
              lineHeight: 1.2,
              transition: 'transform 0.3s ease',
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
            }}
            noWrap
          >
            {value}
          </Typography>
        </Box>
        <Box
          className="stat-icon"
          sx={{
            bgcolor: alpha(color, 0.1),
            borderRadius: 2.5,
            p: 1.2,
            display: 'flex',
            flexShrink: 0,
            transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: `0 2px 8px ${alpha(color, 0.12)}`,
          }}
        >
          <Icon size={26} color={color} strokeWidth={1.75} />
        </Box>
      </Box>

      {trend && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1.5 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              px: 0.8,
              py: 0.2,
              borderRadius: 1,
              bgcolor: trend.value >= 0 ? alpha('#4CAF50', 0.1) : alpha('#f44336', 0.1),
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: trend.value >= 0 ? '#2E7D32' : '#C62828',
                fontSize: '0.7rem',
              }}
            >
              {trend.value >= 0 ? '+' : ''}{trend.value}%
            </Typography>
          </Box>
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
            {trend.label}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default StatCard;
