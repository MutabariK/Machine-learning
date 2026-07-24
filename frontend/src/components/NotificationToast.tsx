import React, { useState, useCallback, createContext, useContext } from 'react';
import { Snackbar, Alert, AlertColor, Slide, alpha } from '@mui/material';
import { nairobiColors } from '../theme/nairobiTheme';

interface ToastMessage {
  id: number;
  message: string;
  severity: AlertColor;
}

interface ToastContextType {
  showToast: (message: string, severity?: AlertColor) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export const useToast = () => useContext(ToastContext);

let toastId = 0;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, severity: AlertColor = 'info') => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, severity }]);
  }, []);

  const handleClose = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const severityColors: Record<string, string> = {
    success: nairobiColors.green.main,
    error: nairobiColors.maroon.main,
    warning: nairobiColors.gold.main,
    info: nairobiColors.green.light,
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.map((toast, index) => (
        <Snackbar
          key={toast.id}
          open
          autoHideDuration={4500}
          onClose={() => handleClose(toast.id)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          TransitionComponent={Slide}
          sx={{ mt: index * 7 }}
        >
          <Alert
            onClose={() => handleClose(toast.id)}
            severity={toast.severity}
            variant="filled"
            sx={{
              borderRadius: 2,
              fontWeight: 500,
              backdropFilter: 'blur(10px)',
              boxShadow: `0 4px 20px ${alpha(severityColors[toast.severity] || '#000', 0.3)}`,
              border: `1px solid ${alpha('#fff', 0.15)}`,
              '& .MuiAlert-icon': { fontSize: 22 },
            }}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      ))}
    </ToastContext.Provider>
  );
};
