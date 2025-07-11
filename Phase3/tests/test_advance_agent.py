# test_advanced_agent.py
import asyncio
from backend.agents.test_agent import WebTestAgent

async def test_advanced_features():
    print("🧪 Testing Advanced Agent Features")
    print("=" * 50)
    
    agent = WebTestAgent()
    
    # Test 1: Website functionality
    print("\n🔍 Test 1: Website Functionality Testing")
    result1 = await agent.test_website_functionality(
        "https://example.com",
        [
            "Check navigation menu works",
            "Verify all links are clickable", 
            "Test page loading speed",
            "Check responsive design"
        ]
    )
    print(f"✅ Functionality test completed in {result1['execution_time']:.2f}s")
    
    # Test 2: UI Elements
    print("\n🎨 Test 2: UI Elements Testing") 
    result2 = await agent.test_ui_elements(
        "https://httpbin.org/forms/post",
        [
            "Header navigation",
            "Form input fields",
            "Submit button",
            "Footer elements"
        ]
    )
    print(f"✅ UI test completed in {result2['execution_time']:.2f}s")
    
    # Test 3: Form validation
    print("\n📝 Test 3: Form Validation Testing")
    result3 = await agent.test_form_validation("https://httpbin.org/forms/post")
    print(f"✅ Form validation test completed in {result3['execution_time']:.2f}s")
    
    print("\n📊 Summary:")
    print(f"Total tests: 3")
    print(f"Successful: {sum(1 for r in [result1, result2, result3] if r['status'] == 'success')}")
    print(f"Total execution time: {sum(r['execution_time'] for r in [result1, result2, result3]):.2f}s")

if __name__ == "__main__":
    asyncio.run(test_advanced_features())