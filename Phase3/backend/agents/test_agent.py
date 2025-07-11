# backend/agents/test_agent.py
import asyncio
from typing import Dict, Any, List
from datetime import datetime
from .base_agent import BaseTestAgent
import logging

# Use the same logger setup as base_agent
logger = logging.getLogger(__name__)

class WebTestAgent(BaseTestAgent):
    """Agent chuyên cho web testing"""
    
    # System prompts for different testing scenarios
    WEB_TEST_SYSTEM_PROMPT = """
    You are a comprehensive web testing expert. Your role:
    - Perform thorough functionality testing of websites
    - Test user interactions and navigation flows
    - Verify page elements and user interface components
    - Check for broken links and missing resources
    - Validate page load times and responsiveness
    - Document any issues found with clear descriptions
    - Focus on user experience and usability
    """
    
    UI_TEST_SYSTEM_PROMPT = """
    You are a UI/UX testing specialist. Your expertise:
    - Test visual consistency and design compliance
    - Verify accessibility standards (WCAG guidelines)
    - Check interactive elements and user interactions
    - Validate responsive design across different screen sizes
    - Test color contrast and typography readability
    - Ensure proper labeling and alt text for images
    - Focus on user interface optimization and usability
    """
    
    FORM_TEST_SYSTEM_PROMPT = """
    You are a form testing specialist. Your expertise:
    - Test form validation and user input handling
    - Verify error messages and validation feedback
    - Test edge cases and boundary conditions
    - Check accessibility compliance for form elements
    - Validate form submission and data processing
    - Test form reset and clear functionality
    - Focus on security vulnerabilities in form handling
    - Ensure proper field labeling and help text
    """
    
    async def execute_task(self, task: str) -> Dict[str, Any]:
        """Thực thi testing task"""
        start_time = datetime.now()
        
        try:
            agent = await self.create_agent(task)
            logger.info("Agent created, starting execution...")
            
            result = await agent.run()
            
            execution_time = (datetime.now() - start_time).total_seconds()
            
            self.last_result = {
                "status": "success",
                "result": result,
                "task": task,
                "execution_time": execution_time,
                "timestamp": start_time.isoformat(),
                "model_used": self.model
            }
            
            logger.info(f"Task completed successfully in {execution_time:.2f} seconds")
            return self.last_result
            
        except Exception as e:
            execution_time = (datetime.now() - start_time).total_seconds()
            logger.error(f"Task execution failed: {e}")
            
            self.last_result = {
                "status": "error",
                "error": str(e),
                "task": task,
                "execution_time": execution_time,
                "timestamp": start_time.isoformat(),
                "model_used": self.model
            }
            
            return self.last_result
    
    async def test_website_functionality(self, url: str, actions: List[str]) -> Dict[str, Any]:
        """Test chức năng website với system prompt chuyên biệt"""
        logger.info(f"Starting website functionality test for: {url}")
        task = f"""
        Navigate to {url} and perform comprehensive testing:
        
        Actions to perform:
        {chr(10).join(f"- {action}" for action in actions)}
        
        For each action:
        1. Verify the action can be completed
        2. Check for any error messages
        3. Validate expected outcomes
        4. Take note of page load times
        
        Provide detailed feedback on what works and what doesn't.
        """
        
        # Use specialized system prompt for web testing
        agent = await self.create_agent(task, system_prompt=self.WEB_TEST_SYSTEM_PROMPT)
        
        start_time = datetime.now()
        result = await agent.run()
        execution_time = (datetime.now() - start_time).total_seconds()
        
        return {
            "status": "success",
            "result": result,
            "task": task,
            "execution_time": execution_time,
            "timestamp": start_time.isoformat(),
            "model_used": self.model,
            "agent_type": "web_test"
        }
    
    async def test_ui_elements(self, url: str, elements: List[str]) -> Dict[str, Any]:
        """Test UI elements và accessibility với system prompt chuyên biệt"""
        logger.info(f"Starting UI elements test for: {url}")
        task = f"""
        Navigate to {url} and perform UI testing:
        
        Elements to check:
        {chr(10).join(f"- {element}" for element in elements)}
        
        For each element:
        1. Verify it exists and is visible
        2. Check if it's clickable/interactive
        3. Test accessibility (alt text, labels, etc.)
        4. Verify styling and positioning
        
        Report any UI issues or accessibility problems found.
        """
        
        # Use specialized system prompt for UI testing
        agent = await self.create_agent(task, system_prompt=self.UI_TEST_SYSTEM_PROMPT)
        
        start_time = datetime.now()
        result = await agent.run()
        execution_time = (datetime.now() - start_time).total_seconds()
        
        return {
            "status": "success",
            "result": result,
            "task": task,
            "execution_time": execution_time,
            "timestamp": start_time.isoformat(),
            "model_used": self.model,
            "agent_type": "ui_test"
        }

    async def test_form_validation(self, url: str, form_selector: str = None) -> Dict[str, Any]:
        """Test form validation với system prompt chuyên biệt"""
        logger.info(f"Starting form validation test for: {url}")
        task = f"""
        Navigate to {url} and test form validation:
        
        1. Find the main form on the page {f'(selector: {form_selector})' if form_selector else ''}
        2. Test with valid data - verify submission works
        3. Test with invalid data:
           - Empty required fields
           - Invalid email formats
           - Invalid phone numbers
           - Out-of-range values
        4. Check error messages are displayed properly
        5. Verify form resets correctly
        
        Document all validation behavior and any issues found.
        """
        
        # Use specialized system prompt for form testing
        agent = await self.create_agent(task, system_prompt=self.FORM_TEST_SYSTEM_PROMPT)
        
        start_time = datetime.now()
        result = await agent.run()
        execution_time = (datetime.now() - start_time).total_seconds()
        
        return {
            "status": "success",
            "result": result,
            "task": task,
            "execution_time": execution_time,
            "timestamp": start_time.isoformat(),
            "model_used": self.model,
            "agent_type": "form_test"
        }