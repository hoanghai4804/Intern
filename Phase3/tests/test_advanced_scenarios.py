# test_advanced_scenarios.py
import asyncio
from backend.automation.browser_controller import EnhancedBrowserController

async def test_comprehensive_scenarios():
    print("🚀 Advanced Browser Testing with MCP Integration")
    print("=" * 60)
    
    async with EnhancedBrowserController() as controller:
        
        # Test 1: Cross-browser compatibility
        print("\n🌐 Test 1: Cross-Browser Compatibility")
        print("-" * 40)
        
        cross_browser_result = await controller.run_cross_browser_test(
            task="Navigate to https://httpbin.org/forms/post and test form submission functionality",
            browsers=["chromium", "firefox"]  
        )
        
        print(f"✅ Cross-browser test completed")
        print(f"📊 Success rate: {cross_browser_result['summary']['success_rate']:.1f}%")
        print(f"🌐 Browsers tested: {', '.join(cross_browser_result['summary']['browsers_tested'])}")
        
        # Test 2: Responsive design
        print("\n📱 Test 2: Responsive Design Testing")
        print("-" * 40)
        
        responsive_result = await controller.run_responsive_test(
            "https://example.com"
        )
        
        if responsive_result["status"] == "success":
            print("✅ Responsive design test completed")
            print(f"📐 Viewports tested: {len(responsive_result['viewports_tested'])}")
        else:
            print(f"❌ Responsive test failed: {responsive_result['error']}")
        
        # Test 3: Performance testing
        print("\n⚡ Test 3: Performance Testing")
        print("-" * 40)
        
        performance_result = await controller.run_performance_test(
            "https://www.github.com"
        )
        
        if performance_result["status"] == "success":
            print("✅ Performance test completed")
            print(f"⏱️ Test execution time: {performance_result['test_execution_time']:.2f}s")
        else:
            print(f"❌ Performance test failed: {performance_result['error']}")
        
        # Summary
        print("\n📋 Test Suite Summary")
        print("=" * 40)
        tests_run = 3
        tests_passed = sum([
            1 if cross_browser_result['summary']['success_rate'] > 0 else 0,
            1 if responsive_result["status"] == "success" else 0,
            1 if performance_result["status"] == "success" else 0
        ])
        
        print(f"Total tests: {tests_run}")
        print(f"Passed: {tests_passed}")
        print(f"Success rate: {(tests_passed/tests_run)*100:.1f}%")

if __name__ == "__main__":
    asyncio.run(test_comprehensive_scenarios())