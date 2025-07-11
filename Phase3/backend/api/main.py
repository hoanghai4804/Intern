# backend/api/main.py
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
import asyncio
import json

from backend.agents.agent_manager import AgentManager, AgentType, TaskStatus
from backend.scenarios.scenario_builder import ScenarioBuilder, TestScenario
from backend.database.model import Database, TestResultRepository
from backend.utils.config import Config

# Pydantic models for API
class TaskSubmission(BaseModel):
    agent_type: str = Field(..., description="Type of agent to use")
    task_description: str = Field(..., description="Description of the task")
    parameters: Optional[Dict[str, Any]] = Field(default={}, description="Task parameters")

class TaskResponse(BaseModel):
    task_id: str
    status: str
    message: str

class TaskStatus(BaseModel):
    task_id: str
    status: str
    created_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    result: Optional[Dict[str, Any]]
    error: Optional[str]
    execution_time: Optional[float]

class ScenarioSubmission(BaseModel):
    scenario_id: str
    parameters: Optional[Dict[str, Any]] = {}

class TestSuiteCreation(BaseModel):
    name: str
    description: Optional[str] = None
    tags: Optional[List[str]] = []

class AgentMetrics(BaseModel):
    active_tasks: int
    pending_tasks: int
    completed_tasks: int
    total_tasks: int
    success_rate: float
    average_execution_time: float

