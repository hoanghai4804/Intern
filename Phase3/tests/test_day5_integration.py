# test_day5_integration.py
import asyncio
from backend.agents.agent_manager import AgentManager, AgentType
from backend.scenarios.scenario_builder import ScenarioTemplates
from backend.database.models import Database, TestResultRepository

async def test_day5_integration():
    print("🧪 Testing Day 5 Integration")
    print("=" * 50)
    
    # Test Agent Manager
    manager = AgentManager()
    task_id = await manager.submit_task(
        AgentType.WEB_TEST,
        "Test integration",
        {"url": "https://example.com"}
    )
    print(f"✅ Task submitted: {task_id}")
    
    # Test Scenarios
    scenario = ScenarioTemplates.login_flow()
    print(f"✅ Scenario created: {scenario.name}")
    
    # Test Database
    db = Database()
    repo = TestResultRepository(db)
    suite = repo.create_test_suite("Integration Test Suite")
    print(f"✅ Test suite created: {suite.id}")
    
    print("🎉 Day 5 integration test completed!")

if __name__ == "__main__":
    asyncio.run(test_day5_integration())