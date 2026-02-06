# AI Agent Testing Platform

Một nền tảng tự động hóa kiểm thử web sử dụng AI Agents với khả năng thực hiện các test case phức tạp thông qua browser automation.

## Tổng quan

Dự án này kết hợp công nghệ AI (Claude, GPT) với browser automation (Playwright + Browser Use) để tạo ra một hệ thống kiểm thử web thông minh. AI agents có thể hiểu yêu cầu test bằng ngôn ngữ tự nhiên và thực hiện các hành động phức tạp trên website thông qua Browser Use - một thư viện AI-powered browser automation.

##  Windows Compatibility & WSL Setup

### Vấn đề với Playwright trên Windows

**NotImplementedError** là lỗi thường gặp khi chạy Playwright và Browser Use trên Windows. Nguyên nhân chính:

1. **Platform Dependencies**: Playwright và Browser Use có một số dependencies không được implement đầy đủ trên Windows
2. **Browser Process Management**: Windows có cách quản lý process khác với Unix-based systems
3. **Display Server**: Browser automation cần X server hoặc display server tương tự
4. **File System Permissions**: Windows có cơ chế permission khác với Linux

### Giải pháp: Sử dụng WSL (Windows Subsystem for Linux)

**WSL là giải pháp được khuyến nghị** để chạy project này trên Windows:

#### Lợi ích của WSL:
-  **Full Linux Environment**: Chạy trong môi trường Linux hoàn chỉnh
-  **Native Browser Support**: Playwright hoạt động tự nhiên như trên Linux
-  **Better Performance**: Ít overhead hơn so với VM
-  **Seamless Integration**: Tích hợp tốt với Windows file system

#### Setup WSL Environment:

**Bước 1: Cài đặt WSL**
```bash
# Mở PowerShell với quyền Administrator
wsl --install
# Restart máy tính sau khi cài đặt
```

**Bước 2: Setup Project trong WSL**
```bash
# Mở WSL terminal
wsl

# Navigate to project directory
cd /mnt/c/Users/Admin/Desktop/Code\ stage/MCP\&AIAgent/Intern/Phase3

# Chạy setup script
chmod +x setup_wsl_environment.sh
./setup_wsl_environment.sh
```

**Bước 3: Test WSL Setup**
```bash
# Test environment
python test_wsl_setup.py
```

#### Sử dụng Project trong WSL:

```bash
# Mở WSL
wsl

# Navigate to project
cd /mnt/c/Users/Admin/Desktop/Code\ stage/MCP\&AIAgent/Intern/Phase3

# Activate virtual environment
source wsl-env/bin/activate

# Chạy backend
python backend/run_server.py
```

#### Troubleshooting WSL:

**Nếu gặp lỗi permission:**
```bash
# Fix file permissions
chmod -R 755 .
```

**Nếu browser không launch:**
```bash
# Install additional dependencies
sudo apt update
sudo apt install -y xvfb
```

**Nếu gặp lỗi network:**
```bash
# Check WSL network
ip addr show
```


## Kiến trúc Hệ thống

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   AI Services   │
│   (React)       │◄──►│   (FastAPI)     │◄──►│   (Claude/GPT)  │
│                 │    │                 │    │                 │
│ • Dashboard     │    │ • Agent Manager │    │ • Task Analysis │
│ • Test Runner   │    │ • Test Engine   │    │ • Action Plan   │
│ • Results View  │    │ • WebSocket     │    │ • Execution     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Browser       │
                       │   (Playwright)  │
                       │                 │
                       │ • Navigation    │
                       │ • Interaction   │
                       │ • Screenshots   │
                       └─────────────────┘
```

## Tính năng Đã Hoàn thành

### 🔧 Backend Features (Hoàn thành)
- ** AI Agent System**: Hệ thống AI agents có thể hiểu và thực hiện test cases
- ** Browser Automation**: Tự động điều khiển browser với Playwright
- ** Test Engine**: Engine xử lý và thực thi test cases
- ** Test Results Management**: Quản lý và phân tích kết quả test
- ** WebSocket Server**: Kết nối real-time với frontend
- ** Database Integration**: SQLAlchemy ORM với SQLite/PostgreSQL
- ** API Endpoints**: RESTful API với FastAPI
- ** Logging System**: Hệ thống logging chi tiết
- ** Configuration Management**: Quản lý cấu hình linh hoạt

###  Testing Capabilities (Backend)
- **Functional Testing**: Test các chức năng cơ bản của website
- **UI Testing**: Kiểm tra giao diện người dùng
- **Cross-browser Testing**: Test trên nhiều browser khác nhau
- **Responsive Testing**: Kiểm tra responsive design
- **Performance Testing**: Đo lường hiệu suất website
- **Form Testing**: Test các form và validation
- **Screenshot Capture**: Tự động chụp màn hình
- **Error Handling**: Xử lý lỗi thông minh

###  Frontend Features (Chưa hoàn thiện)
- ** Modern React UI**: Giao diện hiện đại với Material-UI 
- ** Dark Theme**: Giao diện tối với theme tùy chỉnh 
- ** Responsive Design**: Tương thích với mọi thiết bị 
- ** Real-time Updates**: Cập nhật real-time qua WebSocket 
- ** Interactive Components**: Components tương tác cao 
- ** Dashboard**: Hiển thị thông tin test và kết quả 
- ** Test Runner**: Giao diện chạy test 
- ** Results Viewer**: Xem kết quả test chi tiết 
- ** Reports**: Báo cáo và phân tích kết quả

###  Technical Stack
- **Frontend**: React 18, TypeScript, Material-UI, Axios
- **Backend**: FastAPI, Python, SQLAlchemy, WebSocket
- **AI**: Anthropic Claude, OpenAI GPT
- **Browser Automation**: Playwright + Browser Use (AI-powered)
- **Database**: SQLite (development), PostgreSQL (chưa hoàn thiện)


##  Cài đặt và Chạy

### Yêu cầu hệ thống
- Python 3.11+
- Node.js 18+
- Git

### Backend Setup
```bash
# Clone repository
git clone <repository-url>
cd AI-Agent-automation-tests-web

# Tạo virtual environment
python -m venv ai-agents-env
source ai-agents-env/bin/activate  # Linux/Mac
# hoặc
ai-agents-env\Scripts\activate     # Windows

# Cài đặt dependencies
pip install -r requirements.txt

# Tạo file .env
cp .env.example .env
# Chỉnh sửa .env với API keys của bạn

# Chạy backend
cd backend
python run_server.py
```

### Frontend Setup
```bash
# Cài đặt dependencies
cd frontend
npm install

# Tạo file .env
cp .env.example .env
# Chỉnh sửa REACT_APP_API_URL nếu cần

# Chạy frontend
npm start
```

### Environment Variables
Tạo file `.env` với các biến sau:
```env
# AI API Keys
ANTHROPIC_API_KEY=your_anthropic_api_key
OPENAI_API_KEY=your_openai_api_key

# Database
DATABASE_URL=sqlite:///./test_results.db

# Server
HOST=localhost
PORT=8000
DEBUG=true
```

## 📁 Cấu trúc Dự án

```
AI-Agent-automation-tests-web/
├── 📁 backend/                 # FastAPI Backend
│   ├── 📁 agents/             # AI Agent implementations
│   ├── 📁 api/                # REST API endpoints
│   ├── 📁 automation/         # Browser automation
│   ├── 📁 database/           # Database models
│   ├── 📁 scenarios/          # Test scenarios
│   └── 📁 utils/              # Utility functions
├── 📁 frontend/               # React Frontend
│   ├── 📁 src/
│   │   ├── 📁 components/     # React components
│   │   ├── 📁 pages/          # Page components
│   │   ├── 📁 services/       # API services
│   │   ├── 📁 types/          # TypeScript types
│   │   └── 📁 utils/          # Utility functions
│   └── 📁 public/             # Static files
├── 📁 tests/                  # Test files
├── 📁 scenarios/              # Test scenarios
├── 📁 reports/                # Test reports
└── 📁 docs/                   # Documentation
```

## Cách Sử dụng

### 1. Tạo Test Case
1. Mở ứng dụng và đi đến "Test Runner"
2. Chọn loại test (Functional, UI, Custom)
3. Nhập URL website cần test
4. Mô tả các hành động cần thực hiện bằng ngôn ngữ tự nhiên
5. Click "Run Test"

**Ví dụ mô tả test:**
- "Login vào website và kiểm tra dashboard"
- "Điền form đăng ký với thông tin mẫu"
- "Tìm kiếm sản phẩm và thêm vào giỏ hàng"

### 2. Theo dõi Quá trình Test
- Dashboard hiển thị real-time progress
- WebSocket cập nhật trạng thái test
- Screenshots được chụp tự động

### 3. Xem Kết quả
- Kết quả chi tiết với screenshots
- Phân tích performance
- Export báo cáo

##  Tính năng Chi tiết

###  AI Agent System
- **Base Agent**: Agent cơ bản với khả năng xử lý task
- **Test Agent**: Agent chuyên về testing
- **Enhanced Agent**: Agent nâng cao với nhiều tính năng
- **Agent Manager**: Quản lý và điều phối các agents

###  Browser Automation
- **Playwright Integration**: Sử dụng Playwright cho browser control cơ bản
- **Browser Use**: AI-powered browser automation cho các tác vụ phức tạp
- **Natural Language Commands**: Điều khiển browser bằng ngôn ngữ tự nhiên
- **Screenshot Capture**: Tự động chụp màn hình
- **Error Handling**: Xử lý lỗi thông minh
- **Context Awareness**: AI hiểu context của trang web

#### Browser Use Integration
Browser Use là thư viện AI-powered browser automation cho phép:
- **Natural Language Control**: "Click the login button", "Fill the form with user data"
- **Context Understanding**: AI hiểu layout và elements trên trang
- **Adaptive Actions**: Tự động thích ứng với thay đổi UI
- **Intelligent Navigation**: Tìm và tương tác với elements một cách thông minh
- **Error Recovery**: Tự động xử lý lỗi và thử lại với cách khác

###  Real-time Features
- **WebSocket Connection**: Kết nối real-time
- **Live Updates**: Cập nhật trạng thái live
- **Progress Tracking**: Theo dõi tiến độ test
- **Status Monitoring**: Giám sát trạng thái agents


##  Acknowledgments

- [Anthropic](https://www.anthropic.com/) - Claude AI
- [OpenAI](https://openai.com/) - GPT Models
- [Playwright](https://playwright.dev/) - Browser Automation
- [Browser Use](https://github.com/browser-use/browser-use) - AI-powered Browser Automation
- [FastAPI](https://fastapi.tiangolo.com/) - Web Framework
- [React](https://reactjs.org/) - Frontend Framework
- [Material-UI](https://mui.com/) - UI Components

---
