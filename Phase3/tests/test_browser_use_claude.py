import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

from browser_use import Agent
from browser_use.llm import ChatAnthropic

async def test_basic_navigation():
    """Test cơ bản: navigation và search"""
    print("🤖 Starting Browser Use with Claude...")
    
    # Tạo agent với Claude
    agent = Agent(
        task="Navigate to google.com and search for 'browser automation python'",
        llm=ChatAnthropic(
            model="claude-3-5-sonnet-20241022",  
            api_key=os.getenv("ANTHROPIC_API_KEY")
        )
    )
    
    try:
        print("🚀 Running automation task...")
        result = await agent.run()
        print("✅ Task completed successfully!")
        print(f"Result: {result}")
        return result
        
    except Exception as e:
        print(f"❌ Error occurred: {e}")
        return None

async def test_form_interaction():
    """Test form interaction"""
    print("\n🤖 Testing form interaction...")
    
    agent = Agent(
        task="""
        Navigate to https://httpbin.org/forms/post and:
        1. Fill in the customer name field with 'Test User'
        2. Fill in the telephone field with '123-456-7890' 
        3. Fill in the email field with 'test@example.com'
        4. Submit the form
        5. Verify the form was submitted successfully
        """,
        llm=ChatAnthropic(
            model="claude-3-5-sonnet-20241022",
            api_key=os.getenv("ANTHROPIC_API_KEY")
        )
    )
    
    try:
        result = await agent.run()
        print("✅ Form interaction test completed!")
        print(f"Result: {result}")
        return result
        
    except Exception as e:
        print(f"❌ Form test error: {e}")
        return None

async def main():
    print("🎯 Browser Use + Claude Testing Suite")
    print("=" * 50)
    
    # Test 1: Basic navigation
    await test_basic_navigation()
    
    # Đợi một chút giữa các tests
    await asyncio.sleep(2)
    
    # Test 2: Form interaction
    await test_form_interaction()
    
    print("\n✅ All tests completed!")

if __name__ == "__main__":
    asyncio.run(main())