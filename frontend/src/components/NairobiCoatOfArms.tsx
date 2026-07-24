import React from 'react';
import { Box } from '@mui/material';

interface Props {
  /** Rendered height in px — width auto-scales to the logo's native aspect ratio. */
  size?: number;
}

const LOGO_ASPECT_RATIO = 347 / 112;

const NairobiCoatOfArms: React.FC<Props> = ({ size = 80 }) => (
  <Box
    component="img"
    src="/nairobi-county-logo.png"
    alt="Nairobi City County"
    sx={{ height: size, width: size * LOGO_ASPECT_RATIO, objectFit: 'contain', display: 'block', mx: 'auto' }}
  />
);

export default NairobiCoatOfArms;
