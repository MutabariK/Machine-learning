import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, Button, Stepper, Step, StepLabel, Radio, RadioGroup,
  FormControlLabel, FormControl, FormLabel, TextField, MenuItem, Checkbox,
  Alert, CircularProgress, Divider, Grid, Tabs, Tab, ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement,
  Title, Tooltip, Legend,
} from 'chart.js';
import { useAuth } from '../contexts/AuthContext';
import { evaluationAPI } from '../services/api';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import { ClipboardList, Star, TrendingUp, ThumbsUp, Users, Download, BarChart3 } from 'lucide-react';
import { nairobiColors } from '../theme/nairobiTheme';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const CITIZEN_TASKS = [
  { id: 1, text: 'Navigate to "Submit Complaint" from the side menu.' },
  { id: 2, text: 'Submit a complaint with Category "Waste Management", Title "Uncollected garbage near my residence", Description of your choice, and Location "Westlands, Nairobi".' },
  { id: 3, text: 'Navigate to "My Complaints" and verify your complaint appears in the list.' },
  { id: 4, text: 'Click the view icon (eye) on your complaint to see its full details.' },
  { id: 5, text: 'Submit a second complaint with Category "Road Maintenance" and a title and location of your choice.' },
];

const OFFICIAL_TASKS = [
  { id: 1, text: 'Navigate to "Complaints" from the side menu.' },
  { id: 2, text: 'Open a complaint within your department (or assigned to you) and review its full details and status history.' },
  { id: 3, text: 'Update the complaint\'s status (e.g. move it to "Under Review" or "In Progress") and record a resolution note.' },
  { id: 4, text: 'Navigate to "Analytics" and review the service-delivery indicators shown there.' },
  { id: 5, text: 'Return to this page to complete the evaluation.' },
];

const TAM_PU = [
  'Using this system helps me accomplish my tasks more quickly.',
  'Using this system makes it easier to track complaint resolution.',
  'Using this system enhances my engagement with county government.',
  'I find this system useful for monitoring public service delivery.',
  'Using this system increases my productivity in carrying out my tasks on the platform.',
  'Overall, I find this system useful.',
];

const TAM_PEOU = [
  'Learning to use this system was easy for me.',
  'I find it easy to get this system to do what I want.',
  'My interaction with this system is clear and understandable.',
  'I find this system to be flexible to interact with.',
  'It was easy for me to become skillful at using this system.',
  'Overall, I find this system easy to use.',
];

const TAM_BI = [
  'I intend to continue using this system for my role on the platform.',
  'I would recommend this system to others.',
  'I plan to use this system frequently in the future.',
];

