// src/components/TestRunner/AdvancedTestRunner.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Refresh,
  SmartToy,
  Language,
  PhoneAndroid,
  Speed,
  Assignment,
  ExpandMore,
  CheckCircle,
  Error as ErrorIcon,
  Timer,
  Visibility
} from '@mui/icons-material';
import { advancedAgentService, TaskStatus, Scenario } from '../../services';
import toast from 'react-hot-toast';

interface TestConfiguration {
  testType: 'custom' | 'scenario' | 'cross_browser' | 'responsive' | 'performance';
  agentType: 'web_test' | 'enhanced_test' | 'form_test' | 'performance_test';
  url: string;
  description: string;
  takeScreenshots: boolean;
  selectedScenario?: string;
  browsers: string[];
  viewports: Array<{ width: number; height: number; name: string }>;
  customParameters: Record<string, any>;
}

const AdvancedTestRunner: React.FC = () => {
  const [config, setConfig] = useState<TestConfiguration>({
    testType: 'custom',
    agentType: 'enhanced_test',
    url: '',
    description: '',
    takeScreenshots: true,
    browsers: ['chromium'],
    viewports: [
      { width: 1920, height: 1080, name: 'Desktop Large' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ],
    customParameters: {}
  });

  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [currentTask, setCurrentTask] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const steps = ['Configure Test', 'Select Options', 'Execute', 'Results'];

  useEffect(() => {
    loadScenarios();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (currentTask && isRunning) {
      interval = setInterval(async () => {
        try {
          const status = await advancedAgentService.getTaskStatus(currentTask);
          setTaskStatus(status);
          
          if (status.status === 'completed' || status.status === 'failed' || status.status === 'cancelled') {
            setIsRunning(false);
            setActiveStep(3);
            
            if (status.status === 'completed') {
              toast.success('Test completed successfully!');
            } else if (status.status === 'failed') {
              toast.error('Test failed - check results for details');
            }
          }
        } catch (error) {
          console.error('Error polling task status:', error);
        }
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentTask, isRunning]);

  const loadScenarios = async () => {
    try {
      const scenarioList = await advancedAgentService.getScenarios();
      setScenarios(scenarioList);
    } catch (error) {
      console.error('Failed to load scenarios:', error);
      toast.error('Failed to load scenarios');
    }
  };

  const validateConfiguration = (): boolean => {
    if (!config.url.trim()) {
      toast.error('URL is required');
      return false;
    }

    if (!config.url.startsWith('http://') && !config.url.startsWith('https://')) {
      toast.error('URL must start with http:// or https://');
      return false;
    }

    if (config.testType === 'scenario' && !config.selectedScenario) {
      toast.error('Please select a scenario');
      return false;
    }

    if (!config.description.trim()) {
      toast.error('Test description is required');
      return false;
    }

    return true;
  };

  const executeTest = async () => {
    if (!validateConfiguration()) return;

    setIsRunning(true);
    setActiveStep(2);
    setTaskStatus(null);

    try {
      let response;

      switch (config.testType) {
        case 'scenario':
          if (config.selectedScenario) {
            const scenarioResponse = await advancedAgentService.runScenario(
              config.selectedScenario,
              {
                url: config.url,
                take_screenshots: config.takeScreenshots,
                ...config.customParameters
              }
            );
            response = { task_id: scenarioResponse.task_id };
          }
          break;

        case 'cross_browser':
          response = await advancedAgentService.submitCrossBrowserTest(
            config.url,
            config.description,
            config.browsers
          );
          break;

        case 'responsive':
          response = await advancedAgentService.submitResponsiveTest(
            config.url,
            config.viewports
          );
          break;

        case 'performance':
          response = await advancedAgentService.submitPerformanceTest(config.url);
          break;

        default:
          // Custom test
          if (config.agentType === 'enhanced_test') {
            response = await advancedAgentService.submitEnhancedTest(
              config.url,
              config.description,
              config.takeScreenshots
            );
          } else if (config.agentType === 'web_test') {
            response = await advancedAgentService.submitWebTest(
              config.url,
              [config.description]
            );
          } else if (config.agentType === 'form_test') {
            response = await advancedAgentService.submitFormTest(config.url);
          } else {
            response = await advancedAgentService.submitTask(
              config.agentType,
              config.description,
              {
                url: config.url,
                take_screenshots: config.takeScreenshots,
                ...config.customParameters
              }
            );
          }
      }

      if (response) {
        setCurrentTask(response.task_id);
        toast.success('Test started successfully!');
      }
    } catch (error) {
      console.error('Failed to start test:', error);
      toast.error('Failed to start test');
      setIsRunning(false);
      setActiveStep(1);
    }
  };

  const cancelTest = async () => {
    if (currentTask) {
      try {
        await advancedAgentService.cancelTask(currentTask);
        setIsRunning(false);
        setCurrentTask(null);
        setTaskStatus(null);
        setActiveStep(1);
        toast.success('Test cancelled');
      } catch (error) {
        console.error('Failed to cancel test:', error);
        toast.error('Failed to cancel test');
      }
    }
  };

  const resetTest = () => {
    setCurrentTask(null);
    setTaskStatus(null);
    setIsRunning(false);
    setActiveStep(0);
    setShowResults(false);
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ display: 'grid', gap: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Test Type</InputLabel>
              <Select
                value={config.testType}
                onChange={(e) => setConfig({...config, testType: e.target.value as any})}
                label="Test Type"
              >
                <MenuItem value="custom">Custom Test</MenuItem>
                <MenuItem value="scenario">Scenario-based Test</MenuItem>
                <MenuItem value="cross_browser">Cross-browser Test</MenuItem>
                <MenuItem value="responsive">Responsive Design Test</MenuItem>
                <MenuItem value="performance">Performance Test</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 2 }}>
              <TextField
                fullWidth
                label="Website URL"
                value={config.url}
                onChange={(e) => setConfig({...config, url: e.target.value})}
                placeholder="https://example.com"
              />

              <FormControl fullWidth>
                <InputLabel>Agent Type</InputLabel>
                <Select
                  value={config.agentType}
                  onChange={(e) => setConfig({...config, agentType: e.target.value as any})}
                  label="Agent Type"
                >
                  <MenuItem value="web_test">Web Test Agent</MenuItem>
                  <MenuItem value="enhanced_test">Enhanced Test Agent</MenuItem>
                  <MenuItem value="form_test">Form Test Agent</MenuItem>
                  <MenuItem value="performance_test">Performance Test Agent</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Test Description"
              value={config.description}
              onChange={(e) => setConfig({...config, description: e.target.value})}
              placeholder="Describe what this test should accomplish..."
            />

            {config.testType === 'scenario' && (
              <FormControl fullWidth>
                <InputLabel>Select Scenario</InputLabel>
                <Select
                  value={config.selectedScenario || ''}
                  onChange={(e) => setConfig({...config, selectedScenario: e.target.value})}
                  label="Select Scenario"
                >
                  {scenarios.map((scenario) => (
                    <MenuItem key={scenario.id} value={scenario.id}>
                      <Box>
                        <Typography variant="subtitle2">{scenario.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {scenario.description} ({scenario.actions_count} actions)
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        );

      case 1:
        return (
          <Box sx={{ display: 'grid', gap: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.takeScreenshots}
                  onChange={(e) => setConfig({...config, takeScreenshots: e.target.checked})}
                />
              }
              label="Take Screenshots"
            />

            {config.testType === 'cross_browser' && (
              <Box>
                <Typography variant="h6" gutterBottom>Browser Selection</Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {['chromium', 'firefox', 'webkit'].map((browser) => (
                    <Chip
                      key={browser}
                      label={browser}
                      clickable
                      color={config.browsers.includes(browser) ? 'primary' : 'default'}
                      onClick={() => {
                        const browsers = config.browsers.includes(browser)
                          ? config.browsers.filter(b => b !== browser)
                          : [...config.browsers, browser];
                        setConfig({...config, browsers});
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {config.testType === 'responsive' && (
              <Box>
                <Typography variant="h6" gutterBottom>Viewport Sizes</Typography>
                <List>
                  {config.viewports.map((viewport, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <PhoneAndroid />
                      </ListItemIcon>
                      <ListItemText 
                        primary={viewport.name}
                        secondary={`${viewport.width}x${viewport.height}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        );

      case 2:
        return (
          <Box textAlign="center">
            {isRunning ? (
              <Box>
                <CircularProgress size={60} sx={{ mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  AI Agent is executing your test...
                </Typography>
                
                {taskStatus && (
                  <Box sx={{ mt: 2 }}>
                    <Chip 
                      label={taskStatus.status}
                      color={advancedAgentService.getStatusColor(taskStatus.status)}
                      sx={{ mb: 1 }}
                    />
                    
                    {taskStatus.started_at && (
                      <Typography variant="body2" color="text.secondary">
                        Started: {new Date(taskStatus.started_at).toLocaleTimeString()}
                      </Typography>
                    )}
                  </Box>
                )}

                <Button 
                  variant="outlined" 
                  color="error" 
                  onClick={cancelTest}
                  sx={{ mt: 2 }}
                >
                  Cancel Test
                </Button>
              </Box>
            ) : (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Ready to Execute Test
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Review your configuration and click "Run Test" to start execution.
                </Typography>
              </Box>
            )}
          </Box>
        );

      case 3:
        return (
          <Box>
            {taskStatus ? (
              <Box>
                <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={2}>
                  {taskStatus.status === 'completed' ? (
                    <CheckCircle color="success" sx={{ fontSize: 40 }} />
                  ) : (
                    <ErrorIcon color="error" sx={{ fontSize: 40 }} />
                  )}
                  <Typography variant="h5">
                    Test {taskStatus.status === 'completed' ? 'Completed' : 'Failed'}
                  </Typography>
                </Box>

                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                      <Box>
                        <Typography variant="subtitle2">Execution Time</Typography>
                        <Typography variant="body1">
                          <Timer fontSize="small" sx={{ mr: 1 }} />
                          {advancedAgentService.formatExecutionTime(taskStatus.execution_time)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2">Agent Type</Typography>
                        <Typography variant="body1">
                          <SmartToy fontSize="small" sx={{ mr: 1 }} />
                          {advancedAgentService.getAgentTypeName(config.agentType)}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="subtitle2" gutterBottom>Test Result</Typography>
                    {taskStatus.result ? (
                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Typography>View Detailed Results</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>
                            {JSON.stringify(taskStatus.result, null, 2)}
                          </pre>
                        </AccordionDetails>
                      </Accordion>
                    ) : taskStatus.error ? (
                      <Alert severity="error">
                        {taskStatus.error}
                      </Alert>
                    ) : (
                      <Typography variant="body2">No detailed results available</Typography>
                    )}
                  </CardContent>
                </Card>
              </Box>
            ) : (
              <Typography variant="body1">No results available</Typography>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        🧪 Advanced AI Test Runner
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Execute sophisticated tests with cross-browser, responsive, and performance capabilities
      </Typography>

      <Card>
        <CardContent>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box sx={{ minHeight: 400 }}>
            {renderStepContent(activeStep)}
          </Box>

          <Box display="flex" justifyContent="space-between" mt={4}>
            <Button
              disabled={activeStep === 0 || isRunning}
              onClick={() => setActiveStep(activeStep - 1)}
            >
              Back
            </Button>
            
            <Box display="flex" gap={1}>
              {activeStep < steps.length - 1 ? (
                activeStep === 1 ? (
                  <Button
                    variant="contained"
                    startIcon={isRunning ? <Stop /> : <PlayArrow />}
                    onClick={executeTest}
                    disabled={isRunning}
                  >
                    {isRunning ? 'Running...' : 'Run Test'}
                  </Button>
                ) : (
                  <Button 
                    variant="contained" 
                    onClick={() => setActiveStep(activeStep + 1)}
                    disabled={isRunning}
                  >
                    Next
                  </Button>
                )
              ) : (
                <Button 
                  variant="outlined" 
                  startIcon={<Refresh />}
                  onClick={resetTest}
                >
                  New Test
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdvancedTestRunner;