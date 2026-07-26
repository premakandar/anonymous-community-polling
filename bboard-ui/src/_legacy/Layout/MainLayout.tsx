// This file is part of midnightntwrk/example-bboard.
import React, { type PropsWithChildren } from 'react';
import { Box, Typography, AppBar, Toolbar } from '@mui/material';

/** Legacy layout retained for the original Board demo components. */
export const MainLayout: React.FC<PropsWithChildren> = ({ children }) => (
  <Box sx={{ minHeight: '100vh' }}>
    <AppBar position="static" color="transparent" elevation={0}>
      <Toolbar>
        <Typography variant="h6">Bulletin Board</Typography>
      </Toolbar>
    </AppBar>
    <Box sx={{ p: 3 }}>{children}</Box>
  </Box>
);

export const Header: React.FC = () => null;
