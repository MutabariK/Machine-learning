import React from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  Box, Container, Typography, Button, Grid, Paper, alpha, Fade,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  FileText, Radar, CheckCircle2, Star, Droplet, Construction,
  Trash2, Brain, LocateFixed, BarChart3, ArrowRight, LucideIcon,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import NairobiCoatOfArms from '../components/NairobiCoatOfArms';
import { nairobiColors } from '../theme/nairobiTheme';

const STEPS: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: FileText, title: '1. Submit', desc: 'Capture details and photos of the issue through our simple e-form.' },
  { icon: Radar, title: '2. Track', desc: 'Get a unique tracking ID and watch the status change in real-time.' },
  { icon: CheckCircle2, title: '3. Resolve', desc: 'County officials address the issue and upload proof of work.' },
  { icon: Star, title: '4. Rate', desc: 'Share your feedback to help us maintain service quality standards.' },
];

const CATEGORIES: { icon: LucideIcon; label: string }[] = [
  { icon: Droplet, label: 'Water Services' },
  { icon: Construction, label: 'Road Maintenance' },
  { icon: Trash2, label: 'Waste Management' },
];

const FEATURES: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: Brain,
    title: 'AI-Powered Categories',
    desc: 'Smart routing ensures your report reaches the specific department responsible for immediate action.',
  },
  {
    icon: LocateFixed,
    title: 'Real-Time Tracking',
    desc: 'Watch every stage of the resolution process from assessment to final verification.',
  },
  {
    icon: BarChart3,
    title: 'Ward-Level Analytics',
    desc: 'Transparent dashboards showing performance metrics across all 85 wards of Nairobi.',
  },
];

