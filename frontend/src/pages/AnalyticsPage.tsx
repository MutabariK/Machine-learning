import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Paper, Typography, TextField, MenuItem, CircularProgress, Button, Alert,
} from '@mui/material';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { analyticsAPI } from '../services/api';
import { SummaryStats, CategoryStat, WardStat, TrendData, OfficialStat } from '../types';
import StatCard from '../components/StatCard';
import { Assessment, CheckCircle, Timer, TrendingUp, PendingActions, Speed, Download } from '@mui/icons-material';
import { nairobiColors } from '../theme/nairobiTheme';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const CHART_COLORS = [
  nairobiColors.green.main,
  nairobiColors.gold.main,
  nairobiColors.green.light,
  nairobiColors.gold.dark,
  '#2E7D32',
  nairobiColors.maroon.main,
  '#4CAF50',
  '#A68B3C',
];

function getDateFrom(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

const AnalyticsPage: React.FC = () => {
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [catStats, setCatStats] = useState<CategoryStat[]>([]);
  const [wardStats, setWardStats] = useState<WardStat[]>([]);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [servicePerf, setServicePerf] = useState<CategoryStat[]>([]);
  const [officialStats, setOfficialStats] = useState<OfficialStat[]>([]);
  const [period, setPeriod] = useState('daily');
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const dateParams = { date_from: getDateFrom(days) };
        const [summaryRes, catRes, wardRes, trendRes, statusRes, perfRes, officialRes] = await Promise.all([
          analyticsAPI.getSummary(dateParams),
          analyticsAPI.getByCategory(dateParams),
          analyticsAPI.getByWard(dateParams),
          analyticsAPI.getTrends({ period, days }),
          analyticsAPI.getByStatus(dateParams),
          analyticsAPI.getServicePerformance(dateParams),
          analyticsAPI.getByOfficial(dateParams),
        ]);
        setStats(summaryRes.data);
        setCatStats(catRes.data);
        setWardStats(wardRes.data);
        setTrends(trendRes.data);
        setStatusData(statusRes.data);
        setServicePerf(perfRes.data);
        setOfficialStats(officialRes.data);
      } catch (err) { setError('Failed to load analytics data. Please try again.'); }
      finally { setLoading(false); }
    };
    load();
  }, [period, days]);

  const handleExportCSV = async () => {
    try {
      const res = await analyticsAPI.exportCSV({ date_from: getDateFrom(days) });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'service_delivery_report.csv';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) { setError('Failed to export CSV. Please try again.'); }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress color="primary" /></Box>;

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ color: nairobiColors.green.dark }}>Data Analytics</Typography>
          <Typography variant="body2" color="text.secondary">Service delivery analysis — last {days} days</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<Download />} onClick={handleExportCSV}>
            Export CSV
          </Button>
          <TextField size="small" label="Period" select value={period} onChange={(e) => setPeriod(e.target.value)} sx={{ width: 120 }}>
            <MenuItem value="daily">Daily</MenuItem>
            <MenuItem value="weekly">Weekly</MenuItem>
            <MenuItem value="monthly">Monthly</MenuItem>
          </TextField>
          <TextField size="small" label="Days" select value={days} onChange={(e) => setDays(Number(e.target.value))} sx={{ width: 100 }}>
            <MenuItem value={7}>7</MenuItem>
            <MenuItem value={30}>30</MenuItem>
            <MenuItem value={60}>60</MenuItem>
            <MenuItem value={90}>90</MenuItem>
          </TextField>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard title="Total" value={stats?.total_complaints || 0} icon={<Assessment />} color={nairobiColors.green.main} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard title="Open" value={stats?.open_complaints || 0} icon={<PendingActions />} color={nairobiColors.gold.main} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard title="Resolved" value={stats?.resolved_complaints || 0} icon={<CheckCircle />} color="#4CAF50" />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard title="Closed" value={stats?.closed_complaints || 0} icon={<Speed />} color="#607D8B" />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard title="Rate" value={`${stats?.resolution_rate || 0}%`} icon={<TrendingUp />} color={nairobiColors.maroon.main} />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard title="Avg Resp." value={`${stats?.avg_response_time_hours || 0}h`} icon={<Timer />} color={nairobiColors.gold.dark} />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ color: nairobiColors.green.dark }}>Complaint Volume Trends</Typography>
            <Line
              data={{
                labels: trends.map(t => t.date),
                datasets: [{
                  label: 'Complaints', data: trends.map(t => t.count),
                  borderColor: nairobiColors.green.main,
                  backgroundColor: 'rgba(29,111,66,0.1)',
                  fill: true, tension: 0.3,
                }],
              }}
              options={{ responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { maxTicksLimit: 12 } } } }}
            />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ color: nairobiColors.green.dark }}>Status Distribution</Typography>
            <Doughnut
              data={{
                labels: statusData.map(s => s.status.replace('_', ' ')),
                datasets: [{
                  data: statusData.map(s => s.count),
                  backgroundColor: [nairobiColors.gold.main, '#2196F3', nairobiColors.green.main, '#4CAF50', '#607D8B'],
                }],
              }}
              options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }}
            />
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ color: nairobiColors.green.dark }}>Complaints by Category</Typography>
            <Bar
              data={{
                labels: catStats.map(c => c.category),
                datasets: [
                  { label: 'Total', data: catStats.map(c => c.count), backgroundColor: nairobiColors.green.main },
                  { label: 'Resolved', data: catStats.map(c => c.resolved), backgroundColor: nairobiColors.gold.main },
                ],
              }}
              options={{ responsive: true, plugins: { legend: { position: 'top' } } }}
            />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ color: nairobiColors.green.dark }}>Complaints by Ward</Typography>
            <Bar
              data={{
                labels: wardStats.slice(0, 10).map(w => w.ward || 'Unknown'),
                datasets: [{
                  label: 'Complaints', data: wardStats.slice(0, 10).map(w => w.count),
                  backgroundColor: CHART_COLORS,
                }],
              }}
              options={{ responsive: true, indexAxis: 'y' as const, plugins: { legend: { display: false } } }}
            />
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ color: nairobiColors.green.dark }}>Resolution Rate by Category</Typography>
            <Bar
              data={{
                labels: catStats.map(c => c.category),
                datasets: [{
                  label: 'Resolution Rate (%)', data: catStats.map(c => c.resolution_rate),
                  backgroundColor: nairobiColors.gold.main,
                }],
              }}
              options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { max: 100 } } }}
            />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ color: nairobiColors.green.dark }}>Service Performance</Typography>
            {servicePerf.length > 0 ? (
              <Box>
                {servicePerf.map((s, i) => (
                  <Box key={i} sx={{ py: 1, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">{s.category}</Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Typography variant="body2" color="text.secondary">Complaints: {s.count}</Typography>
                      <Typography variant="body2" sx={{ color: nairobiColors.green.main }}>Rate: {s.resolution_rate}%</Typography>
                      <Typography variant="body2" sx={{ color: nairobiColors.gold.dark }}>Rating: {s.avg_satisfaction || 'N/A'}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography color="text.secondary">No performance data available</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ color: nairobiColors.green.dark }}>Official &amp; Department Performance</Typography>
            {officialStats.length > 0 ? (
              <Box>
                <Box sx={{ display: 'flex', py: 1, borderBottom: `2px solid ${nairobiColors.green.main}`, fontWeight: 700 }}>
                  <Typography variant="caption" fontWeight={700} sx={{ flex: 2 }}>Official</Typography>
                  <Typography variant="caption" fontWeight={700} sx={{ flex: 2 }}>Department</Typography>
                  <Typography variant="caption" fontWeight={700} sx={{ flex: 1, textAlign: 'right' }}>Assigned</Typography>
                  <Typography variant="caption" fontWeight={700} sx={{ flex: 1, textAlign: 'right' }}>Resolved</Typography>
                  <Typography variant="caption" fontWeight={700} sx={{ flex: 1, textAlign: 'right' }}>Rate</Typography>
                  <Typography variant="caption" fontWeight={700} sx={{ flex: 1, textAlign: 'right' }}>Rating</Typography>
                </Box>
                {officialStats.map((o, i) => (
                  <Box key={i} sx={{ display: 'flex', py: 1, borderBottom: '1px solid #eee', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ flex: 2 }}>{o.official}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ flex: 2 }}>{o.department}</Typography>
                    <Typography variant="body2" sx={{ flex: 1, textAlign: 'right' }}>{o.total}</Typography>
                    <Typography variant="body2" sx={{ flex: 1, textAlign: 'right' }}>{o.resolved}</Typography>
                    <Typography variant="body2" sx={{ flex: 1, textAlign: 'right', color: nairobiColors.green.main }}>{o.resolution_rate}%</Typography>
                    <Typography variant="body2" sx={{ flex: 1, textAlign: 'right', color: nairobiColors.gold.dark }}>{o.avg_satisfaction || 'N/A'}</Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography color="text.secondary">No officials have been assigned complaints yet</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsPage;
