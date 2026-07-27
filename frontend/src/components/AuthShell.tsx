import React from 'react';
import { Box, Container, Paper, Typography, alpha } from '@mui/material';
import { motion } from 'framer-motion';
import NairobiCoatOfArms from './NairobiCoatOfArms';
import { nairobiColors } from '../theme/nairobiTheme';

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm';
}

/** Shared flat, institutional layout for the login/register/password screens. */
const AuthShell: React.FC<AuthShellProps> = ({ title, subtitle, children, maxWidth = 'sm' }) => (
  <Box sx={{ minHeight: '100vh', bgcolor: '#F5F7F4', display: 'flex', flexDirection: 'column' }}>
    <Box sx={{
      bgcolor: nairobiColors.green.dark,
      borderBottom: `3px solid ${nairobiColors.gold.main}`,
      py: 2.5,
      display: 'flex',
      justifyContent: 'center',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ bgcolor: '#fff', borderRadius: 1.5, p: 0.75, display: 'flex' }}>
          <NairobiCoatOfArms size={32} />
        </Box>
        <Typography variant="h6" fontWeight={800} sx={{ color: '#fff' }}>
          Nairobi County
        </Typography>
      </Box>
    </Box>

    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', py: 6 }}>
      <Container maxWidth={maxWidth}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <Paper sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: 2,
            border: `1px solid ${alpha(nairobiColors.green.main, 0.08)}`,
            boxShadow: `0 4px 20px ${alpha('#000', 0.06)}`,
          }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="h5" fontWeight={700} sx={{ color: nairobiColors.green.dark }}>
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {subtitle}
                </Typography>
              )}
            </Box>
            {children}
          </Paper>
        </motion.div>
      </Container>
    </Box>
  </Box>
);

export default AuthShell;
