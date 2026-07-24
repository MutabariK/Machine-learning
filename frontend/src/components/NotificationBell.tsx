import React, { useEffect, useState, useCallback } from 'react';
import {
  IconButton, Badge, Menu, MenuItem, Typography, Box, Divider, Button, Tooltip, alpha,
} from '@mui/material';
import { Notifications as NotificationsIcon } from '@mui/icons-material';
import { notificationsAPI } from '../services/api';
import { Notification } from '../types';
import { nairobiColors } from '../theme/nairobiTheme';

const POLL_INTERVAL_MS = 60000;

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const NotificationBell: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = useCallback(async () => {
    try {
      const res = await notificationsAPI.unreadCount();
      setUnreadCount(res.data.unread_count);
    } catch {
      // ignore transient errors — bell just won't update this tick
    }
  }, []);

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadUnreadCount]);

  const handleOpen = async (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
    try {
      const res = await notificationsAPI.list();
      const results = res.data.results || res.data;
      setNotifications(results);
    } catch {
      setNotifications([]);
    }
  };

  const handleClose = () => setAnchorEl(null);

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // no-op
    }
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!n.is_read) {
      try {
        await notificationsAPI.markRead(n.id);
        setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // no-op
      }
    }
  };

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton color="inherit" onClick={handleOpen}>
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{ sx: { width: 360, maxHeight: 440, borderRadius: 2 } }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ color: nairobiColors.green.dark }}>
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={handleMarkAllRead}>Mark all read</Button>
          )}
        </Box>
        <Divider />
        {notifications.length === 0 ? (
          <MenuItem disabled sx={{ opacity: 1, justifyContent: 'center', py: 3 }}>
            <Typography variant="body2" color="text.secondary">No notifications yet.</Typography>
          </MenuItem>
        ) : (
          notifications.slice(0, 20).map((n) => (
            <MenuItem
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              sx={{
                whiteSpace: 'normal',
                alignItems: 'flex-start',
                py: 1.2,
                bgcolor: n.is_read ? 'transparent' : alpha(nairobiColors.green.main, 0.06),
              }}
            >
              <Box>
                <Typography variant="body2" fontWeight={n.is_read ? 400 : 600}>{n.message}</Typography>
                <Typography variant="caption" color="text.secondary">{timeAgo(n.created_at)}</Typography>
              </Box>
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
};

export default NotificationBell;
