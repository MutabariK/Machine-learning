import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box, Fab, Dialog, DialogTitle, DialogContent, IconButton,
  TextField, Typography, Avatar, Slide, alpha, Chip, Tooltip,
  InputAdornment, CircularProgress, Fade,
} from '@mui/material';
import {
  SmartToy, Close, Send, AutoAwesome, NavigateNext,
  Psychology, Lightbulb,
} from '@mui/icons-material';
import { aiAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { nairobiColors } from '../theme/nairobiTheme';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: { type: string; path: string; label: string }[];
}

const QUICK_PROMPTS: Record<string, { label: string; message: string }[]> = {
  citizen: [
    { label: 'How to submit', message: 'How do I submit a complaint?' },
    { label: 'Track status', message: 'How do I track my complaint status?' },
    { label: 'Categories', message: 'What categories of complaints can I report?' },
  ],
  official: [
    { label: 'Analytics', message: 'Show me an overview of current analytics' },
    { label: 'Pending queue', message: 'How do I manage pending complaints?' },
    { label: 'Draft response', message: 'Help me draft a response to a complaint' },
  ],
  admin: [
    { label: 'Analytics', message: 'Show me platform analytics summary' },
    { label: 'Pending queue', message: 'What complaints need attention?' },
    { label: 'User management', message: 'How do I manage user roles?' },
  ],
};

const AIAssistant: React.FC = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pulseAnim, setPulseAnim] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const timer = setTimeout(() => setPulseAnim(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  const handleSend = async (messageText?: string) => {
    const text = (messageText || input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await aiAPI.chat(text);
      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: res.data.response,
        timestamp: new Date(),
        actions: res.data.actions,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickPrompts = QUICK_PROMPTS[user?.role || 'citizen'] || QUICK_PROMPTS.citizen;

  return (
    <>
      {/* Floating Action Button */}
      <Tooltip title="AI Assistant" placement="left">
        <Fab
          onClick={() => { setOpen(true); setPulseAnim(false); }}
          aria-label="Open AI Assistant"
          sx={{
            position: 'fixed',
            bottom: 28,
            right: 28,
            zIndex: 1300,
            width: 60,
            height: 60,
            background: `linear-gradient(135deg, ${nairobiColors.green.main} 0%, ${nairobiColors.green.dark} 100%)`,
            boxShadow: `0 4px 20px ${alpha(nairobiColors.green.main, 0.4)}`,
            border: `2px solid ${alpha(nairobiColors.gold.main, 0.5)}`,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            animation: pulseAnim ? 'pulse-glow 2s ease-in-out infinite' : 'none',
            '&:hover': {
              transform: 'scale(1.08)',
              boxShadow: `0 6px 28px ${alpha(nairobiColors.green.main, 0.55)}`,
              background: `linear-gradient(135deg, ${nairobiColors.green.dark} 0%, ${nairobiColors.green.main} 100%)`,
            },
            '@keyframes pulse-glow': {
              '0%, 100%': { boxShadow: `0 4px 20px ${alpha(nairobiColors.green.main, 0.4)}` },
              '50%': { boxShadow: `0 4px 30px ${alpha(nairobiColors.gold.main, 0.6)}` },
            },
          }}
        >
          <AutoAwesome sx={{ fontSize: 28, color: nairobiColors.gold.light }} />
        </Fab>
      </Tooltip>

      {/* Chat Dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        TransitionComponent={Slide}
        TransitionProps={{ direction: 'up' } as any}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            position: 'fixed',
            bottom: 16,
            right: 16,
            m: 0,
            maxWidth: 420,
            width: 'calc(100% - 32px)',
            maxHeight: '70vh',
            borderRadius: 3,
            overflow: 'hidden',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(nairobiColors.green.main, 0.15)}`,
            boxShadow: `0 8px 40px ${alpha('#000', 0.12)}, 0 0 0 1px ${alpha(nairobiColors.gold.main, 0.1)}`,
          },
        }}
      >
        {/* Header */}
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            py: 1.5,
            px: 2.5,
            background: `linear-gradient(135deg, ${nairobiColors.green.dark} 0%, ${nairobiColors.green.main} 100%)`,
            borderBottom: `2px solid ${nairobiColors.gold.main}`,
          }}
        >
          <Avatar
            sx={{
              width: 36,
              height: 36,
              bgcolor: alpha(nairobiColors.gold.main, 0.2),
              border: `1.5px solid ${alpha(nairobiColors.gold.main, 0.5)}`,
            }}
          >
            <Psychology sx={{ fontSize: 20, color: nairobiColors.gold.light }} />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 700, lineHeight: 1.2 }}>
              Nairobi AI Assistant
            </Typography>
            <Typography variant="caption" sx={{ color: alpha('#fff', 0.7), fontSize: '0.65rem' }}>
              Powered by MCP + Claude
            </Typography>
          </Box>
          <IconButton onClick={() => setOpen(false)} size="small" sx={{ color: alpha('#fff', 0.8) }}>
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>

        {/* Messages */}
        <DialogContent
          sx={{
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            minHeight: 300,
            maxHeight: 400,
            overflowY: 'auto',
            '&::-webkit-scrollbar': { width: 4 },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: alpha(nairobiColors.green.main, 0.2),
              borderRadius: 2,
            },
          }}
        >
          {/* Welcome message */}
          {messages.length === 0 && (
            <Fade in timeout={500}>
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <SmartToy sx={{ fontSize: 48, color: alpha(nairobiColors.green.main, 0.3), mb: 1 }} />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Hello{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}! I'm your AI assistant
                  for Nairobi County services. How can I help?
                </Typography>

                {/* Quick prompts */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                  {quickPrompts.map((prompt) => (
                    <Chip
                      key={prompt.label}
                      icon={<Lightbulb sx={{ fontSize: 14 }} />}
                      label={prompt.label}
                      size="small"
                      onClick={() => handleSend(prompt.message)}
                      sx={{
                        cursor: 'pointer',
                        bgcolor: alpha(nairobiColors.green.main, 0.08),
                        border: `1px solid ${alpha(nairobiColors.green.main, 0.15)}`,
                        color: nairobiColors.green.dark,
                        fontWeight: 500,
                        fontSize: '0.75rem',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: alpha(nairobiColors.green.main, 0.15),
                          transform: 'translateY(-1px)',
                          boxShadow: `0 2px 8px ${alpha(nairobiColors.green.main, 0.15)}`,
                        },
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Fade>
          )}

          {/* Message list */}
          {messages.map((msg) => (
            <Fade in key={msg.id} timeout={300}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  gap: 1,
                }}
              >
                {msg.role === 'assistant' && (
                  <Avatar
                    sx={{
                      width: 28,
                      height: 28,
                      bgcolor: alpha(nairobiColors.green.main, 0.1),
                      flexShrink: 0,
                      mt: 0.5,
                    }}
                  >
                    <SmartToy sx={{ fontSize: 16, color: nairobiColors.green.main }} />
                  </Avatar>
                )}
                <Box
                  sx={{
                    maxWidth: '80%',
                    px: 2,
                    py: 1.5,
                    borderRadius: msg.role === 'user'
                      ? '16px 16px 4px 16px'
                      : '16px 16px 16px 4px',
                    bgcolor: msg.role === 'user'
                      ? nairobiColors.green.main
                      : alpha(nairobiColors.green.main, 0.06),
                    color: msg.role === 'user' ? '#fff' : 'text.primary',
                    boxShadow: msg.role === 'user'
                      ? `0 2px 8px ${alpha(nairobiColors.green.main, 0.3)}`
                      : 'none',
                    border: msg.role === 'assistant'
                      ? `1px solid ${alpha(nairobiColors.green.main, 0.1)}`
                      : 'none',
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.6,
                      fontSize: '0.82rem',
                      '& strong': { fontWeight: 600 },
                    }}
                    dangerouslySetInnerHTML={{
                      __html: msg.content
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\n/g, '<br/>'),
                    }}
                  />

                  {/* Action buttons */}
                  {msg.actions && msg.actions.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                      {msg.actions.map((action, i) => (
                        <Chip
                          key={i}
                          label={action.label}
                          size="small"
                          icon={<NavigateNext sx={{ fontSize: 14 }} />}
                          onClick={() => { window.location.href = action.path; }}
                          sx={{
                            cursor: 'pointer',
                            bgcolor: alpha(nairobiColors.gold.main, 0.15),
                            color: nairobiColors.green.dark,
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            '&:hover': { bgcolor: alpha(nairobiColors.gold.main, 0.25) },
                          }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              </Box>
            </Fade>
          ))}

          {/* Loading indicator */}
          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 1 }}>
              <Avatar
                sx={{
                  width: 28,
                  height: 28,
                  bgcolor: alpha(nairobiColors.green.main, 0.1),
                }}
              >
                <SmartToy sx={{ fontSize: 16, color: nairobiColors.green.main }} />
              </Avatar>
              <Box
                sx={{
                  display: 'flex',
                  gap: 0.5,
                  px: 2,
                  py: 1.5,
                  borderRadius: '16px 16px 16px 4px',
                  bgcolor: alpha(nairobiColors.green.main, 0.06),
                  border: `1px solid ${alpha(nairobiColors.green.main, 0.1)}`,
                }}
              >
                {[0, 1, 2].map((i) => (
                  <Box
                    key={i}
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: alpha(nairobiColors.green.main, 0.4),
                      animation: 'bounce 1.4s ease-in-out infinite',
                      animationDelay: `${i * 0.16}s`,
                      '@keyframes bounce': {
                        '0%, 80%, 100%': { transform: 'scale(0.6)' },
                        '40%': { transform: 'scale(1)' },
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          <div ref={messagesEndRef} />
        </DialogContent>

        {/* Input area */}
        <Box
          sx={{
            p: 2,
            pt: 1,
            borderTop: `1px solid ${alpha(nairobiColors.green.main, 0.08)}`,
            background: alpha('#fff', 0.8),
          }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder="Ask me anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            autoComplete="off"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => handleSend()}
                    disabled={!input.trim() || loading}
                    size="small"
                    sx={{
                      bgcolor: input.trim()
                        ? nairobiColors.green.main
                        : 'transparent',
                      color: input.trim() ? '#fff' : 'text.disabled',
                      width: 32,
                      height: 32,
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: nairobiColors.green.dark,
                        color: '#fff',
                      },
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={16} sx={{ color: 'inherit' }} />
                    ) : (
                      <Send sx={{ fontSize: 16 }} />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
              sx: {
                borderRadius: 3,
                bgcolor: alpha(nairobiColors.green.main, 0.03),
                '& fieldset': {
                  borderColor: alpha(nairobiColors.green.main, 0.15),
                },
                '&:hover fieldset': {
                  borderColor: `${alpha(nairobiColors.green.main, 0.3)} !important`,
                },
                '&.Mui-focused fieldset': {
                  borderColor: `${nairobiColors.green.main} !important`,
                },
              },
            }}
          />
          <Typography
            variant="caption"
            sx={{ display: 'block', textAlign: 'center', mt: 0.5, color: 'text.disabled', fontSize: '0.6rem' }}
          >
            AI responses are generated and may not always be accurate
          </Typography>
        </Box>
      </Dialog>
    </>
  );
};

export default AIAssistant;
