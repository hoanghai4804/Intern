// src/components/ResultViewer/ResultViewer.tsx
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
  Badge
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
  Camera,
  Code,
  PlayArrow,
  BugReport,
  TrendingUp,
  CalendarToday
} from '@mui/icons-material';
import { TestResult } from '../../types';
import { formatDate, formatDuration, formatStatus } from '../../utils';

interface ResultViewerProps {
  showFilters?: boolean;
  maxHeight?: number;
}

const ResultViewer: React.FC<ResultViewerProps> = ({ 
  showFilters = true, 
  maxHeight 
}) => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<TestResult[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - replace with real API calls later
  useEffect(() => {
    const loadTestResults = async () => {
      setIsLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockResults: TestResult[] = [
        {
          id: 'test-001',
          test_case_id: 'Login Functionality Test',
          status: 'success',
          result: {
            message: 'All login scenarios completed successfully',
            actions_performed: [
              'Navigated to login page',
              'Entered valid credentials',
              'Clicked login button',
              'Verified dashboard access'
            ],
            execution_details: 'Test executed on Chrome browser. All form interactions successful. Response times within acceptable limits.',
            screenshots: ['login_page.png', 'dashboard.png'],
            performance_metrics: {
              page_load_time: 1.2,
              form_submission_time: 0.8,
              total_execution_time: 24.5
            }
          },
          execution_time: 24500,
          timestamp: new Date('2024-07-07T10:30:00'),
          screenshots: ['screenshot1.png', 'screenshot2.png']
        },
        {
          id: 'test-002',
          test_case_id: 'E-commerce Checkout Flow',
          status: 'success',
          result: {
            message: 'Checkout process completed without issues',
            actions_performed: [
              'Added items to cart',
              'Proceeded to checkout',
              'Filled shipping information',
              'Completed payment simulation'
            ],
            execution_details: 'Full e-commerce flow tested successfully. Payment gateway integration working properly.',
            screenshots: ['cart.png', 'checkout.png', 'confirmation.png']
          },
          execution_time: 45200,
          timestamp: new Date('2024-07-07T09:15:00')
        },
        {
          id: 'test-003',
          test_case_id: 'Form Validation Test',
          status: 'warning',
          result: {
            message: 'Form validation partially working - some edge cases need attention',
            actions_performed: [
              'Tested required field validation',
              'Checked email format validation',
              'Tested phone number validation'
            ],
            execution_details: 'Most validation rules working correctly. Email validation allows some invalid formats. Phone validation too strict for international numbers.',
            issues_found: [
              'Email validation accepts emails without domains',
              'Phone validation rejects valid international formats',
              'Error messages not clearly visible on mobile'
            ],
            screenshots: ['form_empty.png', 'form_errors.png']
          },
          execution_time: 18300,
          timestamp: new Date('2024-07-07T08:45:00')
        },
        {
          id: 'test-004',
          test_case_id: 'Navigation Menu Test',
          status: 'error',
          result: {
            message: 'Navigation test failed - broken links detected',
            actions_performed: [
              'Clicked main navigation items',
              'Tested dropdown menus',
              'Checked footer links'
            ],
            execution_details: 'Several navigation links return 404 errors. Dropdown menu JavaScript not functioning properly.',
            errors: [
              '404 Error: /about-us page not found',
              'JavaScript error in dropdown menu',
              'Footer contact link broken'
            ],
            screenshots: ['nav_error.png', '404_page.png']
          },
          execution_time: 12100,
          timestamp: new Date('2024-07-07T08:00:00')
        },
        {
          id: 'test-005',
          test_case_id: 'Mobile Responsiveness',
          status: 'success',
          result: {
            message: 'Mobile layout renders correctly across devices',
            actions_performed: [
              'Tested on mobile viewport',
              'Verified touch interactions',
              'Checked text readability'
            ],
            execution_details: 'All responsive breakpoints working correctly. Touch targets appropriate size. Text remains readable.',
            screenshots: ['mobile_home.png', 'mobile_menu.png']
          },
          execution_time: 31800,
          timestamp: new Date('2024-07-06T16:30:00')
        }
      ];

      setTestResults(mockResults);
      setFilteredResults(mockResults);
      setIsLoading(false);
    };

    loadTestResults();
  }, []);

  // Filter and search logic
  useEffect(() => {
    let filtered = testResults;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(result => result.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(result =>
        result.test_case_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.result.message?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredResults(filtered);
    setPage(0); // Reset to first page when filtering
  }, [testResults, statusFilter, searchTerm]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRowClick = (result: TestResult) => {
    setSelectedResult(result);
    setDetailDialogOpen(true);
  };

  const handleToggleExpand = (resultId: string) => {
    setExpandedRow(expandedRow === resultId ? null : resultId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle color="success" />;
      case 'error': return <ErrorIcon color="error" />;
      case 'warning': return <Warning color="warning" />;
      default: return <Timer color="info" />;
    }
  };

  const renderDetailDialog = () => (
    <Dialog 
      open={detailDialogOpen} 
      onClose={() => setDetailDialogOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          {selectedResult && getStatusIcon(selectedResult.status)}
          <Typography variant="h6">
            {selectedResult?.test_case_id}
          </Typography>
          <Chip 
            label={selectedResult?.status} 
            color={formatStatus(selectedResult?.status || '').color as any}
            size="small"
          />
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {selectedResult && (
          <Box>
            {/* Basic Info */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Execution Time
                </Typography>
                <Typography variant="body1">
                  {selectedResult.execution_time ? formatDuration(selectedResult.execution_time) : 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Timestamp
                </Typography>
                <Typography variant="body1">
                  {formatDate(selectedResult.timestamp)}
                </Typography>
              </Box>
            </Box>

            {/* Result Message */}
            <Alert 
              severity={selectedResult.status === 'success' ? 'success' : selectedResult.status === 'error' ? 'error' : 'warning'}
              sx={{ mb: 3 }}
            >
              {selectedResult.result.message}
            </Alert>

            {/* Actions Performed */}
            {selectedResult.result.actions_performed && (
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1">
                    <PlayArrow sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Actions Performed ({selectedResult.result.actions_performed.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List dense>
                    {selectedResult.result.actions_performed.map((action: string, index: number) => (
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

            {/* Execution Details */}
            {selectedResult.result.execution_details && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1">
                    <Code sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Execution Details
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedResult.result.execution_details}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Issues/Errors */}
            {(selectedResult.result.issues_found || selectedResult.result.errors) && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1">
                    <BugReport sx={{ mr: 1, verticalAlign: 'middle' }} />
                    {selectedResult.result.issues_found ? 'Issues Found' : 'Errors'}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List dense>
                    {(selectedResult.result.issues_found || selectedResult.result.errors || []).map((issue: string, index: number) => (
                      <ListItem key={index}>
                        <ListItemText 
                          primary={issue}
                          sx={{ color: 'error.main' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Screenshots */}
            {selectedResult.screenshots && selectedResult.screenshots.length > 0 && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1">
                    <Camera sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Screenshots ({selectedResult.screenshots.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                    {selectedResult.screenshots.map((screenshot: string, index: number) => (
                      <Paper 
                        key={index}
                        variant="outlined" 
                        sx={{ p: 2, textAlign: 'center', cursor: 'pointer' }}
                      >
                        <Camera sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                        <Typography variant="caption" display="block">
                          {screenshot}
                        </Typography>
                      </Paper>
                    ))}
                  </Box>
                </AccordionDetails>
              </Accordion>
            )}
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
      <Typography variant="h4" gutterBottom fontWeight="bold">
        📊 Test Results
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        View and analyze test execution results and performance metrics
      </Typography>

      {showFilters && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 2fr' }, gap: 2, alignItems: 'center' }}>
              <TextField
                fullWidth
                placeholder="Search test cases..."
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
              
              <FormControl fullWidth>
                <InputLabel>Status Filter</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status Filter"
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="success">Success</MenuItem>
                  <MenuItem value="warning">Warning</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                </Select>
              </FormControl>
              
              <Box display="flex" gap={1} justifyContent="flex-end">
                <Button startIcon={<FilterList />} variant="outlined">
                  More Filters
                </Button>
                <Button startIcon={<Download />} variant="outlined">
                  Export Results
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      <Card>
        <TableContainer sx={{ maxHeight: maxHeight || 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Test Case</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Timestamp</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="text.secondary">
                      Loading test results...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredResults
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((result) => (
                    <React.Fragment key={result.id}>
                      <TableRow 
                        hover 
                        sx={{ cursor: 'pointer' }}
                        onClick={() => handleRowClick(result)}
                      >
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="medium">
                              {result.test_case_id}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {result.id}
                            </Typography>
                          </Box>
                        </TableCell>
                        
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            {getStatusIcon(result.status)}
                            <Chip 
                              label={formatStatus(result.status).label}
                              size="small"
                              color={formatStatus(result.status).color as any}
                            />
                          </Box>
                        </TableCell>
                        
                        <TableCell>
                          <Typography variant="body2">
                            {result.execution_time ? formatDuration(result.execution_time) : 'N/A'}
                          </Typography>
                        </TableCell>
                        
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(result.timestamp)}
                          </Typography>
                        </TableCell>
                        
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Box display="flex" gap={1}>
                            <Tooltip title="View Details">
                              <IconButton 
                                size="small" 
                                onClick={() => handleRowClick(result)}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            
                            {result.screenshots && result.screenshots.length > 0 && (
                              <Tooltip title={`${result.screenshots.length} Screenshots`}>
                                <Badge badgeContent={result.screenshots.length} color="primary">
                                  <IconButton size="small">
                                    <Camera />
                                  </IconButton>
                                </Badge>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredResults.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>

      {renderDetailDialog()}
    </Box>
  );
};

export default ResultViewer;