import React, { Component, ErrorInfo, ReactNode } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box, Typography, Button } from '@mui/material';
import nairobiTheme from './theme/nairobiTheme';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/NotificationToast';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AIAssistant from './components/AIAssistant';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import SubmitComplaintPage from './pages/SubmitComplaintPage';
import ComplaintsPage from './pages/ComplaintsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import EvaluationPage from './pages/EvaluationPage';
import ProfilePage from './pages/ProfilePage';
import UserManagementPage from './pages/UserManagementPage';
import NotFoundPage from './pages/NotFoundPage';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError(_: Error) { return { hasError: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('ErrorBoundary:', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ textAlign: 'center', mt: 10, p: 4 }}>
          <Typography variant="h5" fontWeight={700} gutterBottom>Something went wrong</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>An unexpected error occurred. Please try again.</Typography>
          <Button variant="contained" onClick={() => { this.setState({ hasError: false }); window.location.href = '/dashboard'; }}>
            Go to Dashboard
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

const AuthenticatedAIAssistant: React.FC = () => {
  const publicPrefixes = ['/', '/login', '/register', '/forgot-password', '/reset-password'];
  const path = window.location.pathname;
  if (publicPrefixes.some((p) => (p === '/' ? path === '/' : path.startsWith(p)))) return null;
  return <AIAssistant />;
};

const App: React.FC = () => (
  <ThemeProvider theme={nairobiTheme}>
    <CssBaseline />
    <ToastProvider>
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password/:uid/:token" element={<ResetPasswordPage />} />
              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="submit-complaint" element={<ProtectedRoute roles={['citizen']}><SubmitComplaintPage /></ProtectedRoute>} />
                <Route path="my-complaints" element={<ProtectedRoute roles={['citizen']}><ComplaintsPage /></ProtectedRoute>} />
                <Route path="complaints" element={<ProtectedRoute roles={['official', 'admin']}><ComplaintsPage /></ProtectedRoute>} />
                <Route path="analytics" element={<ProtectedRoute roles={['official', 'admin']}><AnalyticsPage /></ProtectedRoute>} />
                <Route path="users" element={<ProtectedRoute roles={['admin']}><UserManagementPage /></ProtectedRoute>} />
                <Route path="evaluation" element={<ProtectedRoute roles={['citizen', 'official', 'admin']}><EvaluationPage /></ProtectedRoute>} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            <AuthenticatedAIAssistant />
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </ToastProvider>
  </ThemeProvider>
);

export default App;
