// src/App.tsx - Updated with advanced components
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Toaster } from 'react-hot-toast';
import MainLayout from './components/Layout/MainLayout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';

// Import advanced components
import AdvancedTestRunner from './components/TestRunner/AdvancedTestRunner';

// Placeholder components
const Agents = () => (
  <div>
    <h2>🤖 Agent Management</h2>
    <p>Advanced agent management - Coming soon!</p>
  </div>
);

const Settings = () => (
  <div>
    <h2>⚙️ Settings</h2>
    <p>System settings and configuration - Coming soon!</p>
  </div>
);

// Dark theme configuration
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00BCD4', // Cyan
    },
    secondary: {
      main: '#FF5722', // Orange
    },
    background: {
      default: '#121212',
      paper: '#1E1E1E',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <Router>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/test-runner" element={<AdvancedTestRunner />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </MainLayout>
      </Router>
      
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#333',
            color: '#fff',
          },
        }}
      />
    </ThemeProvider>
  );
}

export default App;