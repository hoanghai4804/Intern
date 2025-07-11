# backend/scenarios/scenario_builder.py
import yaml
import json
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from enum import Enum
from pathlib import Path

class ScenarioType(Enum):
    FUNCTIONAL = "functional"
    UI_UX = "ui_ux"
    PERFORMANCE = "performance"
    SECURITY = "security"
    ACCESSIBILITY = "accessibility"
    CROSS_BROWSER = "cross_browser"
    MOBILE = "mobile"

class ActionType(Enum):
    NAVIGATE = "navigate"
    CLICK = "click"
    INPUT = "input"
    WAIT = "wait"
    VERIFY = "verify"
    SCREENSHOT = "screenshot"
    SCROLL = "scroll"
    HOVER = "hover"
    SELECT = "select"

@dataclass
class TestAction:
    type: ActionType
    target: str
    value: Optional[str] = None
    timeout: Optional[int] = None
    description: Optional[str] = None
    expected_result: Optional[str] = None

@dataclass
class TestScenario:
    id: str
    name: str
    description: str
    scenario_type: ScenarioType
    url: str
    actions: List[TestAction]
    setup_actions: Optional[List[TestAction]] = None
    teardown_actions: Optional[List[TestAction]] = None
    tags: Optional[List[str]] = None
    priority: int = 1
    timeout: int = 300
    retry_count: int = 1

