import asyncio
import subprocess
import logging
from typing import Dict, Any, Optional
from pathlib import Path

logger = logging.getLogger(__name__)

class PlaywrightMCPClient:
    """Client để tương tác với Playwright MCP Server - Windows Compatible"""
    
    def __init__(self, config_path: str = None):
        # Auto-detect config file location
        if config_path is None:
            project_root = Path(__file__).parent.parent.parent
            config_path = project_root / "mcp-config.json"
            
            if not config_path.exists():
                config_path = Path("mcp-config.json")
        else:
            config_path = Path(config_path)
        
        self.config_path = config_path
        self.process = None
        self.is_running = False
        
        logger.info(f"Using config file: {self.config_path.absolute()}")
        
    async def start_server(self, port: int = 3001, headless: bool = True) -> bool:
        """Start MCP server với Windows compatibility"""
        try:
            # Check if config file exists
            if not self.config_path.exists():
                logger.error(f"Config file missing: {self.config_path}")
                print(f"❌ Config file missing: {self.config_path}")
                return False
            
            print(f"✅ Config file found: {self.config_path.absolute()}")
            
            # Prepare command
            cmd = [
                "npx", "@playwright/mcp@latest",
                "--config", str(self.config_path.absolute()),
                "--port", str(port)
            ]
            
            if headless:
                cmd.append("--headless")
            
            logger.info(f"Starting MCP server with command: {' '.join(cmd)}")
            print(f"🚀 Starting MCP server...")
            print(f"📝 Command: {' '.join(cmd)}")
            print(f"🌐 Port: {port}")
            print(f"👁️ Headless: {headless}")
            
            # Start process với shell=True cho Windows
            self.process = subprocess.Popen(
                cmd,
                shell=True,  # Key fix for Windows PATH issues
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            # Wait for server to start
            print("⏳ Waiting for server to start...")
            await asyncio.sleep(8)  # Give more time for startup
            
            # Check if process is still running
            if self.process.poll() is None:
                self.is_running = True
                logger.info(f"MCP Server started successfully on port {port}")
                print(f"✅ MCP Server started successfully!")
                print(f"🌐 Server running on port {port}")
                return True
            else:
                # Process exited, get error
                stdout, stderr = self.process.communicate()
                logger.error(f"MCP Server failed to start. Stdout: {stdout}, Stderr: {stderr}")
                print(f"❌ MCP Server failed to start")
                if stdout:
                    print(f"📤 Stdout: {stdout}")
                if stderr:
                    print(f"📥 Stderr: {stderr}")
                return False
                
        except Exception as e:
            logger.error(f"Error starting MCP server: {e}")
            print(f"❌ Error starting MCP server: {e}")
            return False
    
    async def stop_server(self):
        """Stop MCP server"""
        if self.process and self.is_running:
            print("🛑 Stopping MCP Server...")
            self.process.terminate()
            await asyncio.sleep(2)
            if self.process.poll() is None:
                self.process.kill()
            self.is_running = False
            logger.info("MCP Server stopped")
            print("✅ MCP Server stopped")
    
    async def health_check(self) -> bool:
        """Check if MCP server is healthy"""
        is_healthy = self.is_running and (self.process.poll() is None)
        
        if is_healthy:
            print("🏥 Health check: ✅ Healthy")
        else:
            print("🏥 Health check: ❌ Unhealthy")
            
        return is_healthy
    
    async def restart_server(self, port: int = 3001, headless: bool = True) -> bool:
        """Restart MCP server"""
        print("🔄 Restarting MCP Server...")
        
        if self.is_running:
            await self.stop_server()
            await asyncio.sleep(2)
        
        return await self.start_server(port, headless)
    
    def get_server_info(self) -> Dict[str, Any]:
        """Get server information"""
        return {
            "is_running": self.is_running,
            "config_path": str(self.config_path.absolute()),
            "process_id": self.process.pid if self.process else None,
            "process_running": self.process.poll() is None if self.process else False
        }

# Enhanced test function
async def test_mcp_client():
    """Test MCP Client với comprehensive checks"""
    print("🎭 Testing Enhanced MCP Client")
    print("=" * 50)
    
    # Check current directory
    print(f"📁 Working directory: {Path.cwd()}")
    
    # Initialize client
    print("\n🤖 Initializing MCP Client...")
    client = PlaywrightMCPClient()
    
    # Show server info
    print("\n📊 Server Info:")
    info = client.get_server_info()
    for key, value in info.items():
        print(f"   {key}: {value}")
    
    # Start server
    print("\n🚀 Starting MCP Server...")
    success = await client.start_server(port=3001, headless=True)
    
    if success:
        # Health check
        await client.health_check()
        
        # Show updated info
        print("\n📊 Updated Server Info:")
        info = client.get_server_info()
        for key, value in info.items():
            print(f"   {key}: {value}")
        
        # Keep running for demo
        print("\n⏳ Server will run for 10 seconds for demo...")
        await asyncio.sleep(10)
        
        # Stop server
        await client.stop_server()
        print("\n✅ Test completed successfully!")
        
        return True
    else:
        print("\n❌ Test failed - MCP Server did not start")
        return False

# Additional utility functions
async def quick_mcp_test(port: int = 3001):
    """Quick test without detailed logging"""
    client = PlaywrightMCPClient()
    
    print(f"🚀 Quick MCP test on port {port}")
    
    success = await client.start_server(port=port)
    if success:
        await asyncio.sleep(5)
        await client.stop_server()
        print("✅ Quick test passed!")
        return True
    else:
        print("❌ Quick test failed!")
        return False

if __name__ == "__main__":
    # Set up basic logging
    logging.basicConfig(level=logging.INFO)
    
    # Run main test
    asyncio.run(test_mcp_client())