# ===================================================================
# 🔌 การเชื่อมต่อ Hardware กับ Raspberry Pi
# ===================================================================

## 📋 GPIO Pin Configuration

```
┌─────────────────────────────────────────────────────────────┐
│                    RASPBERRY PI GPIO                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   GPIO PINS                          │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │                                                      │   │
│  │  ULTRASONIC SENSOR:                                 │   │
│  │    TRIG_PIN  = GPIO 20                              │   │
│  │    ECHO_PIN  = GPIO 21                              │   │
│  │                                                      │   │
│  │  CONVEYOR MOTOR (Relay):                            │   │
│  │    CON_R1    = GPIO 23  (forward)                   │   │
│  │    CON_R2    = GPIO 24  (reverse)                   │   │
│  │                                                      │   │
│  │  PUSHER MOTOR (Relay):                              │   │
│  │    PUSH_R1   = GPIO 26  (down)                      │   │
│  │    PUSH_R2   = GPIO 16  (up)                        │   │
│  │                                                      │   │
│  │  IR SENSORS (ตรวจจับช่องทิ้ง):                       │   │
│  │    IR_GLASS    = GPIO 17                            │   │
│  │    IR_PLASTIC  = GPIO 13                            │   │
│  │    IR_CAN      = GPIO 19                            │   │
│  │                                                      │   │
│  │  LIMIT SWITCHES:                                    │   │
│  │    LIMIT_HOME  = GPIO 25  (ตำแหน่ง home)            │   │
│  │    LIMIT_END   = GPIO 7   (สุดทาง/CAN)              │   │
│  │                                                      │   │
│  │  DOOR SENSOR:                                       │   │
│  │    IR_DOOR     = GPIO 22                            │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 วงจรการต่อ

### 1. Ultrasonic Sensor (HC-SR04)
```
HC-SR04          Raspberry Pi
--------         ------------
VCC      ─────►  5V
TRIG     ─────►  GPIO 20
ECHO     ─────►  GPIO 21 (ผ่าน Voltage Divider!)
GND      ─────►  GND

⚠️ ECHO ต้องผ่าน Voltage Divider (5V → 3.3V)
   ใช้ R1=1kΩ, R2=2kΩ
```

### 2. Relay Module (4-Channel)
```
Relay            Raspberry Pi
-----            ------------
VCC      ─────►  5V
GND      ─────►  GND
IN1      ─────►  GPIO 23 (Conveyor Forward)
IN2      ─────►  GPIO 24 (Conveyor Reverse)
IN3      ─────►  GPIO 26 (Pusher Down)
IN4      ─────►  GPIO 16 (Pusher Up)

⚠️ Relay เป็น Active LOW (ส่ง LOW = เปิด)
```

### 3. IR Sensors (Obstacle Detection)
```
IR Sensor        Raspberry Pi
---------        ------------
VCC      ─────►  3.3V
GND      ─────►  GND
OUT      ─────►  GPIO (ดูตามตำแหน่ง)

IR_GLASS    → GPIO 17
IR_PLASTIC  → GPIO 13
IR_CAN      → GPIO 19
IR_DOOR     → GPIO 22

⚠️ IR Sensor เป็น Active LOW (เจอวัตถุ = LOW)
```

### 4. Limit Switches
```
Limit Switch     Raspberry Pi
------------     ------------
COM      ─────►  GND
NO       ─────►  GPIO (ใช้ Internal Pull-up)

LIMIT_HOME  → GPIO 25
LIMIT_END   → GPIO 7

⚠️ ใช้ Internal Pull-up, กด = LOW
```

## 📷 กล้อง USB

```
USB Camera       Raspberry Pi
----------       ------------
USB      ─────►  USB Port

- ใช้ OpenCV เปิดกล้อง
- Resolution: 640x480
- ใช้ YOLO detect วัตถุ
```

## 🔄 Flow การทำงาน

```
┌──────────────────────────────────────────────────────────────┐
│                     SORTING FLOW                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. 🚪 รอเปิด-ปิดประตู (IR_DOOR)                              │
│     │                                                        │
│  2. 📏 Ultrasonic ตรวจจับว่ามีขวด (< 3cm)                     │
│     │                                                        │
│  3. 📷 Camera + YOLO ตรวจจับประเภท                            │
│     │                                                        │
│  4. ⚙️ Conveyor หมุนไปยังช่อง                                 │
│     ├─► glass_bottle  → หยุดที่ IR_GLASS (หรือ HOME)         │
│     ├─► plastic_bottle → หยุดที่ IR_PLASTIC                  │
│     └─► can           → หยุดที่ IR_CAN (หรือ LIMIT_END)      │
│     │                                                        │
│  5. 🔽 Pusher ดันลง → ขึ้น                                    │
│     │                                                        │
│  6. 🔙 Conveyor กลับ HOME (ถ้าไม่ใช่ glass)                   │
│     │                                                        │
│  7. 📱 ส่งข้อมูลไป API → เพิ่มแต้ม                            │
│     │                                                        │
│  └─► วนกลับขั้นตอน 1                                         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## 🛠️ การติดตั้งบน Raspberry Pi

### 1. ติดตั้ง Dependencies
```bash
# System packages
sudo apt update
sudo apt install -y python3-pyqt5 python3-opencv

# Python packages
pip3 install RPi.GPIO ultralytics requests python-dotenv
```

### 2. Copy ไฟล์ YOLO Model
```bash
# วาง best.pt ใน folder เดียวกับ main.py
sorting_machine/
├── main.py
├── hardware_controller.py
├── config.py
├── api_client.py
├── best.pt          ← YOLO model
└── public/
    └── ...
```

### 3. ตั้งค่า .env
```bash
# .env
API_BASE_URL=https://sortingmachine.vercel.app
FULLSCREEN=true
USE_GPIO=true
```

### 4. รันโปรแกรม
```bash
cd ~/sorting_machine
python3 main.py
```

## ⚠️ Safety Notes

1. **Relay Active LOW** - ส่ง GPIO.HIGH = ปิด, GPIO.LOW = เปิด
2. **IR Sensor Active LOW** - เจอวัตถุ = 0, ไม่เจอ = 1
3. **Limit Switch** - ใช้ Pull-up, กด = 0
4. **Ultrasonic ECHO** - ต้องใช้ Voltage Divider!
5. **Motor** - ใช้ Relay แยก power supply

## 🔗 การเชื่อมต่อกับ API

```
┌─────────────────┐      HTTPS        ┌─────────────────┐
│  Raspberry Pi   │ ────────────────► │  Vercel Server  │
│                 │                   │                 │
│  - PyQt5 GUI    │   POST /api/      │  - Next.js API  │
│  - YOLO Model   │   loginPhone      │  - Supabase DB  │
│  - GPIO Control │   addPoint        │                 │
│  - Camera       │   getPoint        │                 │
└─────────────────┘                   └─────────────────┘
```
