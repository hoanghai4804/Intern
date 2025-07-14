# backend/agents/agent_manager.py
import asyncio
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from enum import Enum
import uuid

from .test_agent import WebTestAgent
from .enhanced_test_agent import EnhancedTestAgent
from ..database.model import Database, TestResultRepository

logger = logging.getLogger(__name__)

class TaskStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

class AgentType(Enum):
    WEB_TEST = "web_test"
    ENHANCED_TEST = "enhanced_test"
    FORM_TEST = "form_test"
    PERFORMANCE_TEST = "performance_test"

class AgentTask:
    def __init__(self, 
                 agent_type: AgentType,
                 task_description: str,
                 parameters: Dict[str, Any] = None,
                 task_id: str = None):
        self.id = task_id or str(uuid.uuid4())
        self.agent_type = agent_type
        self.task_description = task_description
        self.parameters = parameters or {}
        self.status = TaskStatus.PENDING
        self.created_at = datetime.now()
        self.started_at = None
        self.completed_at = None
        self.result = None
        self.error = None
        self.retry_count = 0
        self.max_retries = 3
        self.execution_id = None
        self.execution_time = None  # Add execution_time attribute

class AgentManager:
    """Manager để quản lý và thực thi các AI agents với database persistence"""
    
    def __init__(self, max_concurrent_agents: int = 3):
        self.max_concurrent_agents = max_concurrent_agents
        self.task_queue = []
        self.active_agents = {}
        self.completed_tasks = []
        self.task_history = {}
        
        # Agent factories
        self.agent_factories = {
            AgentType.WEB_TEST: WebTestAgent,
            AgentType.ENHANCED_TEST: EnhancedTestAgent,
            AgentType.FORM_TEST: WebTestAgent,
            AgentType.PERFORMANCE_TEST: EnhancedTestAgent
        }
        
        # Database integration
        self.database = Database()
        self.test_repo = TestResultRepository(self.database)
        
        # Background task processor
        self._processor_task = None
        self._running = False
        
        # Task timeout settings
        self.task_timeout = 300  # 5 minutes timeout
        self._cleanup_task = None
        
        # Load existing tasks from database on startup
        self._load_tasks_from_database()
        
        logger.info(f"Agent Manager initialized with {max_concurrent_agents} max concurrent agents")
    
    def _load_tasks_from_database(self):
        """Load existing tasks from database on startup"""
        try:
            logger.info("Loading tasks from database...")
            
            # Load recent executions from database
            recent_executions = self.test_repo.get_recent_executions(100)  # Load last 100 executions
            
            for execution in recent_executions:
                # Create task object from execution data
                task = AgentTask(
                    agent_type=AgentType(execution.agent_type),
                    task_description=f"Task from execution {execution.id}",
                    task_id=execution.id  # Use execution ID as task ID
                )
                
                # Set task status based on execution status
                if execution.status == "completed":
                    task.status = TaskStatus.COMPLETED
                elif execution.status == "failed":
                    task.status = TaskStatus.FAILED
                elif execution.status == "running":
                    task.status = TaskStatus.RUNNING
                else:
                    task.status = TaskStatus.PENDING
                
                # Set timestamps
                task.created_at = execution.started_at
                task.started_at = execution.started_at
                task.completed_at = execution.completed_at
                task.execution_id = execution.id
                task.execution_time = execution.execution_time  # Set execution_time from database
                
                # Add to task history
                self.task_history[task.id] = task
                
                # Add to completed tasks if completed/failed
                if task.status in [TaskStatus.COMPLETED, TaskStatus.FAILED]:
                    self.completed_tasks.append(task)
                
                # Add to queue if pending
                if task.status == TaskStatus.PENDING:
                    self.task_queue.append(task)
            
            logger.info(f"Loaded {len(self.task_history)} tasks from database")
            
            # Cleanup old pending tasks on startup
            self._cleanup_old_pending_tasks()
            
        except Exception as e:
            logger.error(f"Failed to load tasks from database: {e}")
    
    def _cleanup_old_pending_tasks(self):
        """Cleanup old pending tasks that are likely stuck"""
        try:
            current_time = datetime.now()
            old_pending_tasks = []
            
            for task in self.task_queue[:]:  # Copy list to avoid modification during iteration
                if task.status == TaskStatus.PENDING:
                    time_since_created = (current_time - task.created_at).total_seconds()
                    # If task is older than 10 minutes, mark as failed
                    if time_since_created > 600:  # 10 minutes
                        old_pending_tasks.append(task)
            
            for task in old_pending_tasks:
                logger.warning(f"Cleaning up old pending task on startup: {task.id}")
                task.status = TaskStatus.FAILED
                task.error = "Task cleaned up on startup - was stuck in pending state"
                task.completed_at = current_time
                
                # Remove from queue
                if task in self.task_queue:
                    self.task_queue.remove(task)
                
                # Add to completed tasks
                if task not in self.completed_tasks:
                    self.completed_tasks.append(task)
                
                # Update database
                if task.execution_id:
                    try:
                        self.test_repo.update_execution_status(
                            task.execution_id,
                            "failed",
                            task.completed_at,
                            None,
                            task.error
                        )
                    except Exception as e:
                        logger.error(f"Failed to update old pending task in database: {e}")
            
            if old_pending_tasks:
                logger.info(f"Cleaned up {len(old_pending_tasks)} old pending tasks on startup")
                
        except Exception as e:
            logger.error(f"Error cleaning up old pending tasks: {e}")
    
    async def _cleanup_stuck_tasks(self):
        """Background task to cleanup stuck tasks"""
        while self._running:
            try:
                await asyncio.sleep(60)  # Check every minute
                
                # Find stuck tasks (pending for too long)
                current_time = datetime.now()
                stuck_tasks = []
                
                for task in self.task_history.values():
                    if task.status == TaskStatus.PENDING:
                        time_since_created = (current_time - task.created_at).total_seconds()
                        if time_since_created > self.task_timeout:
                            stuck_tasks.append(task)
                
                # Mark stuck tasks as failed
                for task in stuck_tasks:
                    logger.warning(f"Marking stuck task as failed: {task.id}")
                    task.status = TaskStatus.FAILED
                    task.error = f"Task timeout after {self.task_timeout} seconds"
                    task.completed_at = current_time
                    
                    # Update database
                    if task.execution_id:
                        try:
                            self.test_repo.update_execution_status(
                                task.execution_id,
                                "failed",
                                task.completed_at,
                                None,
                                task.error
                            )
                        except Exception as e:
                            logger.error(f"Failed to update stuck task in database: {e}")
                    
                    # Remove from queue if present
                    if task in self.task_queue:
                        self.task_queue.remove(task)
                    
                    # Add to completed tasks
                    if task not in self.completed_tasks:
                        self.completed_tasks.append(task)
                
                if stuck_tasks:
                    logger.info(f"Cleaned up {len(stuck_tasks)} stuck tasks")
                    
            except Exception as e:
                logger.error(f"Error in cleanup task: {e}")
    
    async def start(self):
        """Start the agent manager"""
        self._running = True
        self._processor_task = asyncio.create_task(self._process_queue())
        self._cleanup_task = asyncio.create_task(self._cleanup_stuck_tasks())
        logger.info("Agent Manager started")
    
    async def stop(self):
        """Stop the agent manager"""
        self._running = False
        if self._processor_task:
            self._processor_task.cancel()
            try:
                await self._processor_task
            except asyncio.CancelledError:
                pass
        if self._cleanup_task:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
        logger.info("Agent Manager stopped")
    
    async def submit_task(self, 
                         agent_type: AgentType,
                         task_description: str,
                         parameters: Dict[str, Any] = None) -> str:
        """Submit a new task to the queue"""
        
        task = AgentTask(agent_type, task_description, parameters)
        self.task_queue.append(task)
        self.task_history[task.id] = task
        
        logger.info(f"Task submitted: {task.id} ({agent_type.value})")
        
        # Start processing if not already running
        if not self._running:
            await self.start()
        
        return task.id
    
    async def _process_queue(self):
        """Process tasks in the queue"""
        while self._running:
            # Check if we can start new tasks
            while (len(self.active_agents) < self.max_concurrent_agents and 
                   self.task_queue):
                
                task = self.task_queue.pop(0)
                asyncio.create_task(self._execute_task(task))
            
            # Wait a bit before checking again
            await asyncio.sleep(1)
    
    async def _execute_task(self, task: AgentTask):
        """Execute single task"""
        
        task.status = TaskStatus.RUNNING
        task.started_at = datetime.now()
        
        # Create database execution record
        try:
            # Create test suite if not exists
            suite = self.test_repo.create_test_suite(
                name=f"Auto Test Suite - {task.agent_type.value}",
                description=f"Automatically created for {task.agent_type.value} task",
                tags=[task.agent_type.value, "auto_created"]
            )
            
            # Create execution record
            execution = self.test_repo.create_execution(suite.id, task.agent_type.value)
            task.execution_id = execution.id
            
            logger.info(f"Created execution record: {execution.id}")
            
        except Exception as e:
            logger.error(f"Failed to create execution record: {e}")
            task.execution_id = None
        
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
            
            # Save to database
            await self._save_task_result(task, result)
            
            logger.info(f"Task completed successfully: {task.id}")
            
        except Exception as e:
            # Task failed
            task.error = str(e)
            task.status = TaskStatus.FAILED
            task.completed_at = datetime.now()
            
            # Save error to database
            await self._save_task_result(task, {"error": str(e)})
            
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
    
    async def _save_task_result(self, task: AgentTask, result: Dict[str, Any]):
        """Save task result to database"""
        if not task.execution_id:
            logger.warning("No execution ID, skipping database save")
            return
        
        try:
            # Prepare result data
            result_data = {
                "scenario_id": task.id,
                "scenario_name": task.task_description[:200],  # Truncate if too long
                "status": "passed" if task.status == TaskStatus.COMPLETED else "failed",
                "execution_time": result.get("execution_time", 0),
                "url": task.parameters.get("url", ""),
                "browser": task.parameters.get("browser", "chromium"),
                "actions_performed": result.get("result", {}).get("actions_performed", []),
                "assertions_checked": result.get("result", {}).get("assertions_checked", []),
                "screenshots_taken": result.get("result", {}).get("screenshots", []),
                "error_details": task.error,
                "performance_metrics": result.get("result", {}).get("performance_metrics", {})
            }
            
            # Save test result
            test_result = self.test_repo.save_test_result(task.execution_id, result_data)
            
            # Update execution status
            execution_time = None
            if task.started_at and task.completed_at:
                execution_time = (task.completed_at - task.started_at).total_seconds()
            
            # Set execution_time on task
            task.execution_time = execution_time
            
            self.test_repo.update_execution_status(
                task.execution_id,
                task.status.value,
                task.completed_at,
                execution_time,
                task.error
            )
            
            logger.info(f"Saved task result to database: {test_result.id}")
            
        except Exception as e:
            logger.error(f"Failed to save task result to database: {e}")
    
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
    
    async def cancel_task(self, task_id: str) -> bool:
        """Cancel a pending or running task"""
        task = self.task_history.get(task_id)
        if not task:
            logger.warning(f"Task {task_id} not found")
            return False
        
        if task.status not in [TaskStatus.PENDING, TaskStatus.RUNNING]:
            logger.warning(f"Task {task_id} is not in cancellable state: {task.status}")
            return False
        
        # Remove from queue if pending
        if task.status == TaskStatus.PENDING and task in self.task_queue:
            self.task_queue.remove(task)
        
        # Stop agent if running
        if task.status == TaskStatus.RUNNING and task.id in self.active_agents:
            agent = self.active_agents[task.id]
            try:
                await agent.stop()  # Assuming agents have a stop method
            except:
                pass
            del self.active_agents[task.id]
        
        # Update task status
        task.status = TaskStatus.FAILED
        task.error = "Task cancelled by user"
        task.completed_at = datetime.now()
        
        # Update database if execution_id exists
        if task.execution_id:
            try:
                self.test_repo.update_execution_status(
                    task.execution_id,
                    "failed",
                    task.completed_at,
                    None,
                    "Task cancelled by user"
                )
                logger.info(f"Updated database for cancelled task: {task_id}")
            except Exception as e:
                logger.error(f"Failed to update database for cancelled task: {e}")
        
        # Move to completed tasks
        if task not in self.completed_tasks:
            self.completed_tasks.append(task)
        
        logger.info(f"Task cancelled successfully: {task_id}")
        return True

    def get_task_status(self, task_id: str) -> Optional[AgentTask]:
        """Get task status by ID"""
        return self.task_history.get(task_id)
    
    def get_active_tasks(self) -> List[AgentTask]:
        """Get currently running tasks"""
        return [task for task in self.task_history.values() 
                if task.status == TaskStatus.RUNNING]
    
    def get_completed_tasks(self) -> List[AgentTask]:
        """Get completed tasks from both memory and database"""
        # Get from memory (only completed/failed tasks)
        memory_tasks = [task for task in self.task_history.values() 
                       if task.status in [TaskStatus.COMPLETED, TaskStatus.FAILED]]
        
        # Get from database (only completed/failed executions)
        try:
            recent_executions = self.test_repo.get_recent_executions(50)
            db_tasks = []
            
            for execution in recent_executions:
                # Only include completed/failed executions
                if execution.status in ["completed", "failed"]:
                    # Create task object from execution
                    task = AgentTask(
                        agent_type=AgentType(execution.agent_type),
                        task_description=f"Task from execution {execution.id}",
                        task_id=execution.id
                    )
                    task.status = TaskStatus(execution.status)
                    task.created_at = execution.started_at
                    task.started_at = execution.started_at
                    task.completed_at = execution.completed_at
                    task.execution_id = execution.id
                    task.execution_time = execution.execution_time
                    db_tasks.append(task)
            
            # Combine and deduplicate by task ID
            all_tasks = memory_tasks + db_tasks
            unique_tasks = {}
            for task in all_tasks:
                # Prefer memory task if both exist (more up-to-date)
                if task.id not in unique_tasks or task in memory_tasks:
                    unique_tasks[task.id] = task
            
            # Sort by completion time (newest first), then by start time if completion time is None
            def sort_key(task):
                # Primary sort: completion time (newest first)
                if task.completed_at:
                    return task.completed_at
                # Secondary sort: start time (newest first)
                elif task.started_at:
                    return task.started_at
                # Tertiary sort: creation time (newest first)
                else:
                    return task.created_at
            
            sorted_tasks = sorted(
                list(unique_tasks.values()),
                key=sort_key,
                reverse=True
            )
            
            return sorted_tasks
            
        except Exception as e:
            logger.error(f"Failed to get completed tasks from database: {e}")
            # Fallback: sort memory tasks only
            return sorted(
                memory_tasks,
                key=lambda x: x.completed_at or x.started_at or x.created_at,
                reverse=True
            )
    
    def get_all_completed_tasks_from_database(self) -> List[AgentTask]:
        """Get ALL completed tasks from database (no limit)"""
        try:
            # Get all executions from database
            all_executions = self.test_repo.get_all_executions()
            db_tasks = []
            
            for execution in all_executions:
                # Create task object from execution
                task = AgentTask(
                    agent_type=AgentType(execution.agent_type),
                    task_description=f"Task from execution {execution.id}",
                    task_id=execution.id
                )
                task.status = TaskStatus(execution.status)
                task.created_at = execution.started_at
                task.started_at = execution.started_at
                task.completed_at = execution.completed_at
                task.execution_id = execution.id
                task.execution_time = execution.execution_time  # Set execution_time
                db_tasks.append(task)
            
            logger.info(f"Loaded {len(db_tasks)} tasks from database")
            return db_tasks
            
        except Exception as e:
            logger.error(f"Failed to get all completed tasks from database: {e}")
            return []
    
    def get_queue_status(self) -> Dict[str, Any]:
        """Get current queue status including database data"""
        # Get memory status
        memory_status = {
            "active_tasks": len(self.active_agents),
            "pending_tasks": len(self.task_queue),
            "completed_tasks": len(self.completed_tasks),
            "total_tasks": len(self.task_history)
        }
        
        # Get database metrics
        try:
            db_metrics = self.test_repo.get_test_metrics(30)
            
            # Calculate accurate totals
            total_completed = db_metrics["total_executions"]
            total_active = memory_status["active_tasks"]
            total_pending = memory_status["pending_tasks"]
            
            # Total tasks = completed + active + pending
            total_tasks = total_completed + total_active + total_pending
            
            return {
                "active_tasks": total_active,
                "pending_tasks": total_pending,
                "completed_tasks": total_completed,
                "total_tasks": total_tasks
            }
        except Exception as e:
            logger.error(f"Failed to get database metrics: {e}")
            return memory_status
    
    def get_test_metrics(self) -> Dict[str, Any]:
        """Get test metrics from database"""
        try:
            return self.test_repo.get_test_metrics(30)
        except Exception as e:
            logger.error(f"Failed to get test metrics: {e}")
            return {
                "total_executions": 0,
                "successful_executions": 0,
                "failed_executions": 0,
                "success_rate": 0,
                "average_execution_time": 0,
                "total_tests": 0,
                "passed_tests": 0,
                "pass_rate": 0
            }