import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
    CLAUDE_MODEL = "claude-3-5-sonnet-20241022"
    
    # Browser settings
    BROWSER_HEADLESS = os.getenv("BROWSER_HEADLESS", "false").lower() == "true"
    SCREENSHOT_DIR = "screenshots"
    
    # Logging
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    LOG_DIR = "logs"
    LOG_FILE = "ai_agent.log"
    LOG_MAX_SIZE = 10 * 1024 * 1024  # 10MB
    LOG_BACKUP_COUNT = 5
    
    @classmethod
    def validate(cls):
        """Validate required config"""
        if not cls.ANTHROPIC_API_KEY:
            raise ValueError("ANTHROPIC_API_KEY is required")
        
        # Create logs directory if it doesn't exist
        os.makedirs(cls.LOG_DIR, exist_ok=True)
        
        return True

# Validate config on import
Config.validate()