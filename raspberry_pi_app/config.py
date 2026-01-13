# ===================================================================
# Sorting Machine - Configuration
# ===================================================================

import os
from dotenv import load_dotenv

load_dotenv()

# API Configuration
API_BASE_URL = os.getenv('API_BASE_URL', 'https://sortingmachine.vercel.app')
API_TIMEOUT = 10

# Points Configuration
POINTS_CONFIG = {
    'glass': {'name': 'ขวดแก้ว', 'points': 5, 'rate': 0.50, 'emoji': '🍾'},
    'plastic': {'name': 'ขวดพลาสติก', 'points': 3, 'rate': 0.30, 'emoji': '🧴'},
    'can': {'name': 'กระป๋อง', 'points': 2, 'rate': 0.20, 'emoji': '🥫'},
}

# GPIO Configuration (Raspberry Pi)
# ตั้งค่า USE_GPIO = True เมื่อต่อ sensor จริง
USE_GPIO = os.getenv('USE_GPIO', 'false').lower() == 'true'

GPIO_CONFIG = {
    # IR Sensors สำหรับตรวจจับขยะ
    'IR_GLASS': 17,      # GPIO 17 - ตรวจจับขวดแก้ว
    'IR_PLASTIC': 27,    # GPIO 27 - ตรวจจับพลาสติก
    'IR_CAN': 22,        # GPIO 22 - ตรวจจับกระป๋อง
    
    # อื่นๆ
    'SERVO': 18,         # GPIO 18 - Servo motor
    'BUZZER': 23,        # GPIO 23 - Buzzer
    'LED_GREEN': 24,     # GPIO 24 - LED สีเขียว
    'LED_RED': 25,       # GPIO 25 - LED สีแดง
}

# Display Settings
DISPLAY_WIDTH = int(os.getenv('DISPLAY_WIDTH', '1024'))
DISPLAY_HEIGHT = int(os.getenv('DISPLAY_HEIGHT', '600'))

# สำหรับ Raspberry Pi ให้ใช้ FULLSCREEN=true
FULLSCREEN = os.getenv('FULLSCREEN', 'false').lower() == 'true'

# แสดงปุ่มปิดบนหน้าจอ (สำคัญสำหรับ touch screen)
SHOW_CLOSE_BUTTON = os.getenv('SHOW_CLOSE_BUTTON', 'true').lower() == 'true'

print(f"✅ Config loaded: API={API_BASE_URL}, Fullscreen={FULLSCREEN}, GPIO={USE_GPIO}")
