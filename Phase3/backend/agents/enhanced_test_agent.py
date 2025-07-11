# backend/agents/enhanced_test_agent.py
import asyncio
import base64
import sys
from pathlib import Path
from typing import Dict, Any, List
from datetime import datetime

# Use relative imports
from .test_agent import WebTestAgent
from ..automation.browser_controller import EnhancedBrowserController

class EnhancedTestAgent(WebTestAgent):
    """Enhanced test agent với screenshot và reporting capabilities"""
    
    # Enhanced system prompts
    ENHANCED_TEST_SYSTEM_PROMPT = """
    You are a comprehensive testing agent with visual documentation capabilities. Your role:
    - Perform thorough testing with visual evidence and screenshots
    - Document UI/UX issues with visual proof
    - Create detailed reports with screenshots at key moments
    - Focus on user experience and visual consistency
    - Test cross-browser compatibility and responsive design
    - Validate performance and loading times
    - Ensure accessibility and usability standards
    - Take screenshots before and after each major action
    """
    
    PERFORMANCE_TEST_SYSTEM_PROMPT = """
    You are a performance testing specialist. Your expertise:
    - Focus on page load times and performance metrics
    - Identify bottlenecks and optimization opportunities
    - Test resource loading and caching mechanisms
    - Monitor network requests and response times
    - Analyze Core Web Vitals (LCP, FID, CLS)
    - Check for excessive JavaScript execution
    - Validate image optimization and compression
    - Test memory usage and CPU utilization
    - Document performance issues with specific metrics
    """
    
    def __init__(self, model: str = None):
        super().__init__(model)
        self.screenshots_dir = Path("screenshots")
        self.reports_dir = Path("reports")
        self.screenshots_dir.mkdir(exist_ok=True)
        self.reports_dir.mkdir(exist_ok=True)
        
    async def execute_task_with_screenshots(self, task: str, take_screenshots: bool = True) -> Dict[str, Any]:
        """Execute task với automatic screenshot capture và system prompt chuyên biệt"""
        
        if take_screenshots:
            screenshot_task = f"""
            {task}
            
            Additional requirements:
            - Take a screenshot at the beginning
            - Take screenshots after each major action
            - Take a final screenshot at the end
            - Save screenshots with descriptive names
            - Document visual changes and UI states
            """
        else:
            screenshot_task = task
            
        # Use specialized system prompt for enhanced testing
        agent = await self.create_agent(screenshot_task, system_prompt=self.ENHANCED_TEST_SYSTEM_PROMPT)
        
        start_time = datetime.now()
        result = await agent.run()
        execution_time = (datetime.now() - start_time).total_seconds()
        
        result_data = {
            "status": "success",
            "result": result,
            "task": task,
            "execution_time": execution_time,
            "timestamp": start_time.isoformat(),
            "model_used": self.model,
            "agent_type": "enhanced_test"
        }
        
        # Add screenshot info to result
        if take_screenshots:
            result_data["screenshots_enabled"] = True
            result_data["screenshots_directory"] = str(self.screenshots_dir)
        
        return result_data
    
    async def execute_performance_test(self, task: str) -> Dict[str, Any]:
        """Execute performance test với system prompt chuyên biệt"""
        
        # Use specialized system prompt for performance testing
        agent = await self.create_agent(task, system_prompt=self.PERFORMANCE_TEST_SYSTEM_PROMPT)
        
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
            "agent_type": "performance_test"
        }
    
    async def generate_test_report(self, test_results: List[Dict[str, Any]], report_name: str = None) -> str:
        """Generate comprehensive HTML test report"""
        
        if report_name is None:
            report_name = f"test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        report_path = self.reports_dir / f"{report_name}.html"
        
        # Generate HTML report
        html_content = self._generate_html_report(test_results)
        
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        print(f"📊 Test report generated: {report_path}")
        return str(report_path)
    
    def _generate_html_report(self, test_results: List[Dict[str, Any]]) -> str:
        """Generate HTML content for test report"""
        
        total_tests = len(test_results)
        passed_tests = sum(1 for r in test_results if r.get("status") == "success")
        success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>AI Agents Test Report</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                .header {{ background: #f0f0f0; padding: 20px; border-radius: 5px; }}
                .summary {{ margin: 20px 0; }}
                .test-result {{ margin: 10px 0; padding: 15px; border-radius: 5px; }}
                .success {{ background: #d4edda; border-left: 5px solid #28a745; }}
                .error {{ background: #f8d7da; border-left: 5px solid #dc3545; }}
                .timestamp {{ color: #666; font-size: 0.9em; }}
                .execution-time {{ font-weight: bold; color: #007bff; }}
                .agent-type {{ color: #6c757d; font-size: 0.9em; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🤖 AI Agents Test Report</h1>
                <p>Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            </div>
            
            <div class="summary">
                <h2>📊 Summary</h2>
                <p><strong>Total Tests:</strong> {total_tests}</p>
                <p><strong>Passed:</strong> {passed_tests}</p>
                <p><strong>Failed:</strong> {total_tests - passed_tests}</p>
                <p><strong>Success Rate:</strong> {success_rate:.1f}%</p>
            </div>
            
            <h2>📝 Test Results</h2>
        """
        
        for i, result in enumerate(test_results, 1):
            status_class = "success" if result.get("status") == "success" else "error"
            execution_time = result.get("execution_time", "N/A")
            agent_type = result.get("agent_type", "Unknown")
            
            html += f"""
            <div class="test-result {status_class}">
                <h3>Test #{i}</h3>
                <p><strong>Status:</strong> {result.get("status", "Unknown")}</p>
                <p><strong>Agent Type:</strong> <span class="agent-type">{agent_type}</span></p>
                <p><strong>Task:</strong> {result.get("task", "N/A")[:200]}...</p>
                <p class="execution-time">Execution Time: {execution_time}s</p>
                <p class="timestamp">Timestamp: {result.get("timestamp", "N/A")}</p>
            """
            
            if result.get("error"):
                html += f"<p><strong>Error:</strong> {result['error']}</p>"
            
            html += "</div>"
        
        html += """
        </body>
        </html>
        """
        
        return html