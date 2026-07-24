import { createTheme, alpha } from '@mui/material/styles';

export const nairobiColors = {
  green: {
    main: '#1D6F42',
    light: '#2E8B57',
    dark: '#145A34',
    pale: '#E8F5EE',
  },
  gold: {
    main: '#C8A951',
    light: '#D4BB6E',
    dark: '#A68B3C',
    pale: '#FFF8E7',
  },
  maroon: {
    main: '#8B1A1A',
    light: '#A52A2A',
    dark: '#6B1010',
  },
  kenyanBlack: '#1B1B1B',
  kenyanRed: '#BB1600',
  kenyanWhite: '#FAFAF8',
  sidebar: '#0F3D22',
  sidebarHover: '#174D2E',
  sidebarActive: '#1D6F42',
};

const nairobiTheme = createTheme({
  palette: {
    primary: {
      main: nairobiColors.green.main,
      light: nairobiColors.green.light,
      dark: nairobiColors.green.dark,
    },
    secondary: {
      main: nairobiColors.gold.main,
      light: nairobiColors.gold.light,
      dark: nairobiColors.gold.dark,
    },
    error: {
      main: nairobiColors.maroon.main,
    },
    background: {
      default: '#F5F7F4',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1B2B1F',
      secondary: '#4A5D4F',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 800, letterSpacing: '-0.02em' },
    h5: { fontWeight: 800, letterSpacing: '-0.01em' },
    h6: { fontWeight: 700 },
    body2: { lineHeight: 1.6 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 10,
          fontWeight: 600,
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${nairobiColors.green.main} 0%, ${nairobiColors.green.dark} 100%)`,
          boxShadow: `0 2px 8px ${alpha(nairobiColors.green.main, 0.25)}`,
          '&:hover': {
            background: `linear-gradient(135deg, ${nairobiColors.green.dark} 0%, ${nairobiColors.green.main} 100%)`,
            boxShadow: `0 4px 16px ${alpha(nairobiColors.green.main, 0.35)}`,
            transform: 'translateY(-1px)',
          },
        },
        outlined: {
          borderWidth: 1.5,
          '&:hover': {
            borderWidth: 1.5,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          transition: 'box-shadow 0.25s ease, transform 0.25s ease',
        },
        elevation0: {
          boxShadow: 'none',
        },
        elevation1: {
          boxShadow: `0 1px 3px ${alpha('#000', 0.05)}, 0 1px 2px ${alpha('#000', 0.04)}`,
        },
        elevation2: {
          boxShadow: `0 2px 8px ${alpha('#000', 0.06)}, 0 1px 3px ${alpha('#000', 0.04)}`,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 8,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: nairobiColors.green.main,
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.82rem',
            letterSpacing: '0.3px',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.15s ease',
          '&:hover': {
            backgroundColor: alpha(nairobiColors.green.main, 0.03),
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          height: 8,
          backgroundColor: alpha(nairobiColors.green.main, 0.08),
        },
        bar: {
          borderRadius: 6,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            transition: 'box-shadow 0.2s ease',
            '&:hover': {
              boxShadow: `0 2px 6px ${alpha(nairobiColors.green.main, 0.06)}`,
            },
            '&.Mui-focused': {
              boxShadow: `0 2px 10px ${alpha(nairobiColors.green.main, 0.1)}`,
            },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: `0 16px 48px ${alpha('#000', 0.12)}`,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          fontSize: '0.75rem',
          fontWeight: 500,
          backdropFilter: 'blur(10px)',
        },
      },
    },
  },
});

export default nairobiTheme;
