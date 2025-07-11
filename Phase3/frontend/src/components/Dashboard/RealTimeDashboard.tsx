// src/components/Dashboard/RealTimeDashboard.tsx
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
  Badge,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  SmartToy,
  PlayArrow,
  Pause,
  CheckCircle,
  Error as ErrorIcon,
  Warning,
  TrendingUp,
  Speed,
  Timer,
  Refresh,
  Visibility,
  Language,
  PhoneAndroid,
  Computer
} from '@mui/icons-material';
import { advancedAgentService, TaskStatus, AgentMetrics } from '../../services';
import { useWebSocket } from '../../hooks/useWebSocket';
import { formatDate, formatDuration, formatStatus } from '../../utils';

const RealTimeDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<AgentMetrics | null>(null);
  const [activeTasks, setActiveTasks] = useState<TaskStatus[]>([]);
  const [recentTasks, setRecentTasks] = useState<TaskStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // WebSocket connection for real-time updates
  const webSocketUrl = `ws://localhost:8000/ws`;
  const { isConnected, lastMessage } = useWebSocket(webSocketUrl);

  // Load initial data
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      handleWebSocketMessage(lastMessage);
    }
  }, [lastMessage]);

  // Periodic data refresh (fallback if WebSocket not available)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isConnected) {
        loadDashboardData();
      }
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [isConnected]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      const [metricsData, activeTasksData, recentTasksData] = await Promise.all([
        advancedAgentService.getMetrics(),
        advancedAgentService.getActiveTasks(),
        advancedAgentService.getCompletedTasks(10)
      ]);

      setMetrics(metricsData);
      setActiveTasks(activeTasksData);
      setRecentTasks(recentTasksData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWebSocketMessage = (message: any) => {
    if (message.type === 'status_update') {
      // Handle real-time updates
      setLastUpdated(new Date());
      
      // Optionally update specific metrics from WebSocket
      if (message.data?.queue_status) {
        // Update metrics based on real-time data
        loadDashboardData();
      }
    }
  };

  const getTaskTypeIcon = (taskDescription: string) => {
    if (taskDescription.toLowerCase().includes('cross-browser')) {
      return <Language />;
    } else if (taskDescription.toLowerCase().includes('responsive')) {
      return <PhoneAndroid />;
    } else if (taskDescription.toLowerCase().includes('performance')) {
      return <Speed />;
    } else {
      return <Computer />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle color="success" />;
      case 'failed': return <ErrorIcon color="error" />;
      case 'running': return <PlayArrow color="info" />;
      case 'pending': return <Pause color="warning" />;
      default: return <SmartToy color="action" />;
    }
  };

  if (isLoading && !metrics) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          📊 Real-time Agent Dashboard
        </Typography>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt: 2 }} color="text.secondary">
          Loading dashboard data...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            📊 Real-time Agent Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor AI agents performance and testing metrics in real-time
          </Typography>
        </Box>
        
        <Box display="flex" alignItems="center" gap={2}>
          <Chip 
            icon={isConnected ? <CheckCircle /> : <ErrorIcon />}
            label={isConnected ? 'Live' : 'Offline'}
            color={isConnected ? 'success' : 'error'}
            size="small"
          />
          <Tooltip title="Refresh Data">
            <IconButton onClick={loadDashboardData} disabled={isLoading}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
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
                  {metrics?.total_tasks || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Tasks
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
                  {metrics?.success_rate.toFixed(1) || 0}%
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
                  {advancedAgentService.formatExecutionTime(metrics?.average_execution_time)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg Duration
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
                  {metrics?.active_tasks || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Now
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
        gap: 3 
      }}>
        {/* Active Tasks */}
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                🔄 Active Tasks ({activeTasks.length})
              </Typography>
              <Badge badgeContent={activeTasks.length} color="primary">
                <PlayArrow />
              </Badge>
            </Box>
            
            {activeTasks.length > 0 ? (
              <List>
                {activeTasks.map((task, index) => (
                  <React.Fragment key={task.task_id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        {getTaskTypeIcon(task.task_id)}
                      </ListItemIcon>
                      
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle2" fontWeight="medium">
                              Task {task.task_id.slice(-8)}
                            </Typography>
                            <Chip 
                              label={task.status} 
                              size="small" 
                              color={advancedAgentService.getStatusColor(task.status)}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Started: {task.started_at ? new Date(task.started_at).toLocaleTimeString() : 'Pending'}
                            </Typography>
                            {task.started_at && (
                              <LinearProgress 
                                variant="indeterminate" 
                                sx={{ mt: 1, height: 4, borderRadius: 2 }}
                              />
                            )}
                          </Box>
                        }
                      />
                      
                      <Tooltip title="View Details">
                        <IconButton size="small">
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                    </ListItem>
                    {index < activeTasks.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Alert severity="info">
                No active tasks. All agents are currently idle.
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Recent Tasks */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📋 Recent Tasks
            </Typography>
            
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Task</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Completed</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentTasks.slice(0, 8).map((task) => (
                    <TableRow key={task.task_id}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {getTaskTypeIcon(task.task_id)}
                          <Typography variant="body2" fontWeight="medium">
                            {task.task_id.slice(-8)}
                          </Typography>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {getStatusIcon(task.status)}
                          <Chip 
                            label={formatStatus(task.status).label}
                            size="small"
                            color={formatStatus(task.status).color as any}
                          />
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {advancedAgentService.formatExecutionTime(task.execution_time)}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {task.completed_at ? new Date(task.completed_at).toLocaleTimeString() : '-'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>

      {/* System Status */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">System Status</Typography>
            <Typography variant="caption" color="text.secondary">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </Typography>
          </Box>
          
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 2, 
            mt: 1 
          }}>
            <Box>
              <Typography variant="body2" color="text.secondary">Queue Status</Typography>
              <Typography variant="body1">
                {metrics?.pending_tasks || 0} pending, {metrics?.active_tasks || 0} active
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary">Connection</Typography>
              <Box display="flex" alignItems="center" gap={1}>
                {isConnected ? (
                  <CheckCircle color="success" fontSize="small" />
                ) : (
                  <ErrorIcon color="error" fontSize="small" />
                )}
                <Typography variant="body1">
                  {isConnected ? 'Real-time' : 'Polling'}
                </Typography>
              </Box>
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary">Performance</Typography>
              <Typography variant="body1">
                {metrics ? 'Optimal' : 'Loading...'}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RealTimeDashboard;