# backend/database/models.py
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, Float, JSON, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from sqlalchemy import create_engine
from datetime import datetime
import uuid

Base = declarative_base()

class TestSuite(Base):
    __tablename__ = "test_suites"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(200), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    tags = Column(JSON)
    
    # Relationships
    executions = relationship("TestExecution", back_populates="test_suite")

class TestExecution(Base):
    __tablename__ = "test_executions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    test_suite_id = Column(String, ForeignKey("test_suites.id"))
    agent_type = Column(String(50), nullable=False)
    status = Column(String(20), nullable=False)  # pending, running, completed, failed
    started_at = Column(DateTime, default=datetime.now)
    completed_at = Column(DateTime)
    execution_time = Column(Float)  # seconds
    total_tests = Column(Integer, default=0)
    passed_tests = Column(Integer, default=0)
    failed_tests = Column(Integer, default=0)
    error_message = Column(Text)
    
    # Relationships
    test_suite = relationship("TestSuite", back_populates="executions")
    test_results = relationship("TestResult", back_populates="execution")

class TestResult(Base):
    __tablename__ = "test_results"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    execution_id = Column(String, ForeignKey("test_executions.id"))
    scenario_id = Column(String, nullable=False)
    scenario_name = Column(String(200), nullable=False)
    status = Column(String(20), nullable=False)  # passed, failed, skipped
    started_at = Column(DateTime, default=datetime.now)
    completed_at = Column(DateTime)
    execution_time = Column(Float)
    url = Column(String(500))
    browser = Column(String(50))
    viewport_size = Column(String(20))
    
    # Test details
    actions_performed = Column(JSON)
    assertions_checked = Column(JSON)
    screenshots_taken = Column(JSON)
    error_details = Column(Text)
    performance_metrics = Column(JSON)
    
    # Relationships
    execution = relationship("TestExecution", back_populates="test_results")

class TestMetrics(Base):
    __tablename__ = "test_metrics"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    date = Column(DateTime, default=datetime.now)
    total_executions = Column(Integer, default=0)
    successful_executions = Column(Integer, default=0)
    failed_executions = Column(Integer, default=0)
    average_execution_time = Column(Float)
    total_tests_run = Column(Integer, default=0)
    pass_rate = Column(Float)  # percentage
    
    # Performance metrics
    average_page_load_time = Column(Float)
    total_screenshots = Column(Integer, default=0)
    total_errors = Column(Integer, default=0)

# Database connection
class Database:
    def __init__(self, database_url: str = "sqlite:///./test_results.db"):
        self.engine = create_engine(database_url)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        
        # Create tables
        Base.metadata.create_all(bind=self.engine)
    
    def get_session(self):
        return self.SessionLocal()
    
    def close(self):
        self.engine.dispose()

