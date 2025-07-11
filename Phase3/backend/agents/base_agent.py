# backend/agents/base_agent.py
import asyncio
import logging
import logging.handlers
import os
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from datetime import datetime

from browser_use import Agent
from browser_use.llm import ChatAnthropic
from ..utils.config import Config

# Setup logging with file handler
def setup_logging():
    """Setup logging configuration with file and console handlers"""
    # Create logs directory if it doesn't exist
    os.makedirs(Config.LOG_DIR, exist_ok=True)
    
    # Create logger
    logger = logging.getLogger()
    logger.setLevel(getattr(logging, Config.LOG_LEVEL))
    
    # Clear existing handlers
    logger.handlers.clear()
    
    # Create formatters
    file_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    console_formatter = logging.Formatter(
        '%(levelname)s - %(name)s - %(message)s'
    )
    
    # File handler with rotation
    log_file_path = os.path.join(Config.LOG_DIR, Config.LOG_FILE)
    file_handler = logging.handlers.RotatingFileHandler(
        log_file_path,
        maxBytes=Config.LOG_MAX_SIZE,
        backupCount=Config.LOG_BACKUP_COUNT,
        encoding='utf-8'
    )
    file_handler.setLevel(getattr(logging, Config.LOG_LEVEL))
    file_handler.setFormatter(file_formatter)
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(getattr(logging, Config.LOG_LEVEL))
    console_handler.setFormatter(console_formatter)
    
    # Add handlers to logger
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)

class BaseTestAgent(ABC):
    """Base class cho tất cả test agents"""
    
    def __init__(self, model: str = None):
        self.model = model or Config.CLAUDE_MODEL
        self.llm = ChatAnthropic(
            model=self.model,
            api_key=Config.ANTHROPIC_API_KEY
        )
        self.agent = None
        self.last_result = None
        
    async def create_agent(self, task: str, system_prompt: str = None, **kwargs) -> Agent:
        """Tạo Browser Use agent với task cụ thể và system prompt tùy chọn"""
        logger.info(f"Creating agent with task: {task[:100]}...")
        
        agent_kwargs = {
            "task": task,
            "llm": self.llm,
            **kwargs
        }
        
        # Add system prompt if provided
        if system_prompt:
            agent_kwargs["system_prompt"] = system_prompt
            logger.info(f"Using specialized system prompt for agent")
        
        return Agent(**agent_kwargs)
        
    @abstractmethod
    async def execute_task(self, task: str) -> Dict[str, Any]:
        """Thực thi task - phải implement trong subclass"""
        pass
        
    async def run_with_retry(self, task: str, max_retries: int = 2) -> Dict[str, Any]:
        """Chạy task với retry logic"""
        for attempt in range(max_retries + 1):
            try:
                logger.info(f"Attempt {attempt + 1}/{max_retries + 1}")
                result = await self.execute_task(task)
                return result
                
            except Exception as e:
                logger.error(f"Attempt {attempt + 1} failed: {e}")
                if attempt == max_retries:
                    return {
                        "status": "error",
                        "error": str(e),
                        "attempts": attempt + 1,
                        "timestamp": datetime.now().isoformat()
                    }
                    
                # Wait before retry
                await asyncio.sleep(2 ** attempt)
                
    def get_last_result(self) -> Optional[Dict[str, Any]]:
        """Lấy kết quả của lần chạy cuối"""
        return self.last_result