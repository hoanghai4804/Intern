// src/components/AgentDashboard/AgentDashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Divider,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  SmartToy,
  PlayArrow,
  Pause,
  Stop,
  CheckCircle,
  Error as ErrorIcon,
  Warning,
  TrendingUp,
  Speed,
  Timer,
  Memory,
  Refresh,
  MoreVert
} from '@mui/icons-material';
import { Agent, TestResult } from '../../types';
import { formatDate, formatDuration, formatStatus } from '../../utils';

const Dashboard: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [recentTests, setRecentTests] = useState<TestResult[]>([]);
  const [metrics, setMetrics] = useState({
    totalTests: 0,
    successRate: 0,
    avgExecutionTime: 0,
    activeAgents: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - replace with real API calls later
  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock agents
      const mockAgents: Agent[] = [
        {
          id: 'agent-1',
          name: 'Primary Test Agent',
          status: 'running',
          current_task: 'Testing login functionality on demo.com',
          last_activity: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
          capabilities: ['web-testing', 'ui-validation', 'form-interaction'],
          performance_metrics: {
            tests_completed: 47,
            success_rate: 94.7,
            avg_execution_time: 23.5
          }
        },
        {
          id: 'agent-2', 
          name: 'UI Validation Agent',
          status: 'idle',
          last_activity: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
          capabilities: ['ui-testing', 'accessibility', 'responsive-design'],
          performance_metrics: {
            tests_completed: 32,
            success_rate: 87.5,
            avg_execution_time: 18.2
          }
        },
        {
          id: 'agent-3',
          name: 'Performance Agent',
          status: 'error',
          current_task: 'Load testing failed - connection timeout',
          last_activity: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          capabilities: ['performance-testing', 'load-testing', 'monitoring'],
          performance_metrics: {
            tests_completed: 15,
            success_rate: 66.7,
            avg_execution_time: 45.8
          }
        }
      ];

      // Mock recent tests
      const mockTests: TestResult[] = [
        {
          id: 'test-1',
          test_case_id: 'Login Flow Test',
          status: 'success',
          result: { message: 'All login scenarios passed' },
          execution_time: 24500,
          timestamp: new Date(Date.now() - 1000 * 60 * 10)
        },
        {
          id: 'test-2', 
          test_case_id: 'Checkout Process',
          status: 'success',
          result: { message: 'Payment flow completed successfully' },
          execution_time: 38200,
          timestamp: new Date(Date.now() - 1000 * 60 * 25)
        },
        {
          id: 'test-3',
          test_case_id: 'Navigation Test',
          status: 'warning',
          result: { message: 'Some menu items load slowly' },
          execution_time: 15800,
          timestamp: new Date(Date.now() - 1000 * 60 * 45)
        },
        {
          id: 'test-4',
          test_case_id: 'Form Validation',
          status: 'error',
          result: { message: 'Email validation failed' },
          execution_time: 12100,
          timestamp: new Date(Date.now() - 1000 * 60 * 60)
        }
      ];

      // Calculate metrics
      const totalTests = mockTests.length;
      const successfulTests = mockTests.filter(t => t.status === 'success').length;
      const successRate = totalTests > 0 ? (successfulTests / totalTests) * 100 : 0;
      const avgTime = mockTests.reduce((sum, test) => sum + (test.execution_time || 0), 0) / totalTests;
      const activeAgents = mockAgents.filter(a => a.status === 'running').length;

      setAgents(mockAgents);
      setRecentTests(mockTests);
      setMetrics({
        totalTests,
        successRate,
        avgExecutionTime: avgTime,
        activeAgents
      });
      
      setIsLoading(false);
    };

    loadDashboardData();
  }, []);

  const getAgentStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'success';
      case 'idle': return 'default';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getAgentStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <PlayArrow />;
      case 'idle': return <Pause />;
      case 'error': return <ErrorIcon />;
      default: return <SmartToy />;
    }
  };

  if (isLoading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          📊 Agent Dashboard
        </Typography>
        <Box sx={{ mt: 4 }}>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 2 }} color="text.secondary">
            Loading dashboard data...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            📊 Agent Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor AI agents performance and testing metrics
          </Typography>
        </Box>
        <Button startIcon={<Refresh />} variant="outlined">
          Refresh Data
        </Button>
      </Box>

      {/* Metrics Overview */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        gap: 3, 
        mb: 4 
      }}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <TrendingUp />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  {metrics.totalTests}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Tests
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'success.main' }}>
                <CheckCircle />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  {metrics.successRate.toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Success Rate
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'info.main' }}>
                <Timer />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  {formatDuration(metrics.avgExecutionTime)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg Execution
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'warning.main' }}>
                <SmartToy />
              </Avatar>
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  {metrics.activeAgents}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Agents
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        {/* Agents Status */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              🤖 AI Agents Status
            </Typography>
            
            <List>
              {agents.map((agent, index) => (
                <React.Fragment key={agent.id}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <Avatar 
                        sx={{ 
                          bgcolor: `${getAgentStatusColor(agent.status)}.main`,
                          width: 40,
                          height: 40
                        }}
                      >
                        {getAgentStatusIcon(agent.status)}
                      </Avatar>
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {agent.name}
                          </Typography>
                          <Chip 
                            label={agent.status} 
                            size="small" 
                            color={getAgentStatusColor(agent.status) as any}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          {agent.current_task && (
                            <Typography variant="body2" color="text.secondary">
                              🔄 {agent.current_task}
                            </Typography>
                          )}
                          <Typography variant="caption" color="text.secondary">
                            Last active: {formatDate(agent.last_activity || new Date())}
                          </Typography>
                          {agent.performance_metrics && (
                            <Box display="flex" gap={1} mt={0.5}>
                              <Chip 
                                label={`${agent.performance_metrics.tests_completed} tests`}
                                size="small"
                                variant="outlined"
                              />
                              <Chip 
                                label={`${agent.performance_metrics.success_rate}% success`}
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                          )}
                        </Box>
                      }
                    />
                    
                    <Tooltip title="Agent actions">
                      <IconButton>
                        <MoreVert />
                      </IconButton>
                    </Tooltip>
                  </ListItem>
                  {index < agents.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>

        {/* Recent Test Results */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📋 Recent Test Results
            </Typography>
            
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Test Case</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentTests.map((test) => {
                    const statusInfo = formatStatus(test.status);
                    return (
                      <TableRow key={test.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {test.test_case_id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={statusInfo.label}
                            size="small"
                            color={statusInfo.color as any}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {test.execution_time ? formatDuration(test.execution_time) : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(test.timestamp)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>

      {/* System Health Alert */}
      {agents.some(agent => agent.status === 'error') && (
        <Alert severity="warning" sx={{ mt: 3 }}>
          <Typography variant="subtitle2">System Alert</Typography>
          Some agents are experiencing issues. Check agent logs for detailed information.
        </Alert>
      )}
    </Box>
  );
};

export default Dashboard;