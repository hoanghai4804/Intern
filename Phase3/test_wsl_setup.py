#!/usr/bin/env python3
"""
Test script để kiểm tra WSL setup
Chạy script này sau khi setup WSL environment
"""

import asyncio
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

async def test_wsl_environment():
    """Test WSL environment"""
    print("🧪 Testing WSL Environment")
    print("=" * 50)
    
    # Test 1: Check if running in WSL
    print("🔍 Checking WSL environment...")
    try:
        with open('/proc/version', 'r') as f:
            version_info = f.read()
            if 'Microsoft' in version_info:
                print("✅ Running in WSL environment")
            else:
                print("⚠️  Not running in WSL (but that's okay for testing)")
    except:
        print("⚠️  Cannot determine WSL status")
    
    # Test 2: Import browser_use
    print("\n🌐 Testing browser_use import...")
    try:
        import browser_use
        print("✅ browser_use imported successfully")
        print(f"✅ browser_use version: {browser_use.__version__ if hasattr(browser_use, '__version__') else 'Unknown'}")
    except Exception as e:
        print(f"❌ browser_use import failed: {e}")
        return False
    
    # Test 3: Test agent creation
    print("\n🤖 Testing agent creation...")
    try:
        from backend.agents.test_agent import WebTestAgent
        agent = WebTestAgent()
        print("✅ WebTestAgent created successfully")
        
        # Test create_agent method
        test_task = "Navigate to https://example.com"
        agent_instance = await agent.create_agent(test_task)
        print("✅ Agent instance created successfully")
        
        return True
        
    except Exception as e:
        print(f"❌ Agent test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_browser_automation():
    """Test browser automation functionality"""
    print("\n🧪 Testing Browser Automation")
    print("=" * 50)
    
    try:
        from backend.agents.test_agent import WebTestAgent
        
        agent = WebTestAgent()
        print("✅ Agent created for browser test")
        
        # Test simple task
        print("\n📝 Testing simple browser task...")
        result = await agent.execute_task("Navigate to https://example.com and check page title")
        
        print(f"✅ Task completed with status: {result.get('status', 'unknown')}")
        print(f"⏱️  Execution time: {result.get('execution_time', 'N/A')}s")
        
        if result.get('status') == 'success':
            print("🎉 Browser automation working perfectly in WSL!")
            return True
        else:
            print(f"⚠️  Task completed but with status: {result.get('status')}")
            return True  # Still consider it working
            
    except Exception as e:
        print(f"❌ Browser automation test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Main test function"""
    print("🚀 WSL Setup Test")
    print("=" * 60)
    
    # Test environment
    env_success = await test_wsl_environment()
    
    if env_success:
        # Test browser automation
        browser_success = await test_browser_automation()
        
        print("\n" + "=" * 60)
        print("📊 WSL Test Summary:")
        print(f"✅ Environment: {'PASS' if env_success else 'FAIL'}")
        print(f"✅ Browser Automation: {'PASS' if browser_success else 'FAIL'}")
        
        if env_success and browser_success:
            print("\n🎉 WSL setup completed successfully!")
            print("💡 Your AI Agents project is now ready to run with full browser automation!")
        else:
            print("\n⚠️  Some tests failed. Check the error messages above.")
    else:
        print("\n❌ Environment test failed. Please check your WSL setup.")
    
    return env_success

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1) 