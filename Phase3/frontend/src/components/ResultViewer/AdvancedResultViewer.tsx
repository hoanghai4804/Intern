// src/components/ResultViewer/AdvancedResultViewer.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  IconButton,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider,
  Tooltip,
  Badge,
  LinearProgress,
  Tabs,
  Tab
} from '@mui/material';
import {
  Search,
  FilterList,
  Download,
  Visibility,
  ExpandMore,
  CheckCircle,
  Error as ErrorIcon,
  Warning,
  Timer,
  Language,
  PhoneAndroid,
  Speed,
  Computer,
  Code,
  PlayArrow,
  BugReport,
  Refresh,
  Close,
  OpenInNew
} from '@mui/icons-material';
import { advancedAgentService, TaskStatus } from '../../services';
import { formatDate, formatDuration, formatStatus } from '../../utils';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`result-tabpanel-${index}`}
      aria-labelledby={`result-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AdvancedResultViewer: React.FC = () => {
  const [tasks, setTasks] = useState<TaskStatus[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<TaskStatus[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTask, setSelectedTask] = useState<TaskStatus | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    filterTasks();
  }, [tasks, searchTerm, statusFilter]);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const completedTasks = await advancedAgentService.getAllCompletedTasks(); // Sử dụng method mới để lấy tất cả task
      setTasks(completedTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterTasks = () => {
    let filtered = tasks;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.task_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.result?.message && task.result.message.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredTasks(filtered);
    setPage(0);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleTaskClick = (task: TaskStatus) => {
    setSelectedTask(task);
    setDetailDialogOpen(true);
  };

  const getTaskTypeFromDescription = (taskId: string): { type: string; icon: React.ReactNode; color: string } => {
    const description = taskId.toLowerCase();
    
    if (description.includes('cross-browser') || description.includes('browser')) {
      return { type: 'Cross-browser', icon: <Language />, color: '#2196F3' };
    } else if (description.includes('responsive') || description.includes('mobile')) {
      return { type: 'Responsive', icon: <PhoneAndroid />, color: '#4CAF50' };
    } else if (description.includes('performance') || description.includes('speed')) {
      return { type: 'Performance', icon: <Speed />, color: '#FF9800' };
    } else if (description.includes('form')) {
      return { type: 'Form Test', icon: <Code />, color: '#9C27B0' };
    } else {
      return { type: 'Web Test', icon: <Computer />, color: '#607D8B' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle color="success" />;
      case 'failed': return <ErrorIcon color="error" />;
      case 'cancelled': return <ErrorIcon color="error" />;
      case 'running': return <PlayArrow color="info" />;
      case 'pending': return <Timer color="warning" />;
      default: return <Timer color="action" />;
    }
  };

  const renderCrossBrowserResults = (result: any) => {
    if (!result?.cross_browser_results) return null;

    const results = result.cross_browser_results;
    const summary = result.summary;

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          🌐 Cross-browser Test Results
        </Typography>
        
        {summary && (
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 2 
              }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Browsers Tested</Typography>
                  <Typography variant="h6">{summary.total_browsers_tested}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Success Rate</Typography>
                  <Typography variant="h6" color={summary.success_rate === 100 ? 'success.main' : 'warning.main'}>
                    {summary.success_rate.toFixed(1)}%
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Failed Browsers</Typography>
                  <Box display="flex" gap={1} flexWrap="wrap" mt={0.5}>
                    {summary.failed_browsers.length > 0 ? (
                      summary.failed_browsers.map((browser: string) => (
                        <Chip key={browser} label={browser} color="error" size="small" />
                      ))
                    ) : (
                      <Chip label="None" color="success" size="small" />
                    )}
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
          gap: 2 
        }}>
          {Object.entries(results).map(([browser, browserResult]: [string, any]) => (
            <Card variant="outlined" key={browser}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Language />
                  <Typography variant="h6">{browser}</Typography>
                  <Chip 
                    label={browserResult.status} 
                    color={browserResult.status === 'success' ? 'success' : 'error'}
                    size="small"
                  />
                </Box>
                
                {browserResult.execution_time && (
                  <Typography variant="body2" color="text.secondary">
                    Execution time: {formatDuration(browserResult.execution_time * 1000)}
                  </Typography>
                )}
                
                {browserResult.error && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    {browserResult.error}
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    );
  };

  const renderDetailDialog = () => (
    <Dialog 
      open={detailDialogOpen} 
      onClose={() => setDetailDialogOpen(false)}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
          <Box display="flex" alignItems="center" gap={1}>
            {selectedTask && getStatusIcon(selectedTask.status)}
            <Typography variant="h6">
              Task {selectedTask?.task_id.slice(-8)}
            </Typography>
            <Chip 
              label={selectedTask?.status} 
              color={selectedTask ? advancedAgentService.getStatusColor(selectedTask.status) : 'default'}
              size="small"
            />
          </Box>
          <IconButton onClick={() => setDetailDialogOpen(false)}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {selectedTask && (
          <Box>
            <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
              <Tab label="Overview" />
              <Tab label="Results" />
              <Tab label="Raw Data" />
            </Tabs>

            <TabPanel value={selectedTab} index={0}>
              {/* Overview Tab */}
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 2, 
                mb: 3 
              }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Execution Time
                  </Typography>
                  <Typography variant="body1">
                    {advancedAgentService.formatExecutionTime(selectedTask.execution_time)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Completed At
                  </Typography>
                  <Typography variant="body1">
                    {selectedTask.completed_at ? formatDate(new Date(selectedTask.completed_at)) : 'N/A'}
                  </Typography>
                </Box>
              </Box>

              {selectedTask.status !== 'completed' && selectedTask.error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  <Typography variant="subtitle2">Error Details</Typography>
                  <Typography variant="body2">{selectedTask.error}</Typography>
                </Alert>
              )}

              {selectedTask.result?.message && (
                <Alert 
                  severity={selectedTask.status === 'completed' ? 'success' : 'error'}
                  sx={{ mb: 3 }}
                >
                  {selectedTask.result.message}
                </Alert>
              )}
            </TabPanel>

            <TabPanel value={selectedTab} index={1}>
              {/* Results Tab */}
              {selectedTask.result && (
                <Box>
                  {renderCrossBrowserResults(selectedTask.result)}
                  
                  {selectedTask.result.actions_performed && (
                    <Accordion sx={{ mt: 2 }}>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="subtitle1">
                          <PlayArrow sx={{ mr: 1, verticalAlign: 'middle' }} />
                          Actions Performed ({selectedTask.result.actions_performed.length})
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <List dense>
                          {selectedTask.result.actions_performed.map((action: string, index: number) => (
                            <ListItem key={index}>
                              <ListItemText 
                                primary={`${index + 1}. ${action}`}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  )}

                  {selectedTask.result.screenshots && selectedTask.result.screenshots.length > 0 && (
                    <Accordion sx={{ mt: 2 }}>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="subtitle1">
                          📸 Screenshots ({selectedTask.result.screenshots.length})
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box sx={{ 
                          display: 'grid', 
                          gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                          gap: 2 
                        }}>
                          {selectedTask.result.screenshots.map((screenshot: string, index: number) => (
                            <Paper 
                              key={index}
                              variant="outlined" 
                              sx={{ p: 2, textAlign: 'center', cursor: 'pointer' }}
                            >
                              <Typography variant="caption" display="block">
                                {screenshot}
                              </Typography>
                              <Button size="small" startIcon={<OpenInNew />} sx={{ mt: 1 }}>
                                View
                              </Button>
                            </Paper>
                          ))}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  )}
                </Box>
              )}
            </TabPanel>

            <TabPanel value={selectedTab} index={2}>
              {/* Raw Data Tab */}
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                <pre style={{ 
                  whiteSpace: 'pre-wrap', 
                  fontSize: '0.875rem',
                  margin: 0,
                  fontFamily: 'monospace'
                }}>
                  {JSON.stringify({
                    task_id: selectedTask.task_id,
                    status: selectedTask.status,
                    created_at: selectedTask.created_at,
                    started_at: selectedTask.started_at,
                    completed_at: selectedTask.completed_at,
                    execution_time: selectedTask.execution_time,
                    result: selectedTask.result,
                    error: selectedTask.error
                  }, null, 2)}
                </pre>
              </Paper>
            </TabPanel>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={() => setDetailDialogOpen(false)}>
          Close
        </Button>
        <Button variant="contained" startIcon={<Download />}>
          Export Report
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            📊 Advanced Test Results
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and analyze comprehensive test execution results
          </Typography>
        </Box>
        <Button startIcon={<Refresh />} onClick={loadTasks} disabled={isLoading}>
          Refresh
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' },
            gap: 2, 
            alignItems: 'center' 
          }}>
            <Box sx={{ gridColumn: { xs: '1', md: 'span 4' } }}>
              <TextField
                fullWidth
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            
            <Box sx={{ gridColumn: { xs: '1', md: 'span 3' } }}>
              <FormControl fullWidth>
                <InputLabel>Status Filter</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status Filter"
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            <Box sx={{ 
              gridColumn: { xs: '1', md: 'span 5' },
              display: 'flex',
              gap: 1,
              justifyContent: 'flex-end'
            }}>
              <Button startIcon={<FilterList />} variant="outlined">
                More Filters
              </Button>
              <Button startIcon={<Download />} variant="outlined">
                Export All
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        {isLoading && <LinearProgress />}
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Task ID</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Completed</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTasks
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((task) => {
                  const taskType = getTaskTypeFromDescription(task.task_id);
                  return (
                    <TableRow 
                      key={task.task_id}
                      hover 
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleTaskClick(task)}
                    >
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight="medium">
                          {task.task_id.slice(-12)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Created: {formatDate(new Date(task.created_at))}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box sx={{ color: taskType.color }}>
                            {taskType.icon}
                          </Box>
                          <Typography variant="body2">
                            {taskType.type}
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
                          {task.execution_time ? advancedAgentService.formatExecutionTime(task.execution_time) : 'N/A'}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2">
                          {task.completed_at ? new Date(task.completed_at).toLocaleTimeString() : '-'}
                        </Typography>
                      </TableCell>
                      
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small" 
                            onClick={() => handleTaskClick(task)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100, 200]}
          component="div"
          count={filteredTasks.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
        
        {/* Summary Info */}
        <Box sx={{ p: 2, bgcolor: 'grey.50', borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">
            Showing {filteredTasks.length} of {tasks.length} total tasks
            {searchTerm && ` (filtered by "${searchTerm}")`}
            {statusFilter !== 'all' && ` (filtered by status: ${statusFilter})`}
          </Typography>
        </Box>
      </Card>

      {renderDetailDialog()}
    </Box>
  );
};

export default AdvancedResultViewer;