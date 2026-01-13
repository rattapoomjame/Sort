# ===================================================================
# Sorting Machine IoT Configuration
# ใช้สำหรับ Raspberry Pi ในการส่งคะแนนไปยัง API
# ===================================================================

import os
from dotenv import load_dotenv

# โหลด environment variables
load_dotenv()

# API Configuration
# สำหรับ production ให้เปลี่ยนเป็น URL ของ server จริง เช่น:
# API_BASE_URL = 'https://sorting-machine.vercel.app'
# หรือใช้ IP address ของ server เช่น:
# API_BASE_URL = 'http://192.168.1.100:3000'
API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:3000')
API_TIMEOUT = 10  # วินาที

# Endpoints
ENDPOINT_ADD_POINT = f'{API_BASE_URL}/api/addPoint'
ENDPOINT_GET_POINT = f'{API_BASE_URL}/api/getPoint'
ENDPOINT_LOGIN = f'{API_BASE_URL}/api/loginPhone'

# Device Configuration
DEVICE_ID = os.getenv('DEVICE_ID', 'sorting-machine-001')
DEVICE_NAME = os.getenv('DEVICE_NAME', 'Sorting Machine Kiosk #1')

# Points Configuration (ต้องตรงกับ bottle_sorting_system.py)
POINTS_GLASS = 5
POINTS_PLASTIC = 3
POINTS_CAN = 2

# Logging
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
LOG_FILE = os.getenv('LOG_FILE', 'sorting_machine.log'

print(f'✅ Config loaded: API_BASE_URL={API_BASE_URL}')
