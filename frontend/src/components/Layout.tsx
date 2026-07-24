import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar, Box, CssBaseline, Divider, Drawer, IconButton, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography,
  Avatar, Menu, MenuItem, Chip, alpha, Tooltip, Fade,
} from '@mui/material';
import {
  Menu as MenuIcon, Dashboard, ReportProblem, Assessment,
  Description, Star, Logout, Person, People, AutoAwesome,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import NairobiCoatOfArms from './NairobiCoatOfArms';
import { WildlifeBanner } from './WildlifeIllustrations';
import NotificationBell from './NotificationBell';
import { nairobiColors } from '../theme/nairobiTheme';

const DRAWER_WIDTH = 270;

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const citizenMenu = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Submit Complaint', icon: <ReportProblem />, path: '/submit-complaint' },
    { text: 'My Complaints', icon: <Description />, path: '/my-complaints' },
    { text: 'Evaluation', icon: <Star />, path: '/evaluation' },
  ];

  const officialMenu = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Complaints', icon: <ReportProblem />, path: '/complaints' },
    { text: 'Analytics', icon: <Assessment />, path: '/analytics' },
    { text: 'Evaluation', icon: <Star />, path: '/evaluation' },
  ];

  const adminMenu = [
    ...officialMenu,
    { text: 'User Management', icon: <People />, path: '/users' },
  ];

  const menuItems = user?.role === 'citizen' ? citizenMenu : user?.role === 'admin' ? adminMenu : officialMenu;

  const roleColors: Record<string, string> = {
    citizen: nairobiColors.green.main,
    official: nairobiColors.gold.main,
    admin: nairobiColors.maroon.main,
  };

  const roleLabels: Record<string, string> = {
    citizen: 'Citizen',
    official: 'Official',
    admin: 'Admin',
  };

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Sidebar Header */}
      <Box sx={{
        p: 2.5,
        textAlign: 'center',
        background: `linear-gradient(180deg, ${nairobiColors.sidebar} 0%, ${nairobiColors.green.dark} 100%)`,
        borderBottom: `2px solid ${nairobiColors.gold.main}`,
        position: 'relative',
        overflow: 'hidden',
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: '-50%',
          width: '200%',
          height: '100%',
          background: `linear-gradient(90deg, transparent, ${alpha(nairobiColors.gold.main, 0.05)}, transparent)`,
          animation: 'shimmer 8s ease-in-out infinite',
        },
        '@keyframes shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      }}>
        <Box sx={{
          display: 'inline-flex',
          px: 1.5,
          py: 1,
          borderRadius: 3,
          bgcolor: '#fff',
          alignItems: 'center',
          justifyContent: 'center',
          border: `2px solid ${nairobiColors.gold.main}`,
          boxShadow: `0 2px 8px ${alpha('#000', 0.2)}`,
        }}>
          <NairobiCoatOfArms size={28} />
        </Box>
        <Typography variant="subtitle1" sx={{
          color: nairobiColors.gold.main,
          fontWeight: 800,
          mt: 1,
          letterSpacing: 1.5,
          fontSize: '0.85rem',
        }}>
          NAIROBI COUNTY
        </Typography>
        <Typography variant="caption" sx={{
          color: alpha('#fff', 0.6),
          display: 'block',
          fontSize: '0.65rem',
          letterSpacing: 0.5,
        }}>
          Citizen Engagement Platform
        </Typography>
      </Box>

      {/* Navigation */}
      <List sx={{ flexGrow: 1, py: 1.5, px: 1 }}>
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <Fade in timeout={200 + index * 80} key={item.text}>
              <ListItem disablePadding sx={{ py: 0.3 }}>
                <ListItemButton
                  selected={isActive}
                  onClick={() => { navigate(item.path); setMobileOpen(false); }}
                  sx={{
                    borderRadius: 2.5,
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&.Mui-selected': {
                      bgcolor: alpha(nairobiColors.green.main, 0.1),
                      borderLeft: `3px solid ${nairobiColors.gold.main}`,
                      '&:hover': { bgcolor: alpha(nairobiColors.green.main, 0.15) },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        inset: 0,
                        background: `linear-gradient(90deg, ${alpha(nairobiColors.gold.main, 0.05)}, transparent)`,
                      },
                    },
                    '&:hover': {
                      bgcolor: alpha(nairobiColors.green.main, 0.05),
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  <ListItemIcon sx={{
                    color: isActive ? nairobiColors.green.main : 'text.secondary',
                    minWidth: 40,
                    transition: 'color 0.2s',
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: isActive ? 700 : 400,
                      color: isActive ? nairobiColors.green.dark : 'text.primary',
                      fontSize: '0.88rem',
                    }}
                  />
                  {isActive && (
                    <Box sx={{
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      bgcolor: nairobiColors.gold.main,
                      flexShrink: 0,
                    }} />
                  )}
                </ListItemButton>
              </ListItem>
            </Fade>
          );
        })}
      </List>

      {/* AI badge */}
      <Box sx={{ px: 2, pb: 1 }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 1.5,
          borderRadius: 2,
          bgcolor: alpha(nairobiColors.green.main, 0.04),
          border: `1px solid ${alpha(nairobiColors.green.main, 0.08)}`,
        }}>
          <AutoAwesome sx={{ fontSize: 16, color: nairobiColors.gold.main }} />
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.68rem', color: 'text.primary', display: 'block' }}>
              AI-Powered
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.58rem', color: 'text.disabled' }}>
              MCP + 21st.dev Enhanced
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Wildlife decoration */}
      <Box sx={{ borderTop: `1px solid ${alpha(nairobiColors.gold.main, 0.15)}`, mt: 'auto' }}>
        <WildlifeBanner variant="sidebar" />
        <Typography variant="caption" sx={{
          display: 'block', textAlign: 'center', pb: 1.5,
          color: 'text.disabled', fontSize: '0.6rem',
        }}>
          Serving Nairobi Citizens
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      {/* AppBar */}
      <AppBar position="fixed" sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        background: `linear-gradient(135deg, ${nairobiColors.green.dark} 0%, ${nairobiColors.green.main} 50%, ${nairobiColors.green.dark} 100%)`,
        borderBottom: `2px solid ${nairobiColors.gold.main}`,
        boxShadow: `0 2px 12px ${alpha('#000', 0.12)}`,
        backdropFilter: 'blur(10px)',
      }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 2, display: { md: 'none' } }}>
            <MenuIcon />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
            <Box sx={{
              display: { xs: 'none', sm: 'inline-flex' },
              px: 1.2,
              py: 0.6,
              borderRadius: 2,
              bgcolor: '#fff',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              border: `1.5px solid ${alpha(nairobiColors.gold.main, 0.6)}`,
            }}>
              <NairobiCoatOfArms size={20} />
            </Box>
            <Box>
              <Typography variant="h6" noWrap sx={{ fontWeight: 800, lineHeight: 1.2, letterSpacing: 0.5 }}>
                Nairobi County Services
              </Typography>
              <Typography variant="caption" noWrap sx={{
                color: nairobiColors.gold.light,
                display: { xs: 'none', sm: 'block' },
                fontSize: '0.63rem',
                letterSpacing: 0.3,
              }}>
                Real-Time Public Service Monitoring
              </Typography>
            </Box>
          </Box>

          <Chip
            label={roleLabels[user?.role || 'citizen']}
            size="small"
            sx={{
              mr: 2,
              color: '#fff',
              bgcolor: alpha(roleColors[user?.role || 'citizen'], 0.75),
              border: `1px solid ${alpha('#fff', 0.25)}`,
              fontWeight: 700,
              fontSize: '0.68rem',
              backdropFilter: 'blur(10px)',
            }}
          />

          <NotificationBell />

          <Tooltip title="Account">
            <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ ml: 0.5 }}>
              <Avatar
                src={user?.avatar || undefined}
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: nairobiColors.gold.main,
                  color: nairobiColors.green.dark,
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  border: `2px solid ${alpha('#fff', 0.2)}`,
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: `0 0 0 3px ${alpha(nairobiColors.gold.main, 0.3)}`,
                  },
                }}>
                {user?.full_name?.charAt(0)}
              </Avatar>
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            PaperProps={{
              sx: {
                borderRadius: 2,
                minWidth: 200,
                boxShadow: `0 4px 20px ${alpha('#000', 0.12)}`,
                border: `1px solid ${alpha(nairobiColors.green.main, 0.08)}`,
              },
            }}
          >
            <MenuItem disabled sx={{ opacity: 1 }}>
              <Box>
                <Typography variant="body2" fontWeight={600}>{user?.full_name}</Typography>
                <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
              </Box>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => { setAnchorEl(null); navigate('/profile'); }}>
              <Person sx={{ mr: 1.5, fontSize: 20 }} /> Profile
            </MenuItem>
            <MenuItem
              onClick={() => { setAnchorEl(null); logout(); navigate('/login'); }}
              sx={{ color: nairobiColors.maroon.main }}
            >
              <Logout sx={{ mr: 1.5, fontSize: 20 }} /> Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              borderRight: `1px solid ${alpha(nairobiColors.green.main, 0.08)}`,
              background: alpha('#fff', 0.98),
              backdropFilter: 'blur(10px)',
            },
          }}
          open
        >
          <Toolbar />
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box component="main" sx={{
        flexGrow: 1,
        p: { xs: 2, sm: 3 },
        pb: { xs: 12, sm: 12 },
        width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
        bgcolor: '#F5F7F4',
        minHeight: '100vh',
      }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
