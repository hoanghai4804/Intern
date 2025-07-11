# backend/agents/agent_manager.py
import asyncio
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
from enum import Enum
from dataclasses import dataclass
import uuid

from .test_agent import WebTestAgent
from .enhanced_test_agent import EnhancedTestAgent
from ..utils.config import Config

logger = logging.getLogger(__name__)

class AgentType(Enum):
    WEB_TEST = "web_test"
    ENHANCED_TEST = "enhanced_test"
    FORM_TEST = "form_test"
    API_TEST = "api_test"
    PERFORMANCE_TEST = "performance_test"

class TaskStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

@dataclass
class AgentTask:
    id: str
    agent_type: AgentType
    task_description: str
    parameters: Dict[str, Any]
    status: TaskStatus = TaskStatus.PENDING
    created_at: datetime = datetime.now()
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    retry_count: int = 0
    max_retries: int = 3

class AgentManager:
    """Orchestrator cho multiple AI agents"""
    
    def __init__(self, max_concurrent_agents: int = 3):
        self.max_concurrent_agents = max_concurrent_agents
        self.active_agents: Dict[str, Any] = {}
        self.task_queue: List[AgentTask] = []
        self.completed_tasks: List[AgentTask] = []
        self.task_history: Dict[str, AgentTask] = {}
        
        # Agent factories
        self.agent_factories = {
            AgentType.WEB_TEST: lambda: WebTestAgent(),
            AgentType.ENHANCED_TEST: lambda: EnhancedTestAgent(),
            AgentType.FORM_TEST: lambda: WebTestAgent(),
            AgentType.API_TEST: lambda: WebTestAgent(),
            AgentType.PERFORMANCE_TEST: lambda: EnhancedTestAgent()
        }
        
    async def submit_task(self, 
                         agent_type: AgentType, 
                         task_description: str, 
                         parameters: Dict[str, Any] = None) -> str:
        """Submit new task to queue"""
        
        task_id = str(uuid.uuid4())
        task = AgentTask(
            id=task_id,
            agent_type=agent_type,
            task_description=task_description,
            parameters=parameters or {}
        )
        
        self.task_queue.append(task)
        self.task_history[task_id] = task
        
        logger.info(f"Task submitted: {task_id} - {agent_type.value}")
        
        # Auto-start processing if capacity available
        asyncio.create_task(self._process_queue())
        
        return task_id
    
    async def _process_queue(self):
        """Process tasks in queue"""
        
        while (self.task_queue and 
               len(self.active_agents) < self.max_concurrent_agents):
            
            task = self.task_queue.pop(0)
            
            # Start task processing
            asyncio.create_task(self._execute_task(task))
    
    async def _execute_task(self, task: AgentTask):
        """Execute single task"""
        
        task.status = TaskStatus.RUNNING
        task.started_at = datetime.now()
        
        try:
            # Create agent
            agent = self.agent_factories[task.agent_type]()
            self.active_agents[task.id] = agent
            
            logger.info(f"Starting task execution: {task.id}")
            
            # Execute task based on type
            if task.agent_type == AgentType.WEB_TEST:
                result = await self._execute_web_test(agent, task)
            elif task.agent_type == AgentType.ENHANCED_TEST:
                result = await self._execute_enhanced_test(agent, task)
            elif task.agent_type == AgentType.FORM_TEST:
                result = await self._execute_form_test(agent, task)
            elif task.agent_type == AgentType.PERFORMANCE_TEST:
                result = await self._execute_performance_test(agent, task)
            else:
                result = await agent.execute_task(task.task_description)
            
            # Task completed successfully
            task.result = result
            task.status = TaskStatus.COMPLETED
            task.completed_at = datetime.now()
            
            logger.info(f"Task completed successfully: {task.id}")
            
        except Exception as e:
            # Task failed
            task.error = str(e)
            task.status = TaskStatus.FAILED
            task.completed_at = datetime.now()
            
            logger.error(f"Task failed: {task.id} - {e}")
            
            # Retry logic
            if task.retry_count < task.max_retries:
                task.retry_count += 1
                task.status = TaskStatus.PENDING
                self.task_queue.append(task)
                logger.info(f"Task queued for retry {task.retry_count}: {task.id}")
        
        finally:
            # Cleanup
            if task.id in self.active_agents:
                del self.active_agents[task.id]
            
            if task.status in [TaskStatus.COMPLETED, TaskStatus.FAILED]:
                self.completed_tasks.append(task)
            
            # Continue processing queue
            await self._process_queue()
    
    async def _execute_web_test(self, agent: WebTestAgent, task: AgentTask) -> Dict[str, Any]:
        """Execute web test task"""
        url = task.parameters.get("url")
        actions = task.parameters.get("actions", [])
        
        if url and actions:
            return await agent.test_website_functionality(url, actions)
        else:
            return await agent.execute_task(task.task_description)
    
    async def _execute_enhanced_test(self, agent: EnhancedTestAgent, task: AgentTask) -> Dict[str, Any]:
        """Execute enhanced test task"""
        url = task.parameters.get("url")
        take_screenshots = task.parameters.get("take_screenshots", True)
        
        if url:
            return await agent.execute_task_with_screenshots(
                task.task_description, 
                take_screenshots
            )
        else:
            return await agent.execute_task(task.task_description)
    
    async def _execute_form_test(self, agent: WebTestAgent, task: AgentTask) -> Dict[str, Any]:
        """Execute form test task"""
        url = task.parameters.get("url")
        form_selector = task.parameters.get("form_selector")
        
        if url:
            return await agent.test_form_validation(url, form_selector)
        else:
            return await agent.execute_task(task.task_description)
    
    async def _execute_performance_test(self, agent: EnhancedTestAgent, task: AgentTask) -> Dict[str, Any]:
        """Execute performance test task"""
        url = task.parameters.get("url")
        
        if url:
            performance_task = f"""
            Navigate to {url} and perform comprehensive performance testing:
            
            Performance metrics to check:
            1. Page load time (aim for < 3 seconds)
            2. Time to first contentful paint
            3. Largest contentful paint
            4. Check for broken images or missing resources
            5. Test navigation speed between pages
            6. Verify page doesn't have excessive JavaScript errors
            7. Check network requests efficiency
            8. Analyze Core Web Vitals (LCP, FID, CLS)
            
            Document any performance issues and loading problems.
            Provide recommendations for improvement if issues found.
            """
            
            return await agent.execute_performance_test(performance_task)
        else:
            return await agent.execute_task(task.task_description)
    
    def get_task_status(self, task_id: str) -> Optional[AgentTask]:
        """Get task status by ID"""
        return self.task_history.get(task_id)
    
    def get_active_tasks(self) -> List[AgentTask]:
        """Get currently running tasks"""
        return [task for task in self.task_history.values() 
                if task.status == TaskStatus.RUNNING]
    
    def get_completed_tasks(self) -> List[AgentTask]:
        """Get completed tasks"""
        return self.completed_tasks
    
    def get_queue_status(self) -> Dict[str, Any]:
        """Get queue status"""
        return {
            "pending_tasks": len(self.task_queue),
            "active_tasks": len(self.active_agents),
            "completed_tasks": len(self.completed_tasks),
            "total_tasks": len(self.task_history),
            "capacity": self.max_concurrent_agents
        }
    
    async def cancel_task(self, task_id: str) -> bool:
        """Cancel running task"""
        task = self.task_history.get(task_id)
        
        if not task:
            return False
        
        if task.status == TaskStatus.PENDING:
            # Remove from queue
            self.task_queue = [t for t in self.task_queue if t.id != task_id]
            task.status = TaskStatus.CANCELLED
            return True
        
        if task.status == TaskStatus.RUNNING:
            # Mark for cancellation (actual stopping depends on agent implementation)
            task.status = TaskStatus.CANCELLED
            return True
        
        return False