class ScenarioBuilder:
    """Builder for creating test scenarios"""
    
    def __init__(self):
        self.scenarios_dir = Path("scenarios")
        self.scenarios_dir.mkdir(exist_ok=True)
        
    def create_scenario(self, 
                       scenario_id: str,
                       name: str,
                       description: str,
                       scenario_type: ScenarioType,
                       url: str) -> 'ScenarioBuilder':
        """Start building a new scenario"""
        
        self.current_scenario = TestScenario(
            id=scenario_id,
            name=name,
            description=description,
            scenario_type=scenario_type,
            url=url,
            actions=[]
        )
        
        return self
    
    def add_action(self, 
                   action_type: ActionType,
                   target: str,
                   value: str = None,
                   description: str = None,
                   expected_result: str = None,
                   timeout: int = None) -> 'ScenarioBuilder':
        """Add action to current scenario"""
        
        action = TestAction(
            type=action_type,
            target=target,
            value=value,
            description=description,
            expected_result=expected_result,
            timeout=timeout
        )
        
        self.current_scenario.actions.append(action)
        return self
    
    def add_setup(self, actions: List[TestAction]) -> 'ScenarioBuilder':
        """Add setup actions"""
        self.current_scenario.setup_actions = actions
        return self
    
    def add_teardown(self, actions: List[TestAction]) -> 'ScenarioBuilder':
        """Add teardown actions"""
        self.current_scenario.teardown_actions = actions
        return self
    
    def set_tags(self, tags: List[str]) -> 'ScenarioBuilder':
        """Set scenario tags"""
        self.current_scenario.tags = tags
        return self
    
    def set_priority(self, priority: int) -> 'ScenarioBuilder':
        """Set scenario priority (1-5, 5 highest)"""
        self.current_scenario.priority = priority
        return self
    
    def set_timeout(self, timeout: int) -> 'ScenarioBuilder':
        """Set scenario timeout in seconds"""
        self.current_scenario.timeout = timeout
        return self
    
    def build(self) -> TestScenario:
        """Build and return the scenario"""
        return self.current_scenario
    
    def save(self, filename: str = None) -> str:
        """Save scenario to file"""
        
        if not filename:
            filename = f"{self.current_scenario.id}.yaml"
        
        filepath = self.scenarios_dir / filename
        
        # Convert to dict for serialization
        scenario_dict = asdict(self.current_scenario)
        
        # Convert enums to strings
        scenario_dict['scenario_type'] = self.current_scenario.scenario_type.value
        
        for action in scenario_dict['actions']:
            action['type'] = ActionType(action['type']).value
        
        if scenario_dict['setup_actions']:
            for action in scenario_dict['setup_actions']:
                action['type'] = ActionType(action['type']).value
        
        if scenario_dict['teardown_actions']:
            for action in scenario_dict['teardown_actions']:
                action['type'] = ActionType(action['type']).value
        
        # Save as YAML
        with open(filepath, 'w', encoding='utf-8') as f:
            yaml.dump(scenario_dict, f, default_flow_style=False, allow_unicode=True)
        
        print(f"📄 Scenario saved: {filepath}")
        return str(filepath)
    
    @staticmethod
    def load_scenario(filepath: str) -> TestScenario:
        """Load scenario from file"""
        
        with open(filepath, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
        
        # Convert strings back to enums
        data['scenario_type'] = ScenarioType(data['scenario_type'])
        
        for action in data['actions']:
            action['type'] = ActionType(action['type'])
        
        if data.get('setup_actions'):
            for action in data['setup_actions']:
                action['type'] = ActionType(action['type'])
        
        if data.get('teardown_actions'):
            for action in data['teardown_actions']:
                action['type'] = ActionType(action['type'])
        
        # Convert actions back to dataclass
        data['actions'] = [TestAction(**action) for action in data['actions']]
        
        if data.get('setup_actions'):
            data['setup_actions'] = [TestAction(**action) for action in data['setup_actions']]
        
        if data.get('teardown_actions'):
            data['teardown_actions'] = [TestAction(**action) for action in data['teardown_actions']]
        
        return TestScenario(**data)
    
    @staticmethod
    def load_all_scenarios(scenarios_dir: str = "scenarios") -> List[TestScenario]:
        """Load all scenarios from directory"""
        
        scenarios = []
        scenarios_path = Path(scenarios_dir)
        
        if not scenarios_path.exists():
            return scenarios
        
        for file_path in scenarios_path.glob("*.yaml"):
            try:
                scenario = ScenarioBuilder.load_scenario(str(file_path))
                scenarios.append(scenario)
            except Exception as e:
                print(f"❌ Failed to load scenario {file_path}: {e}")
        
        return scenarios

# Predefined scenario templates
class ScenarioTemplates:
    """Common scenario templates"""
    
    @staticmethod
    def e_commerce_checkout() -> TestScenario:
        """E-commerce checkout flow"""
        
        builder = ScenarioBuilder()
        
        return (builder
                .create_scenario(
                    "ecommerce_checkout",
                    "E-commerce Checkout Flow",
                    "Complete checkout process from product selection to payment",
                    ScenarioType.FUNCTIONAL,
                    "https://demo.shop.com"
                )
                .add_action(ActionType.NAVIGATE, "/products", description="Navigate to products page")
                .add_action(ActionType.CLICK, "[data-testid='product-1']", description="Select first product")
                .add_action(ActionType.CLICK, "[data-testid='add-to-cart']", description="Add to cart")
                .add_action(ActionType.CLICK, "[data-testid='cart-icon']", description="Open cart")
                .add_action(ActionType.CLICK, "[data-testid='checkout-btn']", description="Proceed to checkout")
                .add_action(ActionType.INPUT, "[name='email']", "test@example.com", "Enter email")
                .add_action(ActionType.INPUT, "[name='address']", "123 Test St", "Enter address")
                .add_action(ActionType.CLICK, "[data-testid='place-order']", description="Place order")
                .add_action(ActionType.VERIFY, "[data-testid='order-confirmation']", 
                          expected_result="Order confirmation page displayed")
                .set_tags(["ecommerce", "checkout", "critical"])
                .set_priority(5)
                .set_timeout(600)
                .build())
    
    @staticmethod
    def login_flow() -> TestScenario:
        """User login flow"""
        
        builder = ScenarioBuilder()
        
        return (builder
                .create_scenario(
                    "user_login",
                    "User Login Flow",
                    "Standard user authentication flow",
                    ScenarioType.FUNCTIONAL,
                    "https://app.example.com"
                )
                .add_action(ActionType.NAVIGATE, "/login", description="Navigate to login page")
                .add_action(ActionType.INPUT, "[name='username']", "testuser", "Enter username")
                .add_action(ActionType.INPUT, "[name='password']", "password123", "Enter password")
                .add_action(ActionType.CLICK, "[type='submit']", description="Click login button")
                .add_action(ActionType.VERIFY, "[data-testid='dashboard']", 
                          expected_result="Dashboard loaded successfully")
                .set_tags(["auth", "login", "critical"])
                .set_priority(5)
                .build())
    
    @staticmethod
    def form_validation() -> TestScenario:
        """Form validation testing"""
        
        builder = ScenarioBuilder()
        
        return (builder
                .create_scenario(
                    "form_validation",
                    "Form Validation Testing",
                    "Test form validation with various input combinations",
                    ScenarioType.FUNCTIONAL,
                    "https://httpbin.org/forms/post"
                )
                .add_action(ActionType.CLICK, "[type='submit']", description="Submit empty form")
                .add_action(ActionType.VERIFY, ".error", expected_result="Validation errors displayed")
                .add_action(ActionType.INPUT, "[name='custname']", "Test User", "Enter valid name")
                .add_action(ActionType.INPUT, "[name='custtel']", "invalid-phone", "Enter invalid phone")
                .add_action(ActionType.CLICK, "[type='submit']", description="Submit with invalid data")
                .add_action(ActionType.VERIFY, ".error", expected_result="Phone validation error shown")
                .add_action(ActionType.INPUT, "[name='custtel']", "123-456-7890", "Enter valid phone")
                .add_action(ActionType.INPUT, "[name='custemail']", "test@example.com", "Enter valid email")
                .add_action(ActionType.CLICK, "[value='medium']", description="Select pizza size")
                .add_action(ActionType.CLICK, "[type='submit']", description="Submit valid form")
                .add_action(ActionType.VERIFY, "body", expected_result="Form submitted successfully")
                .set_tags(["validation", "forms", "medium"])
                .set_priority(3)
                .build())

# Test scenario system
def test_scenario_system():
    print("🎯 Testing Scenario System")
    print("=" * 50)
    
    # Create custom scenario
    builder = ScenarioBuilder()
    
    scenario = (builder
                .create_scenario(
                    "custom_test",
                    "Custom Website Test",
                    "Test custom website functionality",
                    ScenarioType.FUNCTIONAL,
                    "https://example.com"
                )
                .add_action(ActionType.NAVIGATE, "/", description="Load homepage")
                .add_action(ActionType.VERIFY, "h1", expected_result="Page title visible")
                .add_action(ActionType.SCREENSHOT, "body", description="Take homepage screenshot")
                .set_tags(["custom", "homepage"])
                .set_priority(2)
                .build())
    
    # Save scenario
    filepath = builder.save("custom_test.yaml")
    
    # Load scenario back
    loaded_scenario = ScenarioBuilder.load_scenario(filepath)
    print(f"✅ Scenario loaded: {loaded_scenario.name}")
    
    # Create predefined scenarios
    ecommerce = ScenarioTemplates.e_commerce_checkout()
    ScenarioBuilder().current_scenario = ecommerce
    ScenarioBuilder().save("ecommerce_checkout.yaml")
    
    login = ScenarioTemplates.login_flow()
    ScenarioBuilder().current_scenario = login
    ScenarioBuilder().save("user_login.yaml")
    
    validation = ScenarioTemplates.form_validation()
    ScenarioBuilder().current_scenario = validation
    ScenarioBuilder().save("form_validation.yaml")
    
    # Load all scenarios
    all_scenarios = ScenarioBuilder.load_all_scenarios()
    print(f"📁 Total scenarios available: {len(all_scenarios)}")
    
    for scenario in all_scenarios:
        print(f"  📄 {scenario.name} ({scenario.scenario_type.value}) - {len(scenario.actions)} actions")

if __name__ == "__main__":
    test_scenario_system()