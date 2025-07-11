// src/components/Layout/MainLayout.tsx
import React, { ReactNode } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CssBaseline,
} from '@mui/material';
import {
  Dashboard,
  PlayArrow,
  Assessment,
  Settings,
  SmartToy,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const DRAWER_WIDTH = 280;

interface MainLayoutProps {
  children: ReactNode;
}

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { text: 'Test Runner', icon: <PlayArrow />, path: '/test-runner' },
  { text: 'Reports', icon: <Assessment />, path: '/reports' },
  { text: 'Agents', icon: <SmartToy />, path: '/agents' },
  { text: 'Settings', icon: <Settings />, path: '/settings' },
];

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: `calc(100% - ${DRAWER_WIDTH}px)`,
          ml: `${DRAWER_WIDTH}px`,
          bgcolor: 'primary.main'
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            🤖 AI Agents Testing Platform
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            v{process.env.REACT_APP_VERSION}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            bgcolor: 'grey.900',
            color: 'white'
          },
        }}
        variant="permanent"
        anchor="left"
      >
        <Toolbar>
          <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
            AI Testing
          </Typography>
        </Toolbar>
        
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{
                  bgcolor: location.pathname === item.path ? 'primary.dark' : 'transparent',
                  '&:hover': { bgcolor: 'grey.800' }
                }}
              >
                <ListItemIcon sx={{ color: 'white' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          p: 3,
          width: `calc(100% - ${DRAWER_WIDTH}px)`
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;