# MCP Server cho Claude Desktop

## Giới thiệu
Đây là server MCP sử dụng FastMCP SDK, được thiết kế để tích hợp trực tiếp với Claude Desktop.

## Hướng dẫn sử dụng
1. **Cấu hình đường dẫn server trong Claude Desktop:**
   - Vào phần Settings của Claude Desktop
   - Chọn "Custom MCP Server" hoặc "MCP Servers"
   - Chọn đường dẫn tới file `mcp_server_claude.py` trên máy của bạn

2. **Đường dẫn cấu hình (thay thế theo máy của bạn):**
   - **Windows**: `path\to\your\file\mcp_server_claude.py`
   - **Mac/Linux**: `/path/to/your/file/mcp_server_claude.py`

3. **Yêu cầu thư viện:**
   - Claude Desktop sẽ tự động cài đặt các thư viện cần thiết
   - Nếu cần, bạn có thể cài đặt thủ công:
     ```bash
     pip install fastmcp python-dotenv requests
     ```

4. **Cấu hình API Key (nếu dùng tool thời tiết):**
   - Tạo file `.env` cùng thư mục với `mcp_server_claude.py`
   - Thêm dòng:
     ```
     OPENWEATHER_API_KEY=your_api_key_here
     ```

5. **Dữ liệu người dùng và hội thoại:**
   - Dữ liệu sẽ được lưu vào các file `users.json` và `conversations.json` trong cùng thư mục với script

## Lưu ý
- Đường dẫn file phải là đường dẫn tuyệt đối, phù hợp với từng máy
- **KHÔNG** chạy server này thủ công - Claude Desktop sẽ tự động quản lý
- Nếu gặp lỗi, hãy kiểm tra log của Claude Desktop hoặc file `users.json`, `conversations.json`

---

**Ví dụ đường dẫn cấu hình chính xác:**
- Windows: `path\to\your\file\mcp_server_claude.py`
- Mac/Linux: `/path/to/your/file/mcp_server_claude.py`

## Tính Năng

- **Quản lý Users**: Thêm, xem, lưu trữ thông tin người dùng
- **Quản lý Conversations**: Lưu và truy xuất lịch sử hội thoại
- **Thông tin thời tiết**: Lấy dữ liệu thời tiết thực tế từ OpenWeatherMap
- **Thời gian hiện tại**: Lấy thông tin thời gian máy chủ

## Cài Đặt

1. **Cài đặt dependencies (nếu cần):**
```bash
pip install fastmcp requests python-dotenv
```

2. **Tạo file .env (nếu dùng tool thời tiết):**
```
OPENWEATHER_API_KEY=your_api_key_here
```

3. **Cấu hình trong Claude Desktop:**
   - Vào Settings > MCP Servers
   - Thêm đường dẫn tới `mcp_server_claude.py`
   - Restart Claude Desktop

**Lưu ý:** Claude Desktop sẽ tự động chạy và quản lý server khi cần thiết. Không cần chạy server thủ công.

## Cấu Hình Claude Desktop (Chi Tiết)

### Bước 1: Tìm thư mục Claude Desktop
- **Windows**: `C:\Users\[Username]\AppData\Local\AnthropicClaude\app-[version]`
- **macOS**: `~/Library/Application Support/AnthropicClaude/app-[version]`
- **Linux**: `~/.config/AnthropicClaude/app-[version]`

### Bước 2: Tìm file config
Tìm file `claude_desktop_config.json` trong thư mục Claude Desktop.

### Bước 3: Sửa file config
Thêm cấu hình MCP server vào file `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mcp-weather-tools": {
      "command": "python",
      "args": [
        "path\\to\\your\\file\\mcp_server_claude.py"
      ],
      "cwd": "path\\to\\your\\file",
      "env": {
        "OPENWEATHER_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

**Lưu ý:** Thay đổi `path\to\your\file` thành đường dẫn thực tế trên máy của bạn.

### Bước 4: Restart Claude Desktop
- Đóng hoàn toàn Claude Desktop
- Mở lại Claude Desktop
- Kiểm tra trong Settings > MCP Servers có server mới

### Bước 5: Kiểm tra kết nối
Trong Claude Desktop, thử gọi tool:
```
get_current_time
```

## Cấu Trúc Dữ Liệu và Đường Dẫn

### File Dữ Liệu
- **users.json**: Lưu thông tin người dùng
- **conversations.json**: Lưu lịch sử hội thoại

### Đường Dẫn File
```
path\to\your\file\
├── mcp_server_claude.py
├── users.json
├── conversations.json
├── .env (tùy chọn)
└── README.md
```

**Lưu ý:** Thay đổi `path\to\your\file` thành đường dẫn thực tế trên máy của bạn.

### Truy Cập Dữ Liệu
1. **Xem tất cả users:**
```
list_all_users
```

2. **Xem tất cả conversations:**
```
list_all_ids(type="conversations")
```

3. **Lấy thông tin user cụ thể:**
```
get_user_data("user_id")
```

4. **Lấy conversation cụ thể:**
```
get_conversation("conversation_id")
```

## Tools Available

### User Management
- `save_user_data(user_id, data)` - Lưu thông tin user
- `get_user_data(user_id)` - Lấy thông tin user
- `list_all_users()` - Xem danh sách tất cả users
- `list_all_ids(type="users")` - Xem danh sách user IDs

### Conversation Management
- `save_conversation(conversation_id, messages)` - Lưu cuộc hội thoại
- `get_conversation(conversation_id)` - Lấy cuộc hội thoại
- `list_all_conversations()` - Xem danh sách tất cả conversations
- `list_all_ids(type="conversations")` - Xem danh sách conversation IDs

### Utility Tools
- `get_real_weather(city, units)` - Lấy thông tin thời tiết
- `get_current_time()` - Lấy thời gian hiện tại
- `debug_file_info()` - Kiểm tra trạng thái hệ thống
- `reload_data()` - Reload dữ liệu từ file

## Ví Dụ Sử Dụng

### Thêm User
```
Thêm user mới:
- User ID: user001
- Tên: Nguyễn Văn A
- Tuổi: 25
- Email: nguyen.a@example.com
- Kỹ năng: ["Python", "JavaScript"]
- Sở thích: ["Lập trình", "Đọc sách"]
```

### Lưu Conversation
```
Lưu cuộc hội thoại:
- Conversation ID: chat_001
- Messages: [
  {"role": "user", "content": "Xin chào"},
  {"role": "assistant", "content": "Chào bạn! Tôi có thể giúp gì?"}
]
```

### Lấy Thông Tin Thời Tiết
```
Lấy thời tiết Hà Nội:
- City: Hanoi
- Units: metric
```

## Cấu Trúc Dữ Liệu

### User Data
```json
{
  "user_id": {
    "data": {
      "name": "Tên user",
      "age": 25,
      "email": "email@example.com",
      "skills": ["Kỹ năng 1", "Kỹ năng 2"],
      "interests": ["Sở thích 1", "Sở thích 2"]
    },
    "updated_at": "2025-06-24T16:20:37.581261"
  }
}
```

### Conversation Data
```json
{
  "conversation_id": {
    "messages": [
      {"role": "user", "content": "Nội dung tin nhắn"},
      {"role": "assistant", "content": "Phản hồi"}
    ],
    "updated_at": "2025-06-24T16:20:37.581261"
  }
}
```

## Kiểm Tra và Debug

### Kiểm tra trạng thái hệ thống:
```
debug_file_info
```

### Reload dữ liệu từ file:
```
reload_data
```

### Xem danh sách tất cả ID:
```
list_all_ids(type="all")
```

## Lưu Ý

- **Encoding**: Hỗ trợ UTF-8 cho tiếng Việt có dấu
- **File Storage**: Dữ liệu được lưu trong `users.json` và `conversations.json`
- **API Key**: Cần OpenWeather API key để sử dụng weather tool
- **Windows**: Tương thích với Windows console
- **Đường dẫn**: Đảm bảo đường dẫn trong config đúng với máy của bạn

## Troubleshooting

- **Lỗi encoding**: Đã được sửa, không sử dụng emoji trong print statements
- **File path**: Sử dụng absolute path để tránh lỗi thư mục
- **Server restart**: Restart server sau khi thay đổi code
- **Config không load**: Kiểm tra đường dẫn và restart Claude Desktop
- **Tools không hiện**: Kiểm tra MCP server có đang chạy không

## Hỗ Trợ

Nếu gặp vấn đề, sử dụng:
- `debug_file_info()` - Kiểm tra trạng thái hệ thống
- `reload_data()` - Reload dữ liệu từ file



