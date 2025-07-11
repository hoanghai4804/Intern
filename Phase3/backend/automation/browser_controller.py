# backend/automation/browser_controller.py
import asyncio
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from pathlib import Path

from browser_use import Agent
from browser_use.llm import ChatAnthropic
from .mcp_client import PlaywrightMCPClient
from ..utils.config import Config

logger = logging.getLogger(__name__)

class EnhancedBrowserController:
    """Advanced browser controller với MCP support"""
    
    def __init__(self):
        self.mcp_client = PlaywrightMCPClient()
        self.llm = ChatAnthropic(
            model=Config.CLAUDE_MODEL,
            api_key=Config.ANTHROPIC_API_KEY
        )
        self.screenshots_dir = Path("screenshots")
        self.screenshots_dir.mkdir(exist_ok=True)
        
    async def start_mcp_server(self) -> bool:
        """Start MCP server for advanced features"""
        return await self.mcp_client.start_server()
    
    async def stop_mcp_server(self):
        """Stop MCP server"""
        await self.mcp_client.stop_server()
    
    async def run_cross_browser_test(self, 
                                   task: str, 
                                   browsers: List[str] = None) -> Dict[str, Any]:
        """Chạy test trên multiple browsers"""
        if browsers is None:
            browsers = ["chromium", "firefox", "webkit"]
        
        results = {}
        
        for browser in browsers:
            print(f"🌐 Testing on {browser}...")
            
            try:
                # Customize task for specific browser
                browser_task = f"""
                {task}
                
                Additional requirements for {browser} testing:
                - Note any browser-specific behaviors
                - Check for compatibility issues
                - Verify consistent functionality
                - Take screenshot for comparison
                """
                
                agent = Agent(
                    task=browser_task,
                    llm=self.llm
                )
                
                start_time = datetime.now()
                result = await agent.run()
                execution_time = (datetime.now() - start_time).total_seconds()
                
                results[browser] = {
                    "status": "success",
                    "result": result,
                    "execution_time": execution_time,
                    "browser": browser,
                    "timestamp": start_time.isoformat()
                }
                
            except Exception as e:
                logger.error(f"Error testing {browser}: {e}")
                results[browser] = {
                    "status": "error",
                    "error": str(e),
                    "browser": browser,
                    "timestamp": datetime.now().isoformat()
                }
        
        return {
            "cross_browser_results": results,
            "summary": self._generate_cross_browser_summary(results)
        }
    
    async def run_responsive_test(self, url: str, viewports: List[Dict] = None) -> Dict[str, Any]:
        """Test responsive design across different viewport sizes"""
        if viewports is None:
            viewports = [
                {"width": 1920, "height": 1080, "name": "Desktop Large"},
                {"width": 1366, "height": 768, "name": "Desktop Medium"},
                {"width": 768, "height": 1024, "name": "Tablet"},
                {"width": 375, "height": 667, "name": "Mobile"}
            ]
        
        task = f"""
        Navigate to {url} and perform responsive design testing.
        
        Test requirements:
        1. Check layout adapts properly to different screen sizes
        2. Verify navigation menu works on mobile
        3. Ensure text is readable at all sizes
        4. Check that buttons and links are clickable
        5. Verify images scale appropriately
        6. Test horizontal scrolling (should be minimal)
        
        Take screenshots at each viewport size for comparison.
        Document any responsive design issues found.
        """
        
        agent = Agent(task=task, llm=self.llm)
        
        try:
            result = await agent.run()
            
            return {
                "status": "success",
                "result": result,
                "viewports_tested": viewports,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                "status": "error", 
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    async def run_performance_test(self, url: str) -> Dict[str, Any]:
        """Test website performance và loading"""
        task = f"""
        Navigate to {url} and perform comprehensive performance testing:
        
        Performance metrics to check:
        1. Page load time (aim for < 3 seconds)
        2. Time to first contentful paint
        3. Largest contentful paint
        4. Check for broken images or missing resources
        5. Test navigation speed between pages
        6. Verify page doesn't have excessive JavaScript errors
        7. Check network requests efficiency
        
        Document any performance issues and loading problems.
        Provide recommendations for improvement if issues found.
        """
        
        agent = Agent(task=task, llm=self.llm)
        
        try:
            start_time = datetime.now()
            result = await agent.run()
            total_execution_time = (datetime.now() - start_time).total_seconds()
            
            return {
                "status": "success",
                "result": result,
                "test_execution_time": total_execution_time,
                "url": url,
                "timestamp": start_time.isoformat()
            }
            
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "url": url,
                "timestamp": datetime.now().isoformat()
            }
    
    def _generate_cross_browser_summary(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate summary of cross-browser test results"""
        total_tests = len(results)
        successful_tests = sum(1 for r in results.values() if r.get("status") == "success")
        
        return {
            "total_browsers_tested": total_tests,
            "successful_tests": successful_tests,
            "success_rate": (successful_tests / total_tests) * 100 if total_tests > 0 else 0,
            "browsers_tested": list(results.keys()),
            "failed_browsers": [browser for browser, result in results.items() 
                              if result.get("status") == "error"]
        }

    async def __aenter__(self):
        """Async context manager entry"""
        await self.start_mcp_server()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self.stop_mcp_server()