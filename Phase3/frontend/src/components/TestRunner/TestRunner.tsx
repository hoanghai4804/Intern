// src/components/TestRunner/TestRunner.tsx
import React, { useState } from 'react';
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
  IconButton,
  Tooltip
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Add,
  Delete,
  Info,
  CheckCircle,
  Error as ErrorIcon,
  Timer
} from '@mui/icons-material';
import { TestCase, TestResult } from '../../types';
import toast from 'react-hot-toast';
import { formatDuration, isValidUrl } from '../../utils';

const TestRunner: React.FC = () => {
  const [testCase, setTestCase] = useState<Partial<TestCase>>({
    name: '',
    description: '',
    url: '',
    test_type: 'functional',
    actions: [''],
    elements_to_check: [''],
    expected_results: ['']
  });

  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps = ['Configure Test', 'Define Actions', 'Review & Run', 'Results'];

  // Validation
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0: // Configure Test
        if (!testCase.name?.trim()) newErrors.name = 'Test name is required';
        if (!testCase.url?.trim()) newErrors.url = 'URL is required';
        else if (!isValidUrl(testCase.url)) newErrors.url = 'Invalid URL format';
        break;
      
      case 1: // Define Actions
        if (testCase.test_type === 'functional') {
          if (!testCase.actions?.some(action => action.trim())) {
            newErrors.actions = 'At least one action is required';
          }
        } else if (testCase.test_type === 'ui') {
          if (!testCase.elements_to_check?.some(element => element.trim())) {
            newErrors.elements = 'At least one UI element is required';
          }
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle step navigation
  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // Handle dynamic arrays
  const addArrayItem = (field: 'actions' | 'elements_to_check' | 'expected_results') => {
    setTestCase(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), '']
    }));
  };

  const updateArrayItem = (field: 'actions' | 'elements_to_check' | 'expected_results', index: number, value: string) => {
    setTestCase(prev => ({
      ...prev,
      [field]: prev[field]?.map((item, i) => i === index ? value : item) || []
    }));
  };

  const removeArrayItem = (field: 'actions' | 'elements_to_check' | 'expected_results', index: number) => {
    setTestCase(prev => ({
      ...prev,
      [field]: prev[field]?.filter((_, i) => i !== index) || []
    }));
  };

  // Run test
  const handleRunTest = async () => {
    if (!validateStep(2)) return;

    setIsRunning(true);
    setActiveStep(3);
    
    try {
      // Mock test execution for now
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockResult: TestResult = {
        id: `test-${Date.now()}`,
        test_case_id: testCase.name || 'unnamed',
        status: Math.random() > 0.3 ? 'success' : 'error',
        result: {
          message: 'Test completed',
          actions_performed: testCase.actions?.filter(a => a.trim()) || [],
          screenshots: ['screenshot1.png', 'screenshot2.png'],
          execution_details: 'AI agent successfully navigated and performed all actions'
        },
        execution_time: Math.random() * 30000 + 5000,
        timestamp: new Date()
      };

      setResult(mockResult);
      
      if (mockResult.status === 'success') {
        toast.success('Test completed successfully!');
      } else {
        toast.error('Test failed - check results for details');
      }
    } catch (error) {
      toast.error('Failed to run test');
      console.error('Test execution error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ display: 'grid', gap: 3 }}>
            <TextField
              fullWidth
              label="Test Name"
              value={testCase.name || ''}
              onChange={(e) => setTestCase({...testCase, name: e.target.value})}
              error={!!errors.name}
              helperText={errors.name}
              placeholder="e.g., Login Functionality Test"
            />
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={testCase.description || ''}
              onChange={(e) => setTestCase({...testCase, description: e.target.value})}
              placeholder="Describe what this test will verify..."
            />
            
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
              <TextField
                fullWidth
                label="Website URL"
                value={testCase.url || ''}
                onChange={(e) => setTestCase({...testCase, url: e.target.value})}
                error={!!errors.url}
                helperText={errors.url}
                placeholder="https://example.com"
              />
              
              <FormControl fullWidth>
                <InputLabel>Test Type</InputLabel>
                <Select
                  value={testCase.test_type || 'functional'}
                  onChange={(e) => setTestCase({...testCase, test_type: e.target.value as any})}
                  label="Test Type"
                >
                  <MenuItem value="functional">Functional Test</MenuItem>
                  <MenuItem value="ui">UI Test</MenuItem>
                  <MenuItem value="custom">Custom Test</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        );

      case 1:
        return (
          <Box>
            {testCase.test_type === 'functional' && (
              <Box>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Typography variant="h6">Test Actions</Typography>
                  <Tooltip title="Define the sequence of actions the AI agent will perform">
                    <Info fontSize="small" color="action" />
                  </Tooltip>
                </Box>
                
                {testCase.actions?.map((action, index) => (
                  <Box key={index} display="flex" gap={1} mb={2}>
                    <TextField
                      fullWidth
                      label={`Action ${index + 1}`}
                      value={action}
                      onChange={(e) => updateArrayItem('actions', index, e.target.value)}
                      placeholder="e.g., Click login button, Enter username, etc."
                    />
                    <IconButton 
                      onClick={() => removeArrayItem('actions', index)}
                      disabled={testCase.actions?.length === 1}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                ))}
                
                <Button startIcon={<Add />} onClick={() => addArrayItem('actions')}>
                  Add Action
                </Button>
                
                {errors.actions && (
                  <Alert severity="error" sx={{ mt: 2 }}>{errors.actions}</Alert>
                )}
              </Box>
            )}

            {testCase.test_type === 'ui' && (
              <Box>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Typography variant="h6">UI Elements to Check</Typography>
                  <Tooltip title="Specify UI elements the AI should verify exist and function properly">
                    <Info fontSize="small" color="action" />
                  </Tooltip>
                </Box>
                
                {testCase.elements_to_check?.map((element, index) => (
                  <Box key={index} display="flex" gap={1} mb={2}>
                    <TextField
                      fullWidth
                      label={`Element ${index + 1}`}
                      value={element}
                      onChange={(e) => updateArrayItem('elements_to_check', index, e.target.value)}
                      placeholder="e.g., Header navigation, Search button, Footer links"
                    />
                    <IconButton 
                      onClick={() => removeArrayItem('elements_to_check', index)}
                      disabled={testCase.elements_to_check?.length === 1}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                ))}
                
                <Button startIcon={<Add />} onClick={() => addArrayItem('elements_to_check')}>
                  Add Element
                </Button>
                
                {errors.elements && (
                  <Alert severity="error" sx={{ mt: 2 }}>{errors.elements}</Alert>
                )}
              </Box>
            )}

            {testCase.test_type === 'custom' && (
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Custom Test Instructions"
                value={testCase.custom_task || ''}
                onChange={(e) => setTestCase({...testCase, custom_task: e.target.value})}
                placeholder="Provide detailed instructions for the AI agent..."
              />
            )}
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Test Configuration Review</Typography>
            
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold">
                  {testCase.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {testCase.description}
                </Typography>
                
                <Box display="flex" gap={1} mb={2}>
                  <Chip label={testCase.test_type} color="primary" size="small" />
                  <Chip label={testCase.url} variant="outlined" size="small" />
                </Box>

                {testCase.test_type === 'functional' && testCase.actions && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>Actions:</Typography>
                    {testCase.actions.filter(a => a.trim()).map((action, index) => (
                      <Typography key={index} variant="body2">• {action}</Typography>
                    ))}
                  </Box>
                )}

                {testCase.test_type === 'ui' && testCase.elements_to_check && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>UI Elements:</Typography>
                    {testCase.elements_to_check.filter(e => e.trim()).map((element, index) => (
                      <Typography key={index} variant="body2">• {element}</Typography>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>

            <Alert severity="info">
              The AI agent will use Browser Use and Playwright to execute this test automatically.
              Click "Run Test" to start the execution.
            </Alert>
          </Box>
        );

      case 3:
        return (
          <Box textAlign="center">
            {isRunning ? (
              <Box>
                <CircularProgress size={60} sx={{ mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  AI Agent is running your test...
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This may take a few moments while the agent navigates and performs actions.
                </Typography>
              </Box>
            ) : result ? (
              <Box>
                <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={2}>
                  {result.status === 'success' ? (
                    <CheckCircle color="success" sx={{ fontSize: 40 }} />
                  ) : (
                    <ErrorIcon color="error" sx={{ fontSize: 40 }} />
                  )}
                  <Typography variant="h5">
                    Test {result.status === 'success' ? 'Completed Successfully' : 'Failed'}
                  </Typography>
                </Box>

                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                      <Box>
                        <Typography variant="subtitle2">Execution Time</Typography>
                        <Typography variant="body1">
                          <Timer fontSize="small" sx={{ mr: 1 }} />
                          {result.execution_time ? formatDuration(result.execution_time) : 'N/A'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2">Screenshots</Typography>
                        <Typography variant="body1">
                          {result.screenshots?.length || 0} captured
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="subtitle2" gutterBottom>Result Details</Typography>
                    <Typography variant="body2">
                      {result.result.execution_details || result.result.message}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            ) : null}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        🧪 AI Test Runner
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Create and execute automated tests using AI-powered browser automation
      </Typography>

      <Card>
        <CardContent>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
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
              disabled={activeStep === 0}
              onClick={handleBack}
            >
              Back
            </Button>
            
            <Box display="flex" gap={1}>
              {activeStep === steps.length - 2 ? (
                <Button
                  variant="contained"
                  startIcon={isRunning ? <Stop /> : <PlayArrow />}
                  onClick={handleRunTest}
                  disabled={isRunning}
                >
                  {isRunning ? 'Running...' : 'Run Test'}
                </Button>
              ) : activeStep < steps.length - 1 ? (
                <Button variant="contained" onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <Button 
                  variant="outlined" 
                  onClick={() => {
                    setActiveStep(0);
                    setResult(null);
                    setTestCase({
                      name: '',
                      description: '',
                      url: '',
                      test_type: 'functional',
                      actions: [''],
                      elements_to_check: [''],
                      expected_results: ['']
                    });
                  }}
                >
                  Create New Test
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TestRunner;