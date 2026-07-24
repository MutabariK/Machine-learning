import React from 'react';
import { Box } from '@mui/material';
import { nairobiColors } from '../theme/nairobiTheme';

const LionSilhouette: React.FC<{ color?: string; size?: number }> = ({ color = nairobiColors.gold.main, size = 60 }) => (
  <svg width={size} height={size * 0.7} viewBox="0 0 100 70" fill={color} xmlns="http://www.w3.org/2000/svg" opacity="0.15">
    <path d="M20 35 C15 30 10 28 8 22 C6 16 10 10 16 8 C20 6 24 8 26 10 C28 6 32 4 36 4 C40 2 44 2 48 4 C50 2 54 2 58 4 C62 6 64 10 62 14 C66 12 70 14 72 18 C74 22 72 26 68 28 C72 32 74 36 72 40 C70 44 66 46 62 44 L60 50 C58 54 54 56 50 56 L46 56 C44 58 42 60 38 60 L32 60 C30 62 26 64 22 62 C18 60 16 56 18 52 L18 48 C14 46 12 42 14 38 C16 36 18 35 20 35 Z" />
    <path d="M50 56 L52 64 L48 64 L48 56 M38 60 L38 68 L34 68 L34 60 M30 60 L28 68 L24 68 L26 60" />
    <circle cx="24" cy="24" r="2" fill="none" />
  </svg>
);

const GiraffeSilhouette: React.FC<{ color?: string; size?: number }> = ({ color = nairobiColors.gold.main, size = 60 }) => (
  <svg width={size * 0.5} height={size} viewBox="0 0 50 100" fill={color} xmlns="http://www.w3.org/2000/svg" opacity="0.15">
    <path d="M22 8 C20 4 22 0 26 0 C30 0 32 4 30 8 L28 6 C28 4 26 4 26 6 Z" />
    <path d="M24 8 L22 14 C20 16 18 18 18 22 L16 38 C14 42 14 46 16 50 L16 80 C16 84 18 86 18 88 L18 96 L22 96 L22 86 L24 80 L26 86 L26 96 L30 96 L30 88 C32 86 34 82 34 78 L34 50 C36 46 36 42 34 38 L32 22 C32 18 30 16 28 14 L26 8 Z" />
    <path d="M18 96 L22 96 L22 100 L18 100 Z M26 96 L30 96 L30 100 L26 100 Z" />
    <circle cx="23" cy="10" r="1" fill="none" />
  </svg>
);

const RhinoSilhouette: React.FC<{ color?: string; size?: number }> = ({ color = nairobiColors.gold.main, size = 60 }) => (
  <svg width={size} height={size * 0.6} viewBox="0 0 100 60" fill={color} xmlns="http://www.w3.org/2000/svg" opacity="0.15">
    <path d="M10 20 L4 14 L6 12 L14 18 C18 14 24 12 30 12 L70 12 C78 12 86 16 90 22 L92 26 C94 30 94 34 92 38 L90 42 C86 48 78 52 70 52 L30 52 C24 52 18 48 14 44 L12 42 C8 38 6 32 8 26 Z" />
    <path d="M14 44 L14 56 L18 56 L18 46 M30 52 L30 58 L34 58 L34 52 M70 52 L70 58 L74 58 L74 48 M84 46 L84 56 L88 56 L88 42" />
    <path d="M4 14 L0 10 L2 8 L6 12" />
    <circle cx="82" cy="22" r="2" fill="none" />
  </svg>
);

const ZebraSilhouette: React.FC<{ color?: string; size?: number }> = ({ color = nairobiColors.gold.main, size = 60 }) => (
  <svg width={size * 0.8} height={size} viewBox="0 0 80 100" fill={color} xmlns="http://www.w3.org/2000/svg" opacity="0.15">
    <path d="M20 20 C18 14 20 8 24 6 C26 4 28 4 30 6 L28 10 C26 8 24 10 24 14 L26 20 Z" />
    <path d="M24 20 L20 30 C18 34 16 38 16 42 L14 60 C14 64 16 68 16 72 L16 92 L20 92 L20 74 L22 68 L26 74 L26 92 L30 92 L30 72 C32 68 34 64 34 60 L36 42 C36 38 38 36 40 34 L46 28 C50 24 54 22 58 22 L62 22 C64 22 66 24 66 26 L66 42 C66 46 64 50 64 54 L64 72 L64 92 L68 92 L68 74 L70 68 L72 74 L72 92 L76 92 L76 72 C76 68 74 64 74 60 L74 42 C74 36 72 30 68 26 C66 22 62 20 58 20 L46 20 C40 20 34 22 30 26 L26 30 L28 20 Z" />
    <path d="M16 92 L20 92 L20 98 L16 98 Z M26 92 L30 92 L30 98 L26 98 Z M64 92 L68 92 L68 98 L64 98 Z M72 92 L76 92 L76 98 L72 98 Z" />
  </svg>
);

const AcaciaSilhouette: React.FC<{ color?: string; size?: number }> = ({ color = nairobiColors.green.main, size = 60 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill={color} xmlns="http://www.w3.org/2000/svg" opacity="0.08">
    <rect x="47" y="50" width="6" height="50" rx="2" />
    <ellipse cx="50" cy="35" rx="40" ry="18" />
    <ellipse cx="30" cy="30" rx="20" ry="12" />
    <ellipse cx="70" cy="30" rx="20" ry="12" />
    <ellipse cx="50" cy="25" rx="25" ry="10" />
  </svg>
);

export const WildlifeBanner: React.FC<{ variant?: 'login' | 'sidebar' | 'footer' }> = ({ variant = 'login' }) => {
  if (variant === 'sidebar') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, py: 1, opacity: 0.5 }}>
        <LionSilhouette size={32} color="#C8A951" />
        <GiraffeSilhouette size={32} color="#C8A951" />
        <RhinoSilhouette size={32} color="#C8A951" />
      </Box>
    );
  }

  if (variant === 'footer') {
    return (
      <Box sx={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        gap: 4,
        pointerEvents: 'none',
        overflow: 'hidden',
        height: 80,
      }}>
        <AcaciaSilhouette size={70} color="#1D6F42" />
        <LionSilhouette size={50} color="#C8A951" />
        <GiraffeSilhouette size={65} color="#C8A951" />
        <RhinoSilhouette size={45} color="#C8A951" />
        <ZebraSilhouette size={50} color="#C8A951" />
        <AcaciaSilhouette size={60} color="#1D6F42" />
      </Box>
    );
  }

  return (
    <Box sx={{
      position: 'relative',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-end',
      gap: 3,
      mt: 2,
      pointerEvents: 'none',
      height: 80,
    }}>
      <AcaciaSilhouette size={70} color="#1D6F42" />
      <LionSilhouette size={55} color="#C8A951" />
      <GiraffeSilhouette size={70} color="#C8A951" />
      <ZebraSilhouette size={50} color="#C8A951" />
      <RhinoSilhouette size={50} color="#C8A951" />
      <AcaciaSilhouette size={60} color="#1D6F42" />
    </Box>
  );
};

export const WildlifeBackground: React.FC = () => (
  <Box sx={{
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    pointerEvents: 'none',
    zIndex: 0,
    opacity: 0.4,
    pb: 2,
  }}>
    <AcaciaSilhouette size={100} color="#1D6F42" />
    <GiraffeSilhouette size={90} color="#A68B3C" />
    <AcaciaSilhouette size={80} color="#1D6F42" />
    <LionSilhouette size={70} color="#A68B3C" />
    <AcaciaSilhouette size={90} color="#1D6F42" />
    <ZebraSilhouette size={60} color="#A68B3C" />
    <RhinoSilhouette size={65} color="#A68B3C" />
    <AcaciaSilhouette size={85} color="#1D6F42" />
  </Box>
);

export { LionSilhouette, GiraffeSilhouette, RhinoSilhouette, ZebraSilhouette, AcaciaSilhouette };
