#!/usr/bin/env python3
"""
MCP Server sử dụng FastMCP SDK - Tương thích với Claude Desktop
"""

import os
import requests
import json
import sys
from datetime import datetime
from typing import Dict, Any, List
from dotenv import load_dotenv

# Import FastMCP SDK
from mcp.server.fastmcp import FastMCP

# Load environment variables
load_dotenv()

# Initialize FastMCP server
mcp = FastMCP("weather-tools-server")

# Define absolute paths for data files
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
USERS_FILE = os.path.join(SCRIPT_DIR, "users.json")
CONVERSATIONS_FILE = os.path.join(SCRIPT_DIR, "conversations.json")

# Data storage
data_storage = {
    "users": {},
    "conversations": {}
}

def load_data_from_file(filename: str) -> Dict:
    """Load data from JSON file"""
    if os.path.exists(filename):
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading {filename}: {str(e)}")
            return {}
    return {}

def save_data_to_file(filename: str, data: Dict):
    """Save data to JSON file"""
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Error saving {filename}: {str(e)}")

# Load existing data
data_storage["users"] = load_data_from_file(USERS_FILE)
data_storage["conversations"] = load_data_from_file(CONVERSATIONS_FILE)

@mcp.tool()
def get_real_weather(city: str, units: str = "metric") -> Dict[str, Any]:
    """
    Lấy thông tin thời tiết thực tế từ OpenWeatherMap API
    
    Args:
        city: Tên thành phố
        units: Đơn vị nhiệt độ (metric/imperial)
    
    Returns:
        Dict chứa thông tin thời tiết
    """
    weather_api_key = os.getenv('OPENWEATHER_API_KEY')
    
    if not weather_api_key:
        return {
            "status": "error",
            "message": "OpenWeather API key not found. Please set OPENWEATHER_API_KEY in .env file"
        }

    try:
        # Gọi OpenWeatherMap API
        url = f"http://api.openweathermap.org/data/2.5/weather"
        params = {
            "q": city,
            "appid": weather_api_key,
            "units": units,
            "lang": "vi"  # Ngôn ngữ tiếng Việt
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        data = response.json()
        
        # Xử lý và định dạng dữ liệu
        weather_info = {
            "status": "success",
            "city": data["name"],
            "country": data["sys"]["country"],
            "temperature": {
                "current": data["main"]["temp"],
                "feels_like": data["main"]["feels_like"],
                "min": data["main"]["temp_min"],
                "max": data["main"]["temp_max"]
            },
            "humidity": data["main"]["humidity"],
            "pressure": data["main"]["pressure"],
            "weather": {
                "main": data["weather"][0]["main"],
                "description": data["weather"][0]["description"],
                "icon": data["weather"][0]["icon"]
            },
            "wind": {
                "speed": data["wind"]["speed"],
                "direction": data["wind"].get("deg", "N/A")
            },
            "clouds": data["clouds"]["all"],
            "timestamp": datetime.fromtimestamp(data["dt"]).isoformat()
        }
        
        return weather_info
        
    except requests.exceptions.RequestException as e:
        return {
            "status": "error",
            "message": f"Error getting weather data: {str(e)}"
        }
    except (KeyError, ValueError) as e:
        return {
            "status": "error",
            "message": f"Error parsing weather data: {str(e)}"
        }

@mcp.tool()
def get_current_time() -> Dict[str, Any]:
    """
    Lấy thời gian hiện tại của máy chủ
    
    Returns:
        Dict chứa thời gian hiện tại
    """
    now = datetime.now()
    
    time_info = {
        "status": "success",
        "datetime": now.isoformat(),
        "date": now.strftime("%Y-%m-%d"),
        "time": now.strftime("%H:%M:%S"),
        "day_of_week": now.strftime("%A"),
        "day_of_year": now.timetuple().tm_yday,
        "week_number": now.isocalendar()[1],
        "timezone": "Local Server Time",
        "timestamp": now.timestamp()
    }
    
    return time_info

@mcp.tool()
def save_user_data(user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Lưu dữ liệu của người dùng vào bộ nhớ
    
    Args:
        user_id: User ID
        data: Dữ liệu người dùng cần lưu
    
    Returns:
        Dict chứa thông tin trạng thái lưu
    """
    try:
        data_storage["users"][user_id] = {
            "data": data,
            "updated_at": datetime.now().isoformat()
        }
        
        # Lưu vào file
        save_data_to_file(USERS_FILE, data_storage["users"])
        
        return {
            "status": "success",
            "user_id": user_id,
            "updated_at": data_storage["users"][user_id]["updated_at"],
            "message": f"User {user_id} saved successfully"
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error saving user data: {str(e)}"
        }

@mcp.tool()
def get_user_data(user_id: str) -> Dict[str, Any]:
    """
    Lấy dữ liệu của người dùng từ bộ nhớ
    
    Args:
        user_id: User ID
    
    Returns:
        Dict chứa dữ liệu người dùng
    """
    if user_id not in data_storage["users"]:
        return {
            "status": "error",
            "message": f"User {user_id} not found"
        }
    return {
        "status": "success",
        "user_id": user_id,
        "data": data_storage["users"][user_id]["data"],
        "updated_at": data_storage["users"][user_id]["updated_at"]
    }

@mcp.tool()
def save_conversation(conversation_id: str, messages: List[Dict[str, str]]) -> Dict[str, Any]:
    """
    Lưu lịch sử cuộc hội thoại
    
    Args:
        conversation_id: ID cuộc hội thoại
        messages: Danh sách tin nhắn
    
    Returns:
        Dict chứa thông tin trạng thái lưu
    """
    try:
        data_storage["conversations"][conversation_id] = {
            "messages": messages,
            "updated_at": datetime.now().isoformat()
        }
        
        # Lưu vào file
        save_data_to_file(CONVERSATIONS_FILE, data_storage["conversations"])
        
        return {
            "status": "success",
            "conversation_id": conversation_id,
            "message_count": len(messages),
            "updated_at": data_storage["conversations"][conversation_id]["updated_at"]
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error saving conversation: {str(e)}"
        }

@mcp.tool()
def get_conversation(conversation_id: str) -> Dict[str, Any]:
    """
    Lấy lịch sử cuộc hội thoại
    
    Args:
        conversation_id: ID cuộc hội thoại
    
    Returns:
        Dict chứa lịch sử cuộc hội thoại
    """
    try:
        if conversation_id not in data_storage["conversations"]:
            return {
                "status": "error",
                "message": f"Conversation {conversation_id} not found"
            }
        
        conversation = data_storage["conversations"][conversation_id]
        return {
            "status": "success",
            "conversation_id": conversation_id,
            "messages": conversation["messages"],
            "updated_at": conversation["updated_at"]
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error getting conversation: {str(e)}"
        }

@mcp.tool()
def list_all_users() -> Dict[str, Any]:
    """
    Hiển thị danh sách tất cả users với thông tin chi tiết
    
    Returns:
        Dict chứa danh sách users với thông tin
    """
    try:
        users_list = []
        for user_id, user_info in data_storage["users"].items():
            user_data = user_info["data"]
            users_list.append({
                "user_id": user_id,
                "name": user_data.get("name", "Unknown"),
                "age": user_data.get("age", "N/A"),
                "email": user_data.get("email", "N/A"),
                "university": user_data.get("university", "N/A"),
                "major": user_data.get("major", "N/A"),
                "interests": user_data.get("interests", []),
                "skills": user_data.get("skills", []),
                "updated_at": user_info["updated_at"]
            })
        
        return {
            "status": "success",
            "count": len(users_list),
            "users": users_list
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error listing users: {str(e)}"
        }

@mcp.tool()
def list_all_conversations() -> Dict[str, Any]:
    """
    Hiển thị danh sách tất cả conversations với thông tin chi tiết
    
    Returns:
        Dict chứa danh sách conversations với thông tin
    """
    try:
        conversations_list = []
        for conversation_id, conversation_info in data_storage["conversations"].items():
            messages = conversation_info["messages"]
            conversations_list.append({
                "conversation_id": conversation_id,
                "message_count": len(messages),
                "first_message": messages[0]["content"][:100] + "..." if messages and len(messages[0]["content"]) > 100 else messages[0]["content"] if messages else "No messages",
                "last_message": messages[-1]["content"][:100] + "..." if messages and len(messages[-1]["content"]) > 100 else messages[-1]["content"] if messages else "No messages",
                "updated_at": conversation_info["updated_at"]
            })
        
        return {
            "status": "success",
            "count": len(conversations_list),
            "conversations": conversations_list
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error listing conversations: {str(e)}"
        }

@mcp.tool()
def list_all_ids(type: str = "all") -> Dict[str, Any]:
    """
    Liệt kê tất cả ID của users hoặc conversations
    
    Args:
        type: Loại ID cần liệt kê ("users", "conversations", "all")
    
    Returns:
        Dict chứa danh sách ID
    """
    try:
        result = {}
        
        if type in ["users", "all"]:
            result["users"] = list(data_storage["users"].keys())
        
        if type in ["conversations", "all"]:
            result["conversations"] = list(data_storage["conversations"].keys())
        
        return {
            "status": "success",
            "type": type,
            "counts": {
                "users": len(result.get("users", [])),
                "conversations": len(result.get("conversations", []))
            },
            "ids": result
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error listing IDs: {str(e)}"
        }

@mcp.tool()
def debug_file_info() -> Dict[str, Any]:
    """
    Kiểm tra trạng thái hệ thống và file dữ liệu
    
    Returns:
        Dict chứa thông tin debug
    """
    try:
        users_file_exists = os.path.exists(USERS_FILE)
        conversations_file_exists = os.path.exists(CONVERSATIONS_FILE)
        
        users_file_size = os.path.getsize(USERS_FILE) if users_file_exists else 0
        conversations_file_size = os.path.getsize(CONVERSATIONS_FILE) if conversations_file_exists else 0
        
        return {
            "status": "success",
            "script_directory": SCRIPT_DIR,
            "files": {
                "users_file": {
                    "path": USERS_FILE,
                    "exists": users_file_exists,
                    "size_bytes": users_file_size
                },
                "conversations_file": {
                    "path": CONVERSATIONS_FILE,
                    "exists": conversations_file_exists,
                    "size_bytes": conversations_file_size
                }
            },
            "memory_data": {
                "users_count": len(data_storage["users"]),
                "conversations_count": len(data_storage["conversations"])
            },
            "environment": {
                "python_version": sys.version,
                "openweather_api_key_set": bool(os.getenv('OPENWEATHER_API_KEY'))
            }
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error getting debug info: {str(e)}"
        }

@mcp.tool()
def reload_data() -> Dict[str, Any]:
    """
    Reload dữ liệu từ file vào bộ nhớ
    
    Returns:
        Dict chứa thông tin trạng thái reload
    """
    try:
        # Reload data from files
        data_storage["users"] = load_data_from_file(USERS_FILE)
        data_storage["conversations"] = load_data_from_file(CONVERSATIONS_FILE)
        
        return {
            "status": "success",
            "message": "Data reloaded successfully",
            "counts": {
                "users": len(data_storage["users"]),
                "conversations": len(data_storage["conversations"])
            }
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error reloading data: {str(e)}"
        }

if __name__ == "__main__":
    try:
        print("Starting MCP Server for Claude Desktop...")
        print(f"Loaded {len(data_storage['users'])} users and {len(data_storage['conversations'])} conversations")
        print("Available tools:")
        print("- get_real_weather")
        print("- get_current_time")
        print("- save_user_data")
        print("- get_user_data")
        print("- save_conversation")
        print("- get_conversation")
        print("- list_all_users")
        print("- list_all_conversations")
        print("- list_all_ids")
        print("- debug_file_info")
        print("- reload_data")
        
        # Run the server
        mcp.run()
        
    except KeyboardInterrupt:
        print("\nServer stopped by user")
    except Exception as e:
        print(f"Server error: {str(e)}")
        sys.exit(1)