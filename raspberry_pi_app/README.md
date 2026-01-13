# 🚀 Sorting Machine - Raspberry Pi GUI Application

โปรแกรม GUI สำหรับ Touch Screen บน Raspberry Pi ใช้ PyQt5 ที่สวยงามและทันสมัย

![Preview](preview.png)

## ✨ Features

- 🎨 UI สวยงามแบบ Modern ธีมสีเขียว Emerald
- 📱 รองรับ Touch Screen 800x480
- 🔌 รองรับ GPIO Sensors (IR, Servo, LED, Buzzer)
- 🌐 เชื่อมต่อ API แบบ Real-time
- ⌨️ Keyboard simulation สำหรับทดสอบ

## 📦 Installation

### บน Raspberry Pi

```bash
# ติดตั้ง PyQt5
sudo apt update
sudo apt install python3-pyqt5 -y

# ติดตั้ง dependencies
pip install requests python-dotenv

# (Optional) GPIO support
pip install RPi.GPIO
```

### บน Windows/Mac (สำหรับทดสอบ)

```bash
pip install PyQt5 requests python-dotenv
```

## 🚀 การใช้งาน

### รันแบบปกติ (ไม่มี GPIO)
```bash
python main.py
```

### รันพร้อม GPIO (บน Raspberry Pi)
```bash
python main_gpio.py
```

### รันแบบ Fullscreen
แก้ไขไฟล์ `.env`:
```
FULLSCREEN=true
```

## ⌨️ Keyboard Shortcuts (สำหรับทดสอบ)

| Key | Action |
|-----|--------|
| `1` | เพิ่มขวดแก้ว |
| `2` | เพิ่มขวดพลาสติก |
| `3` | เพิ่มกระป๋อง |
| `Esc` | ปิดโปรแกรม |

## 🔌 GPIO Pinout

| Component | GPIO Pin | Physical Pin |
|-----------|----------|--------------|
| IR Glass | GPIO23 | Pin 16 |
| IR Plastic | GPIO24 | Pin 18 |
| IR Can | GPIO25 | Pin 22 |
| Servo | GPIO18 | Pin 12 |
| LED Green | GPIO20 | Pin 38 |
| LED Red | GPIO21 | Pin 40 |
| Buzzer | GPIO16 | Pin 36 |

## 📁 Files

```
raspberry_pi_app/
├── main.py           # Main GUI application
├── main_gpio.py      # GPIO integrated version
├── api_client.py     # API communication
├── config.py         # Configuration
├── requirements.txt  # Dependencies
├── .env              # Environment variables
└── README.md         # This file
```

## ⚙️ Configuration

แก้ไขไฟล์ `.env`:

```env
# API URL (เปลี่ยนเป็น URL ของคุณ)
API_BASE_URL=https://sortingmachine.vercel.app

# Display settings
FULLSCREEN=false
```

## 🔧 Auto-start on Boot

สร้างไฟล์ `/etc/systemd/system/sorting-machine.service`:

```ini
[Unit]
Description=Sorting Machine GUI
After=graphical.target

[Service]
Type=simple
User=pi
Environment=DISPLAY=:0
WorkingDirectory=/home/pi/sorting-machine
ExecStart=/usr/bin/python3 /home/pi/sorting-machine/main_gpio.py
Restart=always

[Install]
WantedBy=graphical.target
```

เปิดใช้งาน:
```bash
sudo systemctl enable sorting-machine
sudo systemctl start sorting-machine
```