# Initialize FastAPI app
app = FastAPI(
    title="AI Agents Testing API",
    description="Advanced AI-powered web testing automation",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
agent_manager = AgentManager(max_concurrent_agents=3)
database = Database()
test_repo = TestResultRepository(database)

# Dependency injection
def get_agent_manager():
    return agent_manager

def get_test_repository():
    return test_repo

# API Routes

@app.get("/")
async def root():
    return {
        "message": "AI Agents Testing API",
        "version": "1.0.0",
        "status": "running"
    }

@app.post("/api/tasks/submit", response_model=TaskResponse)
async def submit_task(
    task: TaskSubmission,
    manager: AgentManager = Depends(get_agent_manager)
):
    """Submit a new task to the agent manager"""
    
    try:
        # Validate agent type
        agent_type = AgentType(task.agent_type)
        
        # Submit task
        task_id = await manager.submit_task(
            agent_type=agent_type,
            task_description=task.task_description,
            parameters=task.parameters
        )
        
        return TaskResponse(
            task_id=task_id,
            status="submitted",
            message="Task submitted successfully"
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid agent type: {task.agent_type}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tasks/{task_id}/status", response_model=TaskStatus)
async def get_task_status(
    task_id: str,
    manager: AgentManager = Depends(get_agent_manager)
):
    """Get status of a specific task"""
    
    task = manager.get_task_status(task_id)
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    execution_time = None
    if task.started_at and task.completed_at:
        execution_time = (task.completed_at - task.started_at).total_seconds()
    
    return TaskStatus(
        task_id=task.id,
        status=task.status.value,
        created_at=task.created_at,
        started_at=task.started_at,
        completed_at=task.completed_at,
        result=task.result,
        error=task.error,
        execution_time=execution_time
    )

@app.get("/api/tasks/active", response_model=List[TaskStatus])
async def get_active_tasks(
    manager: AgentManager = Depends(get_agent_manager)
):
    """Get all currently active tasks"""
    
    active_tasks = manager.get_active_tasks()
    
    return [
        TaskStatus(
            task_id=task.id,
            status=task.status.value,
            created_at=task.created_at,
            started_at=task.started_at,
            completed_at=task.completed_at,
            result=task.result,
            error=task.error
        )
        for task in active_tasks
    ]

@app.get("/api/tasks/completed", response_model=List[TaskStatus])
async def get_completed_tasks(
    limit: int = 20,
    manager: AgentManager = Depends(get_agent_manager)
):
    """Get recently completed tasks"""
    
    completed_tasks = manager.get_completed_tasks()
    
    # Sort by completion time and limit
    sorted_tasks = sorted(
        completed_tasks, 
        key=lambda x: x.completed_at or datetime.min,
        reverse=True
    )[:limit]
    
    return [
        TaskStatus(
            task_id=task.id,
            status=task.status.value,
            created_at=task.created_at,
            started_at=task.started_at,
            completed_at=task.completed_at,
            result=task.result,
            error=task.error,
            execution_time=(task.completed_at - task.started_at).total_seconds() 
                           if task.started_at and task.completed_at else None
        )
        for task in sorted_tasks
    ]

@app.delete("/api/tasks/{task_id}")
async def cancel_task(
    task_id: str,
    manager: AgentManager = Depends(get_agent_manager)
):
    """Cancel a running or pending task"""
    
    success = await manager.cancel_task(task_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Task not found or cannot be cancelled")
    
    return {"message": "Task cancelled successfully"}

@app.get("/api/metrics", response_model=AgentMetrics)
async def get_metrics(
    manager: AgentManager = Depends(get_agent_manager),
    repo: TestResultRepository = Depends(get_test_repository)
):
    """Get system metrics"""
    
    queue_status = manager.get_queue_status()
    db_metrics = repo.get_test_metrics(30)
    
    return AgentMetrics(
        active_tasks=queue_status["active_tasks"],
        pending_tasks=queue_status["pending_tasks"],
        completed_tasks=queue_status["completed_tasks"],
        total_tasks=queue_status["total_tasks"],
        success_rate=db_metrics["success_rate"],
        average_execution_time=db_metrics["average_execution_time"]
    )

@app.get("/api/scenarios")
async def get_scenarios():
    """Get all available test scenarios"""
    
    scenarios = ScenarioBuilder.load_all_scenarios()
    
    return [
        {
            "id": scenario.id,
            "name": scenario.name,
            "description": scenario.description,
            "scenario_type": scenario.scenario_type.value,
            "url": scenario.url,
            "actions_count": len(scenario.actions),
            "tags": scenario.tags,
            "priority": scenario.priority
        }
        for scenario in scenarios
    ]

@app.post("/api/scenarios/{scenario_id}/run")
async def run_scenario(
    scenario_id: str,
    submission: ScenarioSubmission,
    background_tasks: BackgroundTasks,
    manager: AgentManager = Depends(get_agent_manager)
):
    """Run a specific test scenario"""
    
    # Load scenario
    scenarios = ScenarioBuilder.load_all_scenarios()
    scenario = next((s for s in scenarios if s.id == scenario_id), None)
    
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    
    # Convert scenario to task
    task_description = f"Execute scenario: {scenario.name}"
    parameters = {
        "scenario": scenario,
        "url": scenario.url,
        **submission.parameters
    }
    
    # Submit task
    task_id = await manager.submit_task(
        agent_type=AgentType.ENHANCED_TEST,
        task_description=task_description,
        parameters=parameters
    )
    
    return {
        "task_id": task_id,
        "scenario_id": scenario_id,
        "message": "Scenario execution started"
    }

@app.post("/api/test-suites")
async def create_test_suite(
    suite: TestSuiteCreation,
    repo: TestResultRepository = Depends(get_test_repository)
):
    """Create a new test suite"""
    
    test_suite = repo.create_test_suite(
        name=suite.name,
        description=suite.description,
        tags=suite.tags
    )
    
    return {
        "id": test_suite.id,
        "name": test_suite.name,
        "description": test_suite.description,
        "created_at": test_suite.created_at,
        "tags": test_suite.tags
    }

@app.get("/api/test-suites")
async def get_test_suites(
    repo: TestResultRepository = Depends(get_test_repository)
):
    """Get all test suites"""
    
    # This would need implementation in the repository
    return {"message": "Test suites endpoint - to be implemented"}

@app.get("/api/executions/recent")
async def get_recent_executions(
    limit: int = 10,
    repo: TestResultRepository = Depends(get_test_repository)
):
    """Get recent test executions"""
    
    executions = repo.get_recent_executions(limit)
    
    return [
        {
            "id": execution.id,
            "test_suite_id": execution.test_suite_id,
            "agent_type": execution.agent_type,
            "status": execution.status,
            "started_at": execution.started_at,
            "completed_at": execution.completed_at,
            "execution_time": execution.execution_time,
            "total_tests": execution.total_tests,
            "passed_tests": execution.passed_tests,
            "failed_tests": execution.failed_tests
        }
        for execution in executions
    ]

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    
    return {
        "status": "healthy",
        "timestamp": datetime.now(),
        "version": "1.0.0",
        "components": {
            "agent_manager": "operational",
            "database": "operational",
            "scenarios": "operational"
        }
    }

# WebSocket endpoint for real-time updates
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    await websocket.accept()
    
    try:
        # Send initial connection message
        await websocket.send_text(json.dumps({
            "type": "connection",
            "message": "Connected to AI Agents Testing API",
            "timestamp": datetime.now().isoformat()
        }))
        
        # Keep connection alive and send periodic updates
        while True:
            # Send system status every 5 seconds
            await asyncio.sleep(5)
            
            # Get current metrics
            queue_status = agent_manager.get_queue_status()
            
            status_update = {
                "type": "status_update",
                "data": {
                    "queue_status": queue_status,
                    "active_tasks": len(agent_manager.active_agents),
                    "pending_tasks": len(agent_manager.task_queue),
                    "completed_tasks": len(agent_manager.completed_tasks)
                },
                "timestamp": datetime.now().isoformat()
            }
            
            await websocket.send_text(json.dumps(status_update))
            
    except WebSocketDisconnect:
        print("🔌 WebSocket client disconnected")
    except Exception as e:
        print(f"❌ WebSocket error: {e}")
        try:
            await websocket.close()
        except:
            pass

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    print("🚀 AI Agents Testing API started")
    print(f"📊 Agent Manager initialized with {agent_manager.max_concurrent_agents} max concurrent agents")

@app.on_event("shutdown")
async def shutdown_event():
    print("🛑 Shutting down AI Agents Testing API")
    database.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)