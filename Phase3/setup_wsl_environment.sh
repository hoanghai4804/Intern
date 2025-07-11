#!/bin/bash
# Script setup WSL environment cho AI Agents project
# Chạy script này sau khi cài đặt WSL và restart máy tính

echo "🚀 Setting up WSL environment for AI Agents project..."
echo "=================================================="

# Kiểm tra xem có đang ở trong WSL không
if [[ ! -f /proc/version ]] || ! grep -q Microsoft /proc/version; then
    echo "❌ Error: Script này phải chạy trong WSL!"
    echo "💡 Hãy mở PowerShell và gõ: wsl"
    exit 1
fi

echo "✅ Đang chạy trong WSL environment"

# Navigate to project directory
PROJECT_DIR="/mnt/c/Users/Admin/Desktop/Code stage/AI Agent automation tests web"

echo "📁 Navigating to project directory..."
echo "Path: $PROJECT_DIR"

if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Không tìm thấy project directory!"
    echo "💡 Hãy kiểm tra đường dẫn: $PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR"
echo "✅ Đã vào project directory: $(pwd)"

# Update system packages
echo ""
echo "📦 Updating system packages..."
sudo apt update -y

# Install Python and development tools
echo ""
echo "🐍 Installing Python and development tools..."
sudo apt install -y python3 python3-pip python3-venv python3-dev build-essential

# Install additional dependencies for browser automation
echo ""
echo "🌐 Installing browser automation dependencies..."
sudo apt install -y wget curl git unzip

# Create virtual environment
echo ""
echo "🔧 Creating virtual environment..."
if [ -d "wsl-env" ]; then
    echo "⚠️  Virtual environment đã tồn tại, xóa và tạo lại..."
    rm -rf wsl-env
fi

python3 -m venv wsl-env
echo "✅ Virtual environment created: wsl-env"

# Activate virtual environment
echo ""
echo "⚡ Activating virtual environment..."
source wsl-env/bin/activate

# Upgrade pip
echo ""
echo "📚 Upgrading pip..."
pip install --upgrade pip

# Install Python packages
echo ""
echo "📦 Installing Python packages from requirements.txt..."
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
    echo "✅ Python packages installed"
else
    echo "⚠️  requirements.txt không tìm thấy, cài đặt packages cơ bản..."
    pip install fastapi uvicorn anthropic browser-use playwright
fi

# Install Playwright browsers
echo ""
echo "🌐 Installing Playwright browsers..."
playwright install

# Test installation
echo ""
echo "🧪 Testing installation..."
python3 -c "
import sys
print(f'✅ Python version: {sys.version}')
try:
    import browser_use
    print('✅ browser_use imported successfully')
except Exception as e:
    print(f'❌ browser_use import failed: {e}')
"

echo ""
echo "🎉 WSL environment setup completed successfully!"
echo "=================================================="
echo ""
echo "🎯 Để sử dụng project:"
echo "1. Mở PowerShell và gõ: wsl"
echo "2. Navigate: cd '$PROJECT_DIR'"
echo "3. Activate: source wsl-env/bin/activate"
echo "4. Chạy server: python backend/run_server.py"
echo ""
echo "💡 Project sẽ hoạt động với browser automation trong WSL!"
echo ""
echo "📝 Lưu ý:"
echo "- Virtual environment: wsl-env"
echo "- Project path: $PROJECT_DIR"
echo "- Browser automation sẽ hoạt động bình thường" 