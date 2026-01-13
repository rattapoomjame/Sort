#!/bin/bash
# ===================================================================
# Sorting Machine - Installation Script for Raspberry Pi
# ===================================================================
# วิธีใช้: chmod +x install.sh && ./install.sh

echo "🍓 Sorting Machine - Raspberry Pi Installation"
echo "================================================"

# Update system
echo "📦 Updating system..."
sudo apt update
sudo apt upgrade -y

# Install dependencies
echo "📦 Installing dependencies..."
sudo apt install -y python3-pyqt5 python3-pyqt5.qtsvg python3-pip fonts-thai-tlwg

# Install Python packages
echo "🐍 Installing Python packages..."
pip3 install requests python-dotenv

# Create .env file if not exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit .env file to configure settings"
fi

# Create autostart entry
echo "🚀 Setting up autostart..."
mkdir -p ~/.config/autostart

cat > ~/.config/autostart/sorting_machine.desktop << EOF
[Desktop Entry]
Type=Application
Name=Sorting Machine
Comment=Recycling Points System
Exec=/usr/bin/python3 $(pwd)/main.py
Path=$(pwd)
Terminal=false
StartupNotify=false
EOF

echo ""
echo "✅ Installation complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Edit .env file: nano .env"
echo "   2. Test run: python3 main.py"
echo "   3. Reboot to auto-start: sudo reboot"
echo ""
echo "🔧 GPIO Pins (if using sensors):"
echo "   - Glass sensor:   GPIO 17"
echo "   - Plastic sensor: GPIO 27"
echo "   - Can sensor:     GPIO 22"
echo ""
