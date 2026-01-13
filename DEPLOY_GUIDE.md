# 🚀 Sorting Machine - คู่มือ Deploy และเชื่อมต่อ Raspberry Pi

## 📋 สารบัญ
1. [Deploy เว็บแอปขึ้น Vercel](#1-deploy-เว็บแอปขึ้น-vercel)
2. [ตั้งค่า Supabase Database](#2-ตั้งค่า-supabase-database)
3. [ติดตั้งบน Raspberry Pi](#3-ติดตั้งบน-raspberry-pi)
4. [เชื่อมต่อ Sensor กับ Raspberry Pi](#4-เชื่อมต่อ-sensor-กับ-raspberry-pi)
5. [การทดสอบระบบ](#5-การทดสอบระบบ)

---

## 1. Deploy เว็บแอปขึ้น Vercel

### วิธีที่ 1: ผ่าน Vercel CLI (แนะนำ)

```bash
# 1. ติดตั้ง Vercel CLI (ถ้ายังไม่มี)
npm install -g vercel

# 2. Login เข้า Vercel
vercel login

# 3. Deploy โปรเจค
vercel

# 4. Deploy เป็น Production
vercel --prod
```

### วิธีที่ 2: ผ่าน Vercel Dashboard

1. ไปที่ [vercel.com](https://vercel.com) และสมัครสมาชิก/Login
2. คลิก **"New Project"**
3. เชื่อมต่อ GitHub repository ของคุณ
4. เลือก repository `ecopoints`
5. ตั้งค่า Environment Variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
6. คลิก **"Deploy"**

### หลัง Deploy สำเร็จ
- URL จะเป็นแบบ: `https://sorting-machine-xxx.vercel.app`
- จด URL นี้ไว้ใช้กับ Raspberry Pi

---

## 2. ตั้งค่า Supabase Database

### 2.1 สร้าง Project ใน Supabase
1. ไปที่ [supabase.com](https://supabase.com)
2. สร้าง Project ใหม่
3. จด URL และ Anon Key ไว้

### 2.2 สร้าง Tables
ไปที่ **SQL Editor** แล้ว run SQL นี้:

```sql
-- สร้าง Table Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_users_phone ON users(phone);

-- สร้าง Table user_points
CREATE TABLE user_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  points INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_user_points_user_id ON user_points(user_id);

-- สร้าง Table point_history
CREATE TABLE point_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  points INT NOT NULL,
  label TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_point_history_user_id ON point_history(user_id);

-- สร้าง Table withdrawals
CREATE TABLE withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  points INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  promptpay_number TEXT,
  created_at TIMESTAMP DEFAULT now(),
  completed_at TIMESTAMP
);
```

---

## 3. ติดตั้งบน Raspberry Pi

### 3.1 เตรียม Raspberry Pi

```bash
# อัพเดท System
sudo apt update && sudo apt upgrade -y

# ติดตั้ง Python และ pip
sudo apt install python3 python3-pip python3-venv -y

# ติดตั้ง Git (ถ้ายังไม่มี)
sudo apt install git -y
```

### 3.2 Clone และติดตั้ง IoT Code

```bash
# สร้างโฟลเดอร์
mkdir ~/sorting-machine
cd ~/sorting-machine

# Clone เฉพาะโฟลเดอร์ iot (หรือ copy จาก USB)
# ถ้า clone ทั้งโปรเจค:
git clone https://github.com/your-username/ecopoints.git
cd ecopoints/iot

# หรือ copy ไฟล์ด้วยตนเอง:
# - api_client.py
# - config.py
# - main.py
# - requirements.txt
# - bottle_sorting_system.py (ถ้ามี)

# สร้าง Virtual Environment
python3 -m venv venv
source venv/bin/activate

# ติดตั้ง Dependencies
pip install -r requirements.txt
```

### 3.3 ตั้งค่า Environment Variables

สร้างไฟล์ `.env` ในโฟลเดอร์ `iot`:

```bash
nano .env
```

ใส่ค่าเหล่านี้:
```env
# เปลี่ยนเป็น URL จริงจาก Vercel
API_BASE_URL=https://your-app-name.vercel.app

# ตั้งชื่อเครื่อง
DEVICE_ID=sorting-machine-001
DEVICE_NAME=Sorting Machine Kiosk #1

# Log settings
LOG_LEVEL=INFO
LOG_FILE=sorting_machine.log
```

### 3.4 ทดสอบการเชื่อมต่อ

```bash
# เปิด Virtual Environment
source venv/bin/activate

# รัน main.py
python main.py
```

---

## 4. เชื่อมต่อ Sensor กับ Raspberry Pi

### 4.1 อุปกรณ์ที่ต้องใช้
- Raspberry Pi 4 (แนะนำ) หรือ 3B+
- IR Sensor สำหรับตรวจจับวัตถุ
- Servo Motor สำหรับแยกประเภท
- Camera Module (ถ้าใช้ AI classification)
- Ultrasonic Sensor (วัดระดับถัง)
- หน้าจอ Touch Screen (แสดงผล)

### 4.2 การต่อวงจร (GPIO Pins)

```
Raspberry Pi GPIO Layout:
┌──────────────────────────────────┐
│  3.3V (1)  ●  ● (2) 5V           │
│  GPIO2 (3) ●  ● (4) 5V           │
│  GPIO3 (5) ●  ● (6) GND          │
│  GPIO4 (7) ●  ● (8) GPIO14       │
│  GND (9)   ●  ● (10) GPIO15      │
│  GPIO17 (11) ● ● (12) GPIO18     │  <- Servo Motor
│  GPIO27 (13) ● ● (14) GND        │
│  GPIO22 (15) ● ● (16) GPIO23     │  <- IR Sensor 1
│  3.3V (17) ●  ● (18) GPIO24      │  <- IR Sensor 2
│  GPIO10 (19) ● ● (20) GND        │
│  GPIO9 (21)  ● ● (22) GPIO25     │
│  GPIO11 (23) ● ● (24) GPIO8      │
│  GND (25)  ●  ● (26) GPIO7       │
│  ...                              │
└──────────────────────────────────┘

การเชื่อมต่อ:
- IR Sensor (Glass):    GPIO23 (Pin 16)
- IR Sensor (Plastic):  GPIO24 (Pin 18)
- IR Sensor (Can):      GPIO25 (Pin 22)
- Servo Motor:          GPIO18 (Pin 12)
- Ultrasonic Trigger:   GPIO17 (Pin 11)
- Ultrasonic Echo:      GPIO27 (Pin 13)
```

### 4.3 สร้างไฟล์ Raspberry Pi Controller

สร้างไฟล์ `bottle_sorting_system.py`:

```python
#!/usr/bin/env python3
"""
Sorting Machine - Raspberry Pi Controller
ระบบควบคุมเครื่องคัดแยกขยะด้วย Raspberry Pi
"""

import RPi.GPIO as GPIO
import time
import logging
from api_client import SortingMachineAPIClient
from config import API_BASE_URL, POINTS_GLASS, POINTS_PLASTIC, POINTS_CAN

# ตั้งค่า Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# GPIO Pin Configuration
PIN_IR_GLASS = 23      # IR Sensor ตรวจจับแก้ว
PIN_IR_PLASTIC = 24    # IR Sensor ตรวจจับพลาสติก
PIN_IR_CAN = 25        # IR Sensor ตรวจจับกระป๋อง
PIN_SERVO = 18         # Servo Motor
PIN_ULTRASONIC_TRIG = 17
PIN_ULTRASONIC_ECHO = 27

# Current User (จาก QR Code หรือ NFC)
current_user_phone = None


class SortingMachine:
    def __init__(self):
        # ตั้งค่า GPIO
        GPIO.setmode(GPIO.BCM)
        GPIO.setwarnings(False)
        
        # Input Pins (IR Sensors)
        GPIO.setup(PIN_IR_GLASS, GPIO.IN, pull_up_down=GPIO.PUD_UP)
        GPIO.setup(PIN_IR_PLASTIC, GPIO.IN, pull_up_down=GPIO.PUD_UP)
        GPIO.setup(PIN_IR_CAN, GPIO.IN, pull_up_down=GPIO.PUD_UP)
        
        # Output Pins
        GPIO.setup(PIN_SERVO, GPIO.OUT)
        GPIO.setup(PIN_ULTRASONIC_TRIG, GPIO.OUT)
        GPIO.setup(PIN_ULTRASONIC_ECHO, GPIO.IN)
        
        # Servo PWM
        self.servo = GPIO.PWM(PIN_SERVO, 50)  # 50Hz
        self.servo.start(0)
        
        # API Client
        self.api_client = SortingMachineAPIClient(API_BASE_URL)
        
        logger.info("✅ Sorting Machine initialized")
    
    def set_user(self, phone: str):
        """ตั้งค่าผู้ใช้ปัจจุบัน (จาก QR/NFC)"""
        global current_user_phone
        current_user_phone = phone
        logger.info(f"👤 User set: {phone}")
    
    def detect_item(self) -> str | None:
        """ตรวจจับประเภทขยะจาก IR Sensors"""
        if GPIO.input(PIN_IR_GLASS) == GPIO.LOW:
            return 'glass'
        elif GPIO.input(PIN_IR_PLASTIC) == GPIO.LOW:
            return 'plastic'
        elif GPIO.input(PIN_IR_CAN) == GPIO.LOW:
            return 'can'
        return None
    
    def move_servo(self, angle: int):
        """หมุน Servo Motor ไปมุมที่กำหนด"""
        duty = angle / 18 + 2
        self.servo.ChangeDutyCycle(duty)
        time.sleep(0.5)
        self.servo.ChangeDutyCycle(0)
    
    def sort_item(self, item_type: str):
        """คัดแยกขยะตามประเภท"""
        angles = {
            'glass': 0,      # ช่องแก้ว
            'plastic': 90,   # ช่องพลาสติก
            'can': 180       # ช่องกระป๋อง
        }
        angle = angles.get(item_type, 90)
        self.move_servo(angle)
        logger.info(f"🔄 Sorted {item_type} to angle {angle}")
    
    def get_points(self, item_type: str) -> int:
        """คืนค่าคะแนนตามประเภท"""
        points_map = {
            'glass': POINTS_GLASS,      # 5 คะแนน
            'plastic': POINTS_PLASTIC,  # 3 คะแนน
            'can': POINTS_CAN           # 2 คะแนน
        }
        return points_map.get(item_type, 1)
    
    def process_item(self, item_type: str) -> bool:
        """ประมวลผลขยะ: คัดแยก + ส่งคะแนน"""
        global current_user_phone
        
        if not current_user_phone:
            logger.warning("⚠️ No user logged in")
            return False
        
        try:
            # 1. คัดแยกขยะ
            self.sort_item(item_type)
            
            # 2. คำนวณคะแนน
            points = self.get_points(item_type)
            
            # 3. ส่งคะแนนไป API
            result = self.api_client.send_point(
                phone=current_user_phone,
                label=item_type,
                points=points
            )
            
            if result['success']:
                logger.info(f"✅ +{points} points for {item_type}")
                return True
            else:
                logger.error(f"❌ Failed to send points: {result.get('error')}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Error processing item: {e}")
            return False
    
    def run(self):
        """Main loop - รันเครื่องคัดแยก"""
        logger.info("🚀 Sorting Machine running...")
        
        try:
            while True:
                # ตรวจจับขยะ
                item = self.detect_item()
                
                if item:
                    logger.info(f"📦 Detected: {item}")
                    self.process_item(item)
                    time.sleep(2)  # รอ 2 วินาทีก่อนรับชิ้นต่อไป
                
                time.sleep(0.1)  # ลด CPU usage
                
        except KeyboardInterrupt:
            logger.info("👋 Shutting down...")
        finally:
            self.cleanup()
    
    def cleanup(self):
        """ล้าง GPIO เมื่อปิดโปรแกรม"""
        self.servo.stop()
        GPIO.cleanup()
        logger.info("✅ GPIO cleaned up")


if __name__ == '__main__':
    machine = SortingMachine()
    
    # ตั้งค่าผู้ใช้ทดสอบ
    machine.set_user('0812345678')
    
    # รันเครื่อง
    machine.run()
```

### 4.4 ติดตั้ง RPi.GPIO

```bash
pip install RPi.GPIO
```

---

## 5. การทดสอบระบบ

### 5.1 ทดสอบ API Connection

```bash
cd ~/sorting-machine/iot
source venv/bin/activate

# ทดสอบ API
python -c "
from api_client import SortingMachineAPIClient
from config import API_BASE_URL

client = SortingMachineAPIClient(API_BASE_URL)
print(f'Testing connection to: {API_BASE_URL}')

# ทดสอบส่งคะแนน
result = client.send_point('0812345678', 'plastic', 3)
print(f'Result: {result}')
"
```

### 5.2 ทดสอบ Hardware (GPIO)

```bash
python -c "
import RPi.GPIO as GPIO
GPIO.setmode(GPIO.BCM)
GPIO.setup(23, GPIO.IN, pull_up_down=GPIO.PUD_UP)

print('Testing IR Sensor on GPIO23...')
print('Press Ctrl+C to exit')

try:
    while True:
        if GPIO.input(23) == GPIO.LOW:
            print('Object detected!')
        import time
        time.sleep(0.1)
except KeyboardInterrupt:
    GPIO.cleanup()
"
```

### 5.3 รันแบบ Auto-start เมื่อเปิดเครื่อง

สร้าง systemd service:

```bash
sudo nano /etc/systemd/system/sorting-machine.service
```

ใส่เนื้อหา:
```ini
[Unit]
Description=Sorting Machine IoT Service
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/sorting-machine/iot
Environment=PATH=/home/pi/sorting-machine/iot/venv/bin
ExecStart=/home/pi/sorting-machine/iot/venv/bin/python bottle_sorting_system.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

เปิดใช้งาน:
```bash
sudo systemctl daemon-reload
sudo systemctl enable sorting-machine
sudo systemctl start sorting-machine

# ดู logs
sudo journalctl -u sorting-machine -f
```

---

## 📱 สรุป Flow การทำงาน

```
┌─────────────────────────────────────────────────────────────────┐
│                     Sorting Machine System                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │ Raspberry Pi │───▶│   Vercel     │───▶│   Supabase   │      │
│  │   (IoT)      │    │   (Web App)  │    │   (Database) │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                   │                    │               │
│         │                   │                    │               │
│  ┌──────▼──────┐    ┌──────▼──────┐    ┌───────▼──────┐       │
│  │  Sensors    │    │  Next.js    │    │   Tables:    │       │
│  │  - IR       │    │  - APIs     │    │   - users    │       │
│  │  - Camera   │    │  - Pages    │    │   - points   │       │
│  │  - Servo    │    │  - Admin    │    │   - history  │       │
│  └─────────────┘    └─────────────┘    └──────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

Flow:
1. ผู้ใช้ Login ผ่านเว็บ (ใส่เบอร์โทร)
2. ผู้ใช้นำขยะมาใส่เครื่อง
3. IR Sensor ตรวจจับประเภทขยะ
4. Raspberry Pi ส่ง API request ไป Vercel
5. API บันทึกคะแนนลง Supabase
6. ผู้ใช้ดูคะแนนผ่านเว็บ/แอป
7. ผู้ใช้ถอนเงินผ่าน PromptPay
```

---

## ❓ FAQ

**Q: ใช้ Raspberry Pi รุ่นไหนดี?**
A: แนะนำ Raspberry Pi 4 (2GB+) สำหรับประสิทธิภาพที่ดี

**Q: ถ้าอินเทอร์เน็ตหลุดจะทำอย่างไร?**
A: เพิ่ม Offline Queue ในโค้ด Python เพื่อเก็บข้อมูลชั่วคราว

**Q: ต้องใช้ Camera ไหม?**
A: ถ้าต้องการ AI Classification ต้องใช้ ถ้าใช้แค่ IR Sensor ไม่ต้อง

**Q: Deploy บน Server อื่นได้ไหม?**
A: ได้ครับ สามารถใช้ Railway, Render, หรือ self-hosted ได้

---

## 📞 ติดต่อ

หากมีปัญหาในการติดตั้ง สามารถเปิด Issue ใน GitHub Repository