# Repository pattern for data access
class TestResultRepository:
    def __init__(self, db: Database):
        self.db = db
    
    def create_test_suite(self, name: str, description: str = None, tags: list = None) -> TestSuite:
        with self.db.get_session() as session:
            suite = TestSuite(
                name=name,
                description=description,
                tags=tags
            )
            session.add(suite)
            session.commit()
            session.refresh(suite)
            return suite
    
    def create_execution(self, test_suite_id: str, agent_type: str) -> TestExecution:
        with self.db.get_session() as session:
            execution = TestExecution(
                test_suite_id=test_suite_id,
                agent_type=agent_type,
                status="pending"
            )
            session.add(execution)
            session.commit()
            session.refresh(execution)
            return execution
    
    def update_execution_status(self, execution_id: str, status: str, 
                               completed_at: datetime = None, 
                               execution_time: float = None,
                               error_message: str = None):
        with self.db.get_session() as session:
            execution = session.query(TestExecution).filter(
                TestExecution.id == execution_id
            ).first()
            
            if execution:
                execution.status = status
                if completed_at:
                    execution.completed_at = completed_at
                if execution_time:
                    execution.execution_time = execution_time
                if error_message:
                    execution.error_message = error_message
                
                session.commit()
    
    def save_test_result(self, execution_id: str, result_data: dict) -> TestResult:
        with self.db.get_session() as session:
            result = TestResult(
                execution_id=execution_id,
                scenario_id=result_data.get("scenario_id"),
                scenario_name=result_data.get("scenario_name"),
                status=result_data.get("status"),
                completed_at=datetime.now(),
                execution_time=result_data.get("execution_time"),
                url=result_data.get("url"),
                browser=result_data.get("browser"),
                actions_performed=result_data.get("actions_performed"),
                assertions_checked=result_data.get("assertions_checked"),
                screenshots_taken=result_data.get("screenshots_taken"),
                error_details=result_data.get("error_details"),
                performance_metrics=result_data.get("performance_metrics")
            )
            session.add(result)
            session.commit()
            session.refresh(result)
            return result
    
    def get_execution_results(self, execution_id: str) -> list:
        with self.db.get_session() as session:
            return session.query(TestResult).filter(
                TestResult.execution_id == execution_id
            ).all()
    
    def get_recent_executions(self, limit: int = 10) -> list:
        with self.db.get_session() as session:
            return session.query(TestExecution).order_by(
                TestExecution.started_at.desc()
            ).limit(limit).all()
    
    def get_test_metrics(self, days: int = 30) -> dict:
        with self.db.get_session() as session:
            # Calculate metrics for the last N days
            from sqlalchemy import func
            from datetime import timedelta
            
            since_date = datetime.now() - timedelta(days=days)
            
            total_executions = session.query(TestExecution).filter(
                TestExecution.started_at >= since_date
            ).count()
            
            successful_executions = session.query(TestExecution).filter(
                TestExecution.started_at >= since_date,
                TestExecution.status == "completed"
            ).count()
            
            failed_executions = session.query(TestExecution).filter(
                TestExecution.started_at >= since_date,
                TestExecution.status == "failed"
            ).count()
            
            avg_execution_time = session.query(
                func.avg(TestExecution.execution_time)
            ).filter(
                TestExecution.started_at >= since_date,
                TestExecution.execution_time.isnot(None)
            ).scalar() or 0
            
            total_tests = session.query(
                func.sum(TestExecution.total_tests)
            ).filter(
                TestExecution.started_at >= since_date
            ).scalar() or 0
            
            passed_tests = session.query(
                func.sum(TestExecution.passed_tests)
            ).filter(
                TestExecution.started_at >= since_date
            ).scalar() or 0
            
            pass_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
            
            return {
                "total_executions": total_executions or 0,
                "successful_executions": successful_executions or 0,
                "failed_executions": failed_executions or 0,
                "success_rate": (successful_executions / total_executions * 100) if total_executions > 0 else 0,
                "average_execution_time": avg_execution_time or 0,
                "total_tests": total_tests or 0,
                "passed_tests": passed_tests or 0,
                "pass_rate": pass_rate
            }

# Test database functionality
def test_database():
    print("🗄️ Testing Database Integration")
    print("=" * 50)
    
    # Initialize database
    db = Database("sqlite:///./test_ai_agents.db")
    repo = TestResultRepository(db)
    
    # Create test suite
    suite = repo.create_test_suite(
        name="Sample Test Suite",
        description="Testing database integration",
        tags=["database", "test"]
    )
    print(f"✅ Created test suite: {suite.id}")
    
    # Create execution
    execution = repo.create_execution(suite.id, "enhanced_test")
    print(f"✅ Created execution: {execution.id}")
    
    # Save test results
    result_data = {
        "scenario_id": "test_scenario_1",
        "scenario_name": "Test Homepage",
        "status": "passed",
        "execution_time": 15.5,
        "url": "https://example.com",
        "browser": "chromium",
        "actions_performed": ["navigate", "verify_title", "screenshot"],
        "assertions_checked": ["title_exists", "page_loaded"],
        "screenshots_taken": ["homepage.png"],
        "performance_metrics": {"page_load_time": 1.2, "dom_ready_time": 0.8}
    }
    
    result = repo.save_test_result(execution.id, result_data)
    print(f"✅ Saved test result: {result.id}")
    
    # Update execution
    repo.update_execution_status(
        execution.id, 
        "completed", 
        datetime.now(), 
        20.0
    )
    print("✅ Updated execution status")
    
    # Get metrics
    metrics = repo.get_test_metrics(30)
    print(f"📊 Metrics: {metrics}")
    
    # Cleanup
    db.close()

if __name__ == "__main__":
    test_database()