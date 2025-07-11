// src/pages/Home.tsx - Update to use advanced service
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Grid
} from '@mui/material';
import { CheckCircle, Error, PlayArrow } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { advancedAgentService } from '../services';
import toast from 'react-hot-toast';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [backendStatus, setBackendStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [backendInfo, setBackendInfo] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    checkBackendConnection();
  }, []);

  const checkBackendConnection = async () => {
    try {
      setBackendStatus('loading');
      
      // Use advanced health check
      const health = await advancedAgentService.healthCheck();
      setBackendInfo(health);
      
      // Get real metrics
      const systemMetrics = await advancedAgentService.getMetrics();
      setMetrics(systemMetrics);
      
      setBackendStatus('connected');
      toast.success('Advanced backend connected successfully!');
    } catch (error) {
      setBackendStatus('error');
      toast.error('Failed to connect to backend');
      console.error('Backend connection error:', error);
    }
  };

  const renderBackendStatus = () => {
    switch (backendStatus) {
      case 'loading':
        return (
          <Box display="flex" alignItems="center" gap={1}>
            <CircularProgress size={20} />
            <Typography>Checking advanced backend...</Typography>
          </Box>
        );
      case 'connected':
        return (
          <Box display="flex" alignItems="center" gap={1}>
            <CheckCircle color="success" />
            <Typography color="success.main">Advanced Backend Connected</Typography>
            <Chip 
              label={`v${backendInfo?.version || 'Unknown'}`} 
              size="small" 
              color="success" 
            />
          </Box>
        );
      case 'error':
        return (
          <Box>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Error color="error" />
              <Typography color="error.main">Backend Disconnected</Typography>
            </Box>
            <Button 
              size="small" 
              variant="outlined" 
              onClick={checkBackendConnection}
            >
              Retry Connection
            </Button>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        🤖 AI Agents Testing Platform - Advanced
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Advanced AI-powered testing with cross-browser, responsive, and performance capabilities
      </Typography>

      {/* Status Cards */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
        gap: 3, 
        mb: 4 
      }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Backend Status
            </Typography>
            {renderBackendStatus()}
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Agent System
            </Typography>
            {metrics ? (
              <Box>
                <Typography variant="h4" color="primary.main">
                  {metrics.active_tasks}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Tasks
                </Typography>
                <Typography variant="caption" display="block">
                  {metrics.pending_tasks} pending, {metrics.completed_tasks} completed
                </Typography>
              </Box>
            ) : (
              <Typography variant="h4" color="primary.main">Ready</Typography>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Success Rate
            </Typography>
            {metrics ? (
              <Box>
                <Typography variant="h4" color="primary.main">
                  {metrics.success_rate.toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average: {advancedAgentService.formatExecutionTime(metrics.average_execution_time)}
                </Typography>
              </Box>
            ) : (
              <Typography variant="h4" color="primary.main">Ready</Typography>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Quick Actions */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Advanced Testing Options
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<PlayArrow />}
              onClick={() => navigate('/test-runner')}
              disabled={backendStatus !== 'connected'}
            >
              Advanced Test Runner
            </Button>
            
            <Button
              variant="outlined"
              onClick={() => navigate('/dashboard')}
            >
              Agent Dashboard
            </Button>
            
            <Button
              variant="outlined"
              onClick={() => navigate('/reports')}
            >
              Test Results
            </Button>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            ✨ Features: Cross-browser testing, Responsive design testing, Performance analysis, 
            Scenario-based testing, Real-time monitoring
          </Typography>
        </CardContent>
      </Card>

      {/* Backend Error Alert */}
      {backendStatus === 'error' && (
        <Alert severity="error" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Advanced Backend Connection Failed</strong><br />
            Make sure your Python backend is running on <code>http://localhost:8000</code>
          </Typography>
          <Box mt={1}>
            <Typography variant="caption" color="text.secondary">
              Start backend: <code>cd backend && python api/main.py</code>
            </Typography>
          </Box>
        </Alert>
      )}
    </Box>
  );
};

export default Home;