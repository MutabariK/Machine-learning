import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Typography, Paper, CircularProgress, alpha, Fade, Chip, Skeleton,
  LinearProgress, Tooltip,
} from '@mui/material';
import {
  Assessment, CheckCircle, PendingActions, Speed, Timer, TrendingUp,
  AccessTime, Category, LocationOn,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { analyticsAPI, complaintsAPI } from '../services/api';
import { SummaryStats, Complaint, WardStat } from '../types';
import StatCard from '../components/StatCard';
import { nairobiColors } from '../theme/nairobiTheme';

function wardEfficiencyColor(rate: number): string {
  if (rate >= 85) return '#2E7D32';
  if (rate >= 60) return nairobiColors.gold.dark;
  return nairobiColors.maroon.main;
}

const statusConfig: Record<string, { bg: string; color: string; label: string; icon: React.ReactNode }> = {
  submitted: { bg: alpha('#FF9800', 0.1), color: '#E65100', label: 'Submitted', icon: <AccessTime sx={{ fontSize: 14 }} /> },
  under_review: { bg: alpha(nairobiColors.green.light, 0.1), color: nairobiColors.green.main, label: 'Under Review', icon: <Assessment sx={{ fontSize: 14 }} /> },
  in_progress: { bg: alpha('#2196F3', 0.1), color: '#1565C0', label: 'In Progress', icon: <Speed sx={{ fontSize: 14 }} /> },
  resolved: { bg: alpha('#4CAF50', 0.1), color: '#2E7D32', label: 'Resolved', icon: <CheckCircle sx={{ fontSize: 14 }} /> },
  closed: { bg: alpha('#607D8B', 0.1), color: '#37474F', label: 'Closed', icon: <CheckCircle sx={{ fontSize: 14 }} /> },
};

const ComplaintItem: React.FC<{ complaint: Complaint; index: number }> = ({ complaint, index }) => {
  const config = statusConfig[complaint.status] || statusConfig.submitted;

  return (
    <Fade in timeout={300 + index * 80}>
      <Box
        sx={{
          py: 2,
          px: 2.5,
          borderBottom: `1px solid ${alpha(nairobiColors.green.main, 0.06)}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
          transition: 'all 0.2s ease',
          borderRadius: 2,
          mx: -0.5,
          '&:hover': {
            bgcolor: alpha(nairobiColors.green.main, 0.03),
            transform: 'translateX(4px)',
          },
          '&:last-child': { borderBottom: 'none' },
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={600} noWrap sx={{ mb: 0.5 }}>
            {complaint.title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Tooltip title="Category">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                <Category sx={{ fontSize: 12, color: 'text.disabled' }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  {complaint.category_name}
                </Typography>
              </Box>
            </Tooltip>
            {complaint.ward_name && (
              <Tooltip title="Ward">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                  <LocationOn sx={{ fontSize: 12, color: 'text.disabled' }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    {complaint.ward_name}
                  </Typography>
                </Box>
              </Tooltip>
            )}
            <Tooltip title="Date submitted">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                <AccessTime sx={{ fontSize: 12, color: 'text.disabled' }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  {new Date(complaint.created_at).toLocaleDateString()}
                </Typography>
              </Box>
            </Tooltip>
          </Box>
        </Box>
        <Chip
          icon={config.icon as React.ReactElement}
          label={config.label}
          size="small"
          sx={{
            bgcolor: config.bg,
            color: config.color,
            fontWeight: 600,
            fontSize: '0.68rem',
            border: `1px solid ${alpha(config.color, 0.15)}`,
            flexShrink: 0,
            '& .MuiChip-icon': { color: config.color },
          }}
        />
      </Box>
    </Fade>
  );
};

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [recentComplaints, setRecentComplaints] = useState<Complaint[]>([]);
  const [wardStats, setWardStats] = useState<WardStat[]>([]);
  const [triageQueue, setTriageQueue] = useState<Complaint[]>([]);
  const [citizenCounts, setCitizenCounts] = useState({ total: 0, pending: 0, in_progress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        if (user?.role === 'citizen') {
          const [allRes, pendingRes, progressRes, resolvedRes] = await Promise.all([
            complaintsAPI.list({ page_size: 1 }),
            complaintsAPI.list({ page_size: 1, status: 'submitted' }),
            complaintsAPI.list({ page_size: 1, status: 'in_progress' }),
            complaintsAPI.list({ page_size: 1, status: 'resolved' }),
          ]);
          setCitizenCounts({
            total: allRes.data.count || 0,
            pending: pendingRes.data.count || 0,
            in_progress: progressRes.data.count || 0,
            resolved: resolvedRes.data.count || 0,
          });
          const recentRes = await complaintsAPI.list({ page_size: 10 });
          setRecentComplaints(recentRes.data.results || []);
        } else {
          const [summaryRes, complaintsRes, wardRes, triageRes] = await Promise.all([
            analyticsAPI.getSummary(),
            complaintsAPI.list({ page_size: 10 }),
            analyticsAPI.getByWard(),
            complaintsAPI.list({ page_size: 5, status: 'submitted' }),
          ]);
          setStats(summaryRes.data);
          setRecentComplaints(complaintsRes.data.results || []);
          const sortedWards = [...(wardRes.data || [])]
            .sort((a: WardStat, b: WardStat) => b.count - a.count)
            .slice(0, 5);
          setWardStats(sortedWards);
          setTriageQueue(triageRes.data.results || []);
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading) {
    return (
      <Box>
        <Skeleton width={250} height={36} sx={{ mb: 1 }} />
        <Skeleton width={200} height={20} sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map(i => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <StatCard title="" value="" icon={<Assessment />} color="#ccc" loading />
            </Grid>
          ))}
        </Grid>
        <Paper sx={{ mt: 3, p: 3, borderRadius: 3 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <Box key={i} sx={{ py: 2, borderBottom: '1px solid #f0f0f0' }}>
              <Skeleton width="60%" height={20} />
              <Skeleton width="40%" height={14} sx={{ mt: 0.5 }} />
            </Box>
          ))}
        </Paper>
      </Box>
    );
  }

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  if (user?.role === 'citizen') {
    const completionRate = citizenCounts.total > 0
      ? Math.round((citizenCounts.resolved / citizenCounts.total) * 100)
      : 0;

    return (
      <Fade in timeout={600}>
        <Box>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" fontWeight={800} sx={{ color: nairobiColors.green.dark }}>
              {greeting}, {user.full_name?.split(' ')[0]}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Your complaint overview and recent activity
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard title="Total Submissions" value={citizenCounts.total} icon={<Assessment />} color={nairobiColors.green.main} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard title="Pending Review" value={citizenCounts.pending} icon={<PendingActions />} color={nairobiColors.gold.main} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard title="In Progress" value={citizenCounts.in_progress} icon={<Speed />} color="#2196F3" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard title="Resolved" value={citizenCounts.resolved} icon={<CheckCircle />} color="#4CAF50" />
            </Grid>
          </Grid>

          {/* Completion progress */}
          {citizenCounts.total > 0 && (
            <Paper
              elevation={0}
              sx={{
                mt: 3,
                p: 3,
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(nairobiColors.green.main, 0.04)} 0%, ${alpha(nairobiColors.gold.main, 0.03)} 100%)`,
                border: `1px solid ${alpha(nairobiColors.green.main, 0.1)}`,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" fontWeight={600}>Resolution Progress</Typography>
                <Typography variant="body2" fontWeight={700} sx={{ color: nairobiColors.green.main }}>
                  {completionRate}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={completionRate}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: alpha(nairobiColors.green.main, 0.08),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    background: `linear-gradient(90deg, ${nairobiColors.green.main}, ${nairobiColors.gold.main})`,
                  },
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {citizenCounts.resolved} of {citizenCounts.total} complaints resolved
              </Typography>
            </Paper>
          )}

          {/* Recent complaints */}
          <Paper
            elevation={0}
            sx={{
              mt: 3,
              borderRadius: 3,
              border: `1px solid ${alpha(nairobiColors.green.main, 0.08)}`,
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                px: 3,
                py: 2,
                borderBottom: `1px solid ${alpha(nairobiColors.green.main, 0.08)}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography variant="h6" fontWeight={700} sx={{ color: nairobiColors.green.dark, fontSize: '1rem' }}>
                Recent Complaints
              </Typography>
              <Chip
                label={`${recentComplaints.length} shown`}
                size="small"
                sx={{
                  bgcolor: alpha(nairobiColors.green.main, 0.08),
                  color: nairobiColors.green.main,
                  fontWeight: 600,
                  fontSize: '0.65rem',
                }}
              />
            </Box>
            <Box sx={{ px: 1 }}>
              {recentComplaints.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Assessment sx={{ fontSize: 48, color: alpha(nairobiColors.green.main, 0.15), mb: 1 }} />
                  <Typography color="text.secondary" variant="body2">
                    No complaints yet. Submit your first complaint to get started.
                  </Typography>
                </Box>
              ) : (
                recentComplaints.map((c, i) => <ComplaintItem key={c.id} complaint={c} index={i} />)
              )}
            </Box>
          </Paper>
        </Box>
      </Fade>
    );
  }

  // Official/Admin dashboard
  return (
    <Fade in timeout={600}>
      <Box>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" fontWeight={800} sx={{ color: nairobiColors.green.dark }}>
            Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Service delivery overview — real-time monitoring
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Total Complaints" value={stats?.total_complaints || 0} icon={<Assessment />} color={nairobiColors.green.main} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Open Complaints" value={stats?.open_complaints || 0} icon={<PendingActions />} color={nairobiColors.maroon.main} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Resolution Rate" value={`${stats?.resolution_rate || 0}%`} icon={<TrendingUp />} color="#4CAF50" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard title="Avg Response" value={`${stats?.avg_response_time_hours || 0}h`} icon={<Timer />} color={nairobiColors.gold.dark} />
          </Grid>
        </Grid>

        <Grid container spacing={3} sx={{ mt: 0.5 }}>
          {/* Left column: Recent Complaints + Triage Queue */}
          <Grid item xs={12} md={7}>
            {/* Recent complaints */}
            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                border: `1px solid ${alpha(nairobiColors.green.main, 0.08)}`,
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  px: 3,
                  py: 2,
                  borderBottom: `1px solid ${alpha(nairobiColors.green.main, 0.08)}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Typography variant="h6" fontWeight={700} sx={{ color: nairobiColors.green.dark, fontSize: '1rem' }}>
                  Recent Complaints
                </Typography>
                <Chip
                  label="Live"
                  size="small"
                  sx={{
                    bgcolor: alpha('#4CAF50', 0.1),
                    color: '#2E7D32',
                    fontWeight: 700,
                    fontSize: '0.65rem',
                    '&::before': {
                      content: '""',
                      display: 'inline-block',
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: '#4CAF50',
                      mr: 0.5,
                      animation: 'live-pulse 2s ease-in-out infinite',
                    },
                    '@keyframes live-pulse': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.3 },
                    },
                  }}
                />
              </Box>
              <Box sx={{ px: 1 }}>
                {recentComplaints.map((c, i) => (
                  <ComplaintItem key={c.id} complaint={c} index={i} />
                ))}
              </Box>
            </Paper>

            {/* Triage Queue */}
            <Paper
              elevation={0}
              sx={{
                mt: 3,
                borderRadius: 3,
                border: `1px solid ${alpha(nairobiColors.green.main, 0.08)}`,
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  px: 3,
                  py: 2,
                  borderBottom: `1px solid ${alpha(nairobiColors.green.main, 0.08)}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Typography variant="h6" fontWeight={700} sx={{ color: nairobiColors.green.dark, fontSize: '1rem' }}>
                  Triage Queue
                </Typography>
                <Chip
                  label={`${triageQueue.length} New`}
                  size="small"
                  sx={{
                    bgcolor: alpha(nairobiColors.maroon.main, 0.1),
                    color: nairobiColors.maroon.main,
                    fontWeight: 700,
                    fontSize: '0.65rem',
                  }}
                />
              </Box>
              <Box sx={{ p: 2 }}>
                {triageQueue.length === 0 ? (
                  <Typography color="text.secondary" variant="body2" sx={{ py: 2, textAlign: 'center' }}>
                    No complaints awaiting triage.
                  </Typography>
                ) : (
                  triageQueue.map((c, i) => {
                    const hoursOld = (Date.now() - new Date(c.created_at).getTime()) / 3600000;
                    const urgent = hoursOld > 48;
                    return (
                      <Fade in timeout={300 + i * 80} key={c.id}>
                        <Box
                          onClick={() => navigate('/complaints')}
                          sx={{
                            p: 2,
                            mb: i < triageQueue.length - 1 ? 1.5 : 0,
                            borderRadius: 2,
                            border: `1px solid ${alpha(urgent ? nairobiColors.maroon.main : nairobiColors.gold.main, 0.15)}`,
                            bgcolor: alpha(urgent ? nairobiColors.maroon.main : nairobiColors.gold.main, 0.03),
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': { transform: 'translateX(4px)', boxShadow: `0 4px 14px ${alpha('#000', 0.06)}` },
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="body2" fontWeight={700} noWrap>{c.title}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {c.location}{c.ward_name ? `, ${c.ward_name}` : ''}
                              </Typography>
                            </Box>
                            <Chip
                              label={urgent ? 'URGENT' : 'NORMAL'}
                              size="small"
                              sx={{
                                flexShrink: 0,
                                bgcolor: urgent ? nairobiColors.maroon.main : nairobiColors.gold.main,
                                color: '#fff',
                                fontWeight: 700,
                                fontSize: '0.62rem',
                              }}
                            />
                          </Box>
                        </Box>
                      </Fade>
                    );
                  })
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Right column: Ward Performance */}
          <Grid item xs={12} md={5}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                border: `1px solid ${alpha(nairobiColors.green.main, 0.08)}`,
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  px: 3,
                  py: 2,
                  borderBottom: `1px solid ${alpha(nairobiColors.green.main, 0.08)}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Typography variant="h6" fontWeight={700} sx={{ color: nairobiColors.green.dark, fontSize: '1rem' }}>
                  Ward Performance
                </Typography>
                <Chip
                  label="View Map"
                  size="small"
                  onClick={() => navigate('/analytics')}
                  sx={{
                    cursor: 'pointer',
                    bgcolor: alpha(nairobiColors.gold.main, 0.1),
                    color: nairobiColors.gold.dark,
                    fontWeight: 700,
                    fontSize: '0.65rem',
                  }}
                />
              </Box>
              <Box sx={{ p: 1 }}>
                {wardStats.length === 0 ? (
                  <Typography color="text.secondary" variant="body2" sx={{ py: 4, textAlign: 'center' }}>
                    No ward data available yet.
                  </Typography>
                ) : (
                  wardStats.map((w, i) => {
                    const color = wardEfficiencyColor(w.resolution_rate);
                    return (
                      <Fade in timeout={300 + i * 80} key={w.ward || i}>
                        <Box
                          sx={{
                            px: 2,
                            py: 1.75,
                            borderBottom: i < wardStats.length - 1 ? `1px solid ${alpha(nairobiColors.green.main, 0.06)}` : 'none',
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                            <Typography variant="body2" fontWeight={700} sx={{ color }}>
                              {w.ward || 'Unassigned'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Efficiency: {w.resolution_rate}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={w.resolution_rate}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              bgcolor: alpha(color, 0.12),
                              '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: color },
                            }}
                          />
                        </Box>
                      </Fade>
                    );
                  })
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Fade>
  );
};

export default DashboardPage;