const SectionHeading: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <Box sx={{ mb: 5, textAlign: { xs: 'left', md: 'center' } }}>
    <Typography variant="h4" fontWeight={800} sx={{ color: nairobiColors.green.dark, letterSpacing: '-0.01em' }}>
      {title}
    </Typography>
    {subtitle && (
      <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
        {subtitle}
      </Typography>
    )}
    <Box sx={{ width: 64, height: 4, bgcolor: nairobiColors.gold.main, borderRadius: 2, mt: 2, mx: { xs: 0, md: 'auto' } }} />
  </Box>
);

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Box sx={{ overflowX: 'hidden' }}>
      {/* Header */}
      <Box
        component="header"
        sx={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          px: { xs: 2, md: 4 }, py: 1.5,
          bgcolor: alpha('#fff', 0.92),
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${alpha(nairobiColors.gold.main, 0.2)}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            px: 1.2, py: 0.6, borderRadius: 2, bgcolor: '#fff',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            border: `1.5px solid ${alpha(nairobiColors.gold.main, 0.5)}`,
          }}>
            <NairobiCoatOfArms size={22} />
          </Box>
          <Typography variant="h6" fontWeight={800} sx={{ color: nairobiColors.green.dark }}>
            JichoMtaani
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 3 } }}>
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 3 }}>
            <Typography component="a" href="#how-it-works" variant="body2"
              sx={{ color: 'text.secondary', fontWeight: 600, textDecoration: 'none', '&:hover': { color: nairobiColors.green.main } }}>
              How It Works
            </Typography>
            <Typography component="a" href="#categories" variant="body2"
              sx={{ color: 'text.secondary', fontWeight: 600, textDecoration: 'none', '&:hover': { color: nairobiColors.green.main } }}>
              Categories
            </Typography>
          </Box>
          <Button
            variant="outlined"
            onClick={() => navigate('/login')}
            sx={{
              borderRadius: 2, fontWeight: 700,
              borderColor: nairobiColors.green.main, color: nairobiColors.green.main,
              '&:hover': { borderColor: nairobiColors.green.dark, bgcolor: alpha(nairobiColors.green.main, 0.05) },
            }}
          >
            Sign In
          </Button>
        </Box>
      </Box>

      {/* Hero */}
      <Box sx={{
        position: 'relative',
        minHeight: { xs: '90vh', md: '85vh' },
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', pt: 10,
      }}>
        <Box
          component="img"
          src="/nairobi-skyline-sunset.png"
          alt="Nairobi skyline at sunset"
          sx={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center 70%',
          }}
        />
        <Box sx={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(160deg, ${alpha(nairobiColors.green.dark, 0.85)} 0%, ${alpha(nairobiColors.green.main, 0.55)} 45%, ${alpha(nairobiColors.green.dark, 0.9)} 100%)`,
        }} />

        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <Fade in timeout={700}>
            <Box>
              <Typography
                sx={{
                  mb: 3, color: '#fff', fontWeight: 700,
                  letterSpacing: 1.5, fontSize: '0.7rem',
                  textTransform: 'uppercase',
                }}
              >
                Official Citizen Portal
              </Typography>
              <Typography
                variant="h2" fontWeight={800}
                sx={{
                  color: '#fff', lineHeight: 1.1, letterSpacing: '-0.02em',
                  fontSize: { xs: '2.1rem', sm: '2.8rem', md: '3.4rem' },
                  textShadow: '0 4px 20px rgba(0,0,0,0.25)',
                }}
              >
                Transparent, Fast Civic Service For Every Nairobian
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: alpha('#fff', 0.9), mt: 3, mb: 5, maxWidth: 640, mx: 'auto', fontSize: '1.1rem', lineHeight: 1.6 }}
              >
                Report issues, track progress, and build a better city together. Your voice drives our capital's transformation.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center' }}>
                <Button
                  variant="contained" size="large" endIcon={<ArrowRight size={19} strokeWidth={2} />}
                  onClick={() => navigate('/register')}
                  sx={{
                    px: 4, py: 1.6, borderRadius: 2.5, fontWeight: 700, fontSize: '1rem',
                    background: `linear-gradient(135deg, ${nairobiColors.green.main} 0%, ${nairobiColors.green.dark} 100%)`,
                    boxShadow: `0 6px 24px ${alpha('#000', 0.25)}`,
                    '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 8px 28px ${alpha('#000', 0.3)}` },
                  }}
                >
                  Report an Issue
                </Button>
                <Button
                  variant="outlined" size="large"
                  onClick={() => navigate('/login')}
                  sx={{
                    px: 4, py: 1.6, borderRadius: 2.5, fontWeight: 700, fontSize: '1rem',
                    color: '#fff', borderWidth: 1.5, borderColor: alpha('#fff', 0.7),
                    '&:hover': { borderWidth: 1.5, borderColor: '#fff', bgcolor: alpha('#fff', 0.1) },
                  }}
                >
                  Sign In
                </Button>
              </Box>
            </Box>
          </Fade>
        </Container>
      </Box>

      {/* How It Works */}
      <Box id="how-it-works" sx={{ py: { xs: 7, md: 10 }, bgcolor: '#F5F7F4' }}>
        <Container maxWidth="lg">
          <SectionHeading title="How It Works" subtitle="From report to resolution in four simple steps" />
          <Grid container spacing={3}>
            {STEPS.map((step, i) => (
              <Grid item xs={12} sm={6} md={3} key={step.title}>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: i * 0.08, ease: 'easeOut' }}
                  style={{ height: '100%' }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3.5, height: '100%', borderRadius: 3,
                      border: `1px solid ${alpha(nairobiColors.green.main, 0.1)}`,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0 12px 28px ${alpha(nairobiColors.green.main, 0.12)}`,
                        borderColor: alpha(nairobiColors.green.main, 0.2),
                      },
                    }}
                  >
                    <Box sx={{
                      width: 52, height: 52, borderRadius: '50%',
                      bgcolor: alpha(nairobiColors.green.main, 0.1),
                      display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2,
                    }}>
                      <step.icon size={26} color={nairobiColors.green.main} strokeWidth={1.75} />
                    </Box>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: nairobiColors.green.dark, mb: 1 }}>
                      {step.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {step.desc}
                    </Typography>
                  </Paper>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Categories */}
      <Box id="categories" sx={{ position: 'relative', py: { xs: 7, md: 10 }, overflow: 'hidden' }}>
        <Box
          component="img"
          src="/nairobi-street-dusk.png"
          alt=""
          sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <Box sx={{ position: 'absolute', inset: 0, bgcolor: alpha('#fff', 0.92) }} />
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <SectionHeading title="Report by Category" subtitle="Select a sector to start your report" />
          <Grid container spacing={2}>
            {CATEGORIES.map((cat, i) => (
              <Grid item xs={6} sm={4} md={3} key={cat.label}>
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.35, delay: i * 0.05, ease: 'easeOut' }}
                >
                  <Paper
                    elevation={0}
                    onClick={() => navigate('/login')}
                    sx={{
                      p: 3, borderRadius: 3, textAlign: 'center', cursor: 'pointer',
                      border: `1px solid ${alpha(nairobiColors.green.main, 0.1)}`,
                      transition: 'all 0.25s ease',
                      '&:hover': {
                        bgcolor: nairobiColors.green.main,
                        borderColor: nairobiColors.green.main,
                        transform: 'translateY(-3px)',
                        boxShadow: `0 10px 24px ${alpha(nairobiColors.green.main, 0.25)}`,
                        '& .cat-icon': { color: '#fff' },
                        '& .cat-label': { color: '#fff' },
                      },
                    }}
                  >
                    <cat.icon
                      className="cat-icon"
                      size={30}
                      color={nairobiColors.green.main}
                      strokeWidth={1.75}
                      style={{ marginBottom: 8, transition: 'color 0.25s' }}
                    />
                    <Typography
                      className="cat-label" variant="caption"
                      sx={{
                        display: 'block', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
                        fontSize: '0.7rem', color: 'text.primary', transition: 'color 0.25s',
                      }}
                    >
                      {cat.label}
                    </Typography>
                  </Paper>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Features */}
      <Box sx={{ py: { xs: 7, md: 10 }, bgcolor: '#F5F7F4' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {FEATURES.map((f, i) => (
              <Grid item xs={12} md={4} key={f.title}>
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.35, delay: i * 0.08, ease: 'easeOut' }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <f.icon size={30} color={nairobiColors.gold.dark} strokeWidth={1.75} />
                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: nairobiColors.green.dark }}>
                      {f.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {f.desc}
                    </Typography>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <Box component="footer" sx={{ bgcolor: nairobiColors.green.main, color: '#fff', position: 'relative' }}>
        <Box sx={{ height: 4, bgcolor: nairobiColors.gold.main }} />
        <Container maxWidth="lg" sx={{ pt: { xs: 5, md: 8 }, pb: 4 }}>
          <Grid container spacing={4} justifyContent="space-between">
            <Grid item xs={12} md={5}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Box sx={{
                  px: 1.2, py: 0.6, borderRadius: 2,
                  bgcolor: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <NairobiCoatOfArms size={24} />
                </Box>
                <Typography variant="h6" fontWeight={700} sx={{ color: nairobiColors.gold.light }}>
                  JichoMtaani
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: alpha('#fff', 0.8), maxWidth: 360 }}>
                Dedicated to excellence in service delivery and citizen-centered governance for the Green City in the Sun.
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ color: nairobiColors.gold.light, mb: 1.5 }}>
                Quick Links
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography component="a" href="#" variant="body2" sx={{ color: alpha('#fff', 0.8), textDecoration: 'none', '&:hover': { color: nairobiColors.gold.light } }}>
                  Privacy Policy
                </Typography>
                <Typography component="a" href="#" variant="body2" sx={{ color: alpha('#fff', 0.8), textDecoration: 'none', '&:hover': { color: nairobiColors.gold.light } }}>
                  Terms of Service
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ color: nairobiColors.gold.light, mb: 1.5 }}>
                Support
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography component="a" href="#" variant="body2" sx={{ color: alpha('#fff', 0.8), textDecoration: 'none', '&:hover': { color: nairobiColors.gold.light } }}>
                  Help Center
                </Typography>
                <Typography component="a" href="#" variant="body2" sx={{ color: alpha('#fff', 0.8), textDecoration: 'none', '&:hover': { color: nairobiColors.gold.light } }}>
                  Public Notices
                </Typography>
              </Box>
            </Grid>
          </Grid>
          <Box sx={{ borderTop: `1px solid ${alpha('#fff', 0.15)}`, mt: 5, pt: 3, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: alpha('#fff', 0.6) }}>
              © {new Date().getFullYear()} JichoMtaani. All Rights Reserved.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