const LIKERT_OPTIONS = [
  { value: 1, label: 'Strongly Disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'Agree' },
  { value: 5, label: 'Strongly Agree' },
];

const STEPS = ['Task Instructions', 'Demographics', 'Technology Acceptance (TAM)', 'Complete'];

interface LikertGroupProps {
  questions: string[];
  prefix: string;
  values: Record<string, number>;
  onChange: (key: string, val: number) => void;
}

const LikertGroup: React.FC<LikertGroupProps> = ({ questions, prefix, values, onChange }) => (
  <>
    {questions.map((q, i) => (
      <Box key={i} sx={{ mb: 3 }}>
        <FormControl component="fieldset" fullWidth>
          <FormLabel sx={{ fontWeight: 500, color: 'text.primary', mb: 1 }}>
            {i + 1}. {q}
          </FormLabel>
          <RadioGroup
            row
            value={values[`${prefix}_${i + 1}`] || ''}
            onChange={(e) => onChange(`${prefix}_${i + 1}`, Number(e.target.value))}
          >
            {LIKERT_OPTIONS.map((opt) => (
              <FormControlLabel key={opt.value} value={opt.value} control={<Radio size="small" color="primary" />} label={opt.label} />
            ))}
          </RadioGroup>
        </FormControl>
        {i < questions.length - 1 && <Divider sx={{ mt: 1 }} />}
      </Box>
    ))}
  </>
);

const formatAlpha = (alpha: number | null): string => (alpha === null ? 'N/A (insufficient data)' : alpha.toFixed(3));

const CHART_COLORS = [
  nairobiColors.green.main,
  nairobiColors.gold.main,
  nairobiColors.green.light,
  nairobiColors.gold.dark,
  nairobiColors.maroon.main,
];

const EvaluationPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [consented, setConsented] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [tasksChecked, setTasksChecked] = useState<Record<number, boolean>>({});
  const [demographics, setDemographics] = useState({
    age_range: '', gender: '', education: '',
    digital_service_frequency: '', reported_issue_before: '',
    county_of_residence: '',
  });
  const [likertValues, setLikertValues] = useState<Record<string, number>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [checking, setChecking] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0 = My Evaluation, 1 = Results Dashboard (officials/admins only)
  const [segment, setSegment] = useState<'overall' | 'citizen' | 'official_admin'>('overall');

  const isCitizen = user?.role === 'citizen';
  const TASKS = isCitizen ? CITIZEN_TASKS : OFFICIAL_TASKS;

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await evaluationAPI.exportExcel();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'evaluation_data.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    // Every role can now complete the evaluation, so every role needs its own
    // has-submitted check — officials/admins are no longer routed straight to
    // the read-only results dashboard.
    evaluationAPI.check()
      .then(res => { if (res.data.has_submitted) setSubmitted(true); })
      .catch(console.error)
      .finally(() => setChecking(false));

    if (!isCitizen) {
      // Officials/admins can still toggle to the aggregate results dashboard,
      // so preload it in the background rather than gating the whole page on it.
      setAnalyticsLoading(true);
      evaluationAPI.getAnalytics()
        .then(res => setAnalytics(res.data))
        .catch(console.error)
        .finally(() => setAnalyticsLoading(false));
    }
  }, [user, isCitizen]);

  const handleLikert = (key: string, val: number) => {
    setLikertValues({ ...likertValues, [key]: val });
  };

  const validateStep = (): boolean => {
    setError('');
    if (activeStep === 0) {
      if (Object.values(tasksChecked).filter(Boolean).length < TASKS.length) {
        setError('Please complete all tasks and check each box before proceeding.');
        return false;
      }
    }
    if (activeStep === 1) {
      const d = demographics;
      if (!d.age_range || !d.gender || !d.education || !d.digital_service_frequency || d.reported_issue_before === '' || !d.county_of_residence) {
        setError('Please answer all demographic questions.');
        return false;
      }
    }
    if (activeStep === 2) {
      for (let i = 1; i <= 6; i++) {
        if (!likertValues[`pu_${i}`]) { setError(`Please answer Perceived Usefulness question ${i}.`); return false; }
      }
      for (let i = 1; i <= 6; i++) {
        if (!likertValues[`peou_${i}`]) { setError(`Please answer Perceived Ease of Use question ${i}.`); return false; }
      }
      for (let i = 1; i <= 3; i++) {
        if (!likertValues[`bi_${i}`]) { setError(`Please answer Behavioral Intention question ${i}.`); return false; }
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (activeStep === 2) {
      handleSubmit();
    } else {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...demographics,
        reported_issue_before: demographics.reported_issue_before === 'yes',
        ...likertValues,
      };
      await evaluationAPI.submit(payload);
      setSubmitted(true);
      setActiveStep(3);
    } catch (err: any) {
      const data = err.response?.data;
      setError(data?.detail || 'Failed to submit evaluation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress color="primary" /></Box>;

  // --- Official/Admin: Results Dashboard tab content ---
  const renderDashboard = () => {
    if (analyticsLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress color="primary" /></Box>;
    if (!analytics) return null;

    const segmentData = analytics[segment];

    const segmentSwitcher = (
      <ToggleButtonGroup
        value={segment}
        exclusive
        size="small"
        onChange={(_, val) => val && setSegment(val)}
        sx={{
          mb: 3,
          '& .MuiToggleButton-root.Mui-selected': {
            bgcolor: nairobiColors.green.main,
            color: '#fff',
            '&:hover': { bgcolor: nairobiColors.green.dark },
          },
        }}
      >
        <ToggleButton value="overall">All ({analytics.overall.total_responses})</ToggleButton>
        <ToggleButton value="citizen">Citizens ({analytics.citizen.total_responses})</ToggleButton>
        <ToggleButton value="official_admin">Officials &amp; Admins ({analytics.official_admin.total_responses})</ToggleButton>
      </ToggleButtonGroup>
    );

    if (!segmentData || segmentData.total_responses === 0) {
      return (
        <Box>
          {segmentSwitcher}
          <Paper sx={{ p: 4 }}>
            <EmptyState
              icon={ClipboardList}
              title="No evaluation responses in this segment yet."
              description="Results will appear here once participants in this group complete the evaluation."
            />
          </Paper>
        </Box>
      );
    }

    const { tam, demographics: demo } = segmentData;

    return (
      <Box>
        {segmentSwitcher}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            TAM (Davis, 1989) — {segmentData.total_responses} responses
          </Typography>
          <Button
            variant="contained"
            startIcon={<Download size={18} strokeWidth={1.75} />}
            onClick={handleExport}
            disabled={exporting}
            sx={{ bgcolor: nairobiColors.green.main, '&:hover': { bgcolor: nairobiColors.green.dark } }}
          >
            {exporting ? 'Exporting...' : 'Export to Excel'}
          </Button>
        </Box>

        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={6} sm={3}>
            <StatCard title="Responses" value={segmentData.total_responses} icon={Users} color={nairobiColors.green.main} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard title="Usefulness" value={`${tam.perceived_usefulness.mean}/5`} icon={ThumbsUp} color="#2196F3" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard title="Ease of Use" value={`${tam.perceived_ease_of_use.mean}/5`} icon={TrendingUp} color={nairobiColors.maroon.main} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard title="Intention" value={`${tam.behavioral_intention.mean}/5`} icon={ClipboardList} color={nairobiColors.gold.dark} />
          </Grid>
        </Grid>

        {/* TAM Section */}
        <Typography variant="h6" fontWeight={700} sx={{ mt: 4, mb: 2, color: nairobiColors.green.dark }}>Technology Acceptance Model (TAM)</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>Perceived Usefulness</Typography>
              <Typography variant="h4" sx={{ color: nairobiColors.green.main }} fontWeight={700}>{tam.perceived_usefulness.mean}/5</Typography>
              <Typography variant="caption" color="text.secondary" display="block">SD: {tam.perceived_usefulness.std_dev}</Typography>
              <Typography variant="caption" color="text.secondary" display="block">Cronbach's α: {formatAlpha(tam.perceived_usefulness.cronbach_alpha)}</Typography>
              <Divider sx={{ my: 2 }} />
              {Object.entries(tam.perceived_usefulness.item_averages).map(([q, avg]: [string, any]) => (
                <Box key={q} sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" sx={{ maxWidth: '70%' }}>{q}</Typography>
                  <Typography variant="caption" fontWeight={600}>{avg}</Typography>
                </Box>
              ))}
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>Perceived Ease of Use</Typography>
              <Typography variant="h4" sx={{ color: '#4CAF50' }} fontWeight={700}>{tam.perceived_ease_of_use.mean}/5</Typography>
              <Typography variant="caption" color="text.secondary" display="block">SD: {tam.perceived_ease_of_use.std_dev}</Typography>
              <Typography variant="caption" color="text.secondary" display="block">Cronbach's α: {formatAlpha(tam.perceived_ease_of_use.cronbach_alpha)}</Typography>
              <Divider sx={{ my: 2 }} />
              {Object.entries(tam.perceived_ease_of_use.item_averages).map(([q, avg]: [string, any]) => (
                <Box key={q} sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" sx={{ maxWidth: '70%' }}>{q}</Typography>
                  <Typography variant="caption" fontWeight={600}>{avg}</Typography>
                </Box>
              ))}
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>Behavioral Intention</Typography>
              <Typography variant="h4" sx={{ color: nairobiColors.maroon.main }} fontWeight={700}>{tam.behavioral_intention.mean}/5</Typography>
              <Typography variant="caption" color="text.secondary" display="block">SD: {tam.behavioral_intention.std_dev}</Typography>
              <Typography variant="caption" color="text.secondary" display="block">Cronbach's α: {formatAlpha(tam.behavioral_intention.cronbach_alpha)}</Typography>
              <Divider sx={{ my: 2 }} />
              {Object.entries(tam.behavioral_intention.item_averages).map(([q, avg]: [string, any]) => (
                <Box key={q} sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" sx={{ maxWidth: '70%' }}>{q}</Typography>
                  <Typography variant="caption" fontWeight={600}>{avg}</Typography>
                </Box>
              ))}
            </Paper>
          </Grid>
        </Grid>

        {/* Demographics */}
        <Typography variant="h6" fontWeight={700} sx={{ mt: 4, mb: 2, color: nairobiColors.green.dark }}>Respondent Demographics</Typography>
        <Grid container spacing={3}>
          {Object.entries(demo).map(([field, counts]: [string, any]) => (
            <Grid item xs={12} sm={6} md={4} key={field}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Typography>
                <Box sx={{ position: 'relative', height: 220 }}>
                  <Doughnut data={{
                    labels: Object.keys(counts),
                    datasets: [{ data: Object.values(counts) as number[], backgroundColor: CHART_COLORS }],
                  }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 10 } } } } }} />
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  // --- "My Evaluation" tab content (all roles) ---
  const renderMyEvaluation = () => {
    if (submitted) {
      return (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Star size={80} color={nairobiColors.gold.main} strokeWidth={1.5} />
          <Typography variant="h4" fontWeight={700} sx={{ mt: 2, color: nairobiColors.green.dark }}>Thank You!</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Your evaluation has been recorded successfully. Your feedback is valuable in improving public service delivery in Nairobi County.
          </Typography>
        </Box>
      );
    }

    if (!consented) {
      return (
      <Box>
        <Typography variant="h5" fontWeight={700} gutterBottom sx={{ color: nairobiColors.green.dark }}>
          Informed Consent
        </Typography>
        <Paper sx={{ p: 4, maxWidth: 720 }}>
          <Typography variant="body2" color="text.secondary" paragraph>
            You are being invited to take part in a research evaluation of the Nairobi County
            Citizen Engagement Platform, conducted as part of an academic thesis studying user
            acceptance of the system.
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            If you agree, you will be asked to complete a short set of guided tasks on the
            platform, followed by a questionnaire (roughly 5–10 minutes) about your experience.
            Your participation is entirely voluntary: you may decline or stop at any point without
            any effect on your use of the platform or your complaints.
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Your responses are used only for this research and are reported anonymously; no
            individual answer will be linked to you by name in any published results.
          </Typography>
          <FormControlLabel
            sx={{ mt: 1 }}
            control={
              <Checkbox
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                color="primary"
              />
            }
            label="I have read the above and voluntarily agree to participate."
          />
          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Button variant="outlined" onClick={() => navigate('/dashboard')}>
              Decline
            </Button>
            <Button
              variant="contained"
              disabled={!consentChecked}
              onClick={() => setConsented(true)}
            >
              I Agree — Begin Evaluation
            </Button>
          </Box>
        </Paper>
      </Box>
      );
    }

    // --- Evaluation stepper flow (all roles) ---
    return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom sx={{ color: nairobiColors.green.dark }}>System Evaluation</Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Nairobi County Citizen Engagement Platform — Research Evaluation
      </Typography>

      <Stepper activeStep={activeStep} sx={{
        mt: 3, mb: 4,
        '& .MuiStepIcon-root.Mui-active': { color: nairobiColors.green.main },
        '& .MuiStepIcon-root.Mui-completed': { color: nairobiColors.gold.main },
      }}>
        {STEPS.map((label) => (
          <Step key={label}><StepLabel>{label}</StepLabel></Step>
        ))}
      </Stepper>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Step 0: Task Instructions */}
      {activeStep === 0 && (
        <Paper sx={{ p: 4 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>Guided Task Instructions</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Before completing the evaluation questionnaire, please perform the following tasks using the platform.
            These tasks will help you experience the system's key features. Check each box after completing the task.
          </Typography>
          <Alert severity="info" sx={{ mb: 3 }}>
            This is an example. Use the side navigation menu to access "Submit Complaint" and "My Complaints" pages. Return to this page after completing all tasks.
          </Alert>
          {TASKS.map((task) => (
            <Box key={task.id} sx={{ py: 1.5, borderBottom: '1px solid #eee', display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <Checkbox
                checked={tasksChecked[task.id] || false}
                onChange={(e) => setTasksChecked({ ...tasksChecked, [task.id]: e.target.checked })}
                color="primary"
              />
              <Box sx={{ pt: 1 }}>
                <Typography variant="body1" fontWeight={500}>Task {task.id}</Typography>
                <Typography variant="body2" color="text.secondary">{task.text}</Typography>
              </Box>
            </Box>
          ))}
        </Paper>
      )}

      {/* Step 1: Demographics */}
      {activeStep === 1 && (
        <Paper sx={{ p: 4 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>Section A: Demographic Information</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Please provide the following information. All responses are anonymous and used for research purposes only.
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Age Range" select value={demographics.age_range}
                onChange={(e) => setDemographics({ ...demographics, age_range: e.target.value })} required>
                <MenuItem value="18-25">18 – 25</MenuItem>
                <MenuItem value="26-35">26 – 35</MenuItem>
                <MenuItem value="36-45">36 – 45</MenuItem>
                <MenuItem value="46-55">46 – 55</MenuItem>
                <MenuItem value="56+">56 and above</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Gender" select value={demographics.gender}
                onChange={(e) => setDemographics({ ...demographics, gender: e.target.value })} required>
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
                <MenuItem value="other">Prefer not to say</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Highest Education Level" select value={demographics.education}
                onChange={(e) => setDemographics({ ...demographics, education: e.target.value })} required>
                <MenuItem value="secondary">Secondary / High School</MenuItem>
                <MenuItem value="diploma">Diploma / Certificate</MenuItem>
                <MenuItem value="bachelors">Bachelor's Degree</MenuItem>
                <MenuItem value="masters">Master's Degree</MenuItem>
                <MenuItem value="doctorate">Doctorate</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="How often do you use government digital services?" select value={demographics.digital_service_frequency}
                onChange={(e) => setDemographics({ ...demographics, digital_service_frequency: e.target.value })} required>
                <MenuItem value="never">Never</MenuItem>
                <MenuItem value="rarely">Rarely (a few times a year)</MenuItem>
                <MenuItem value="sometimes">Sometimes (monthly)</MenuItem>
                <MenuItem value="often">Often (weekly)</MenuItem>
                <MenuItem value="always">Always (daily)</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Have you ever reported a public service issue before?" select value={demographics.reported_issue_before}
                onChange={(e) => setDemographics({ ...demographics, reported_issue_before: e.target.value })} required>
                <MenuItem value="yes">Yes</MenuItem>
                <MenuItem value="no">No</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="County of Residence" value={demographics.county_of_residence}
                onChange={(e) => setDemographics({ ...demographics, county_of_residence: e.target.value })}
                required placeholder="e.g., Nairobi" />
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Step 2: TAM */}
      {activeStep === 2 && (
        <Paper sx={{ p: 4 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>Section B: Technology Acceptance Model (TAM)</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Reference: Davis, F.D. (1989). "Perceived Usefulness, Perceived Ease of Use, and User Acceptance of Information Technology."
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Please rate each statement from 1 (Strongly Disagree) to 5 (Strongly Agree).
          </Typography>

          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: nairobiColors.green.main }}>
            Part 1: Perceived Usefulness
          </Typography>
          <LikertGroup questions={TAM_PU} prefix="pu" values={likertValues} onChange={handleLikert} />

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: '#4CAF50' }}>
            Part 2: Perceived Ease of Use
          </Typography>
          <LikertGroup questions={TAM_PEOU} prefix="peou" values={likertValues} onChange={handleLikert} />

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: nairobiColors.maroon.main }}>
            Part 3: Behavioral Intention to Use
          </Typography>
          <LikertGroup questions={TAM_BI} prefix="bi" values={likertValues} onChange={handleLikert} />
        </Paper>
      )}

      {/* Navigation Buttons */}
      {activeStep < 3 && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            variant="outlined" disabled={activeStep === 0}
            onClick={() => { setError(''); setActiveStep(prev => prev - 1); }}
          >
            Back
          </Button>
          <Button
            variant="contained" onClick={handleNext} disabled={loading}
            sx={{ px: 4 }}
          >
            {loading ? 'Submitting...' : activeStep === 2 ? 'Submit Evaluation' : 'Next'}
          </Button>
        </Box>
      )}
    </Box>
    );
  };

  return (
    <Box>
      {!isCitizen && (
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{
            mb: 3,
            borderBottom: 1,
            borderColor: 'divider',
            '& .Mui-selected': { color: `${nairobiColors.green.main} !important` },
            '& .MuiTabs-indicator': { backgroundColor: nairobiColors.green.main },
          }}
        >
          <Tab label="My Evaluation" />
          <Tab
            label="Results Dashboard"
            icon={<BarChart3 size={16} strokeWidth={1.75} />}
            iconPosition="start"
          />
        </Tabs>
      )}

      {!isCitizen && activeTab === 1 ? (
        <>
          <Typography variant="h5" fontWeight={700} gutterBottom sx={{ color: nairobiColors.green.dark }}>Evaluation Results</Typography>
          {renderDashboard()}
        </>
      ) : (
        renderMyEvaluation()
      )}
    </Box>
  );
};

export default EvaluationPage;
