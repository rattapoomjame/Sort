# 🌱 EcoPoints IoT - Smart Bottle Sorting System

## 📋 ภาพรวมระบบ

ระบบคัดแยกขวดอัตโนมัติที่เชื่อมต่อกับ EcoPoints Web Application

```
┌─────────────────────────────────────────────────────────────┐
│                    SYSTEM ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌──────────────┐        HTTP API       ┌──────────────┐   │
│   │  Raspberry   │ ◄──────────────────► │   Next.js    │   │
│   │     Pi       │                       │   Web App    │   │
│   │              │                       │              │   │
│   │ • YOLO Model │  POST /api/addPoint   │ • Supabase   │   │
│   │ • GPIO/Motor │  POST /api/loginPhone │ • User Auth  │   │
│   │ • Tkinter UI │  GET  /api/getPoint   │ • Dashboard  │   │
│   └──────────────┘                       └──────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 🔌 การเชื่อมต่อ

### 1. ตั้งค่า API URL

แก้ไขไฟล์ `config.py` หรือสร้างไฟล์ `.env`:

```bash
# .env
API_BASE_URL=http://YOUR_SERVER_IP:3000
# หรือถ้า deploy แล้ว
API_BASE_URL=https://ecopoints.vercel.app
```

### 2. ติดตั้ง Dependencies

```bash
pip install -r requirements.txt
```

### 3. รันระบบ

```bash
# รันระบบเต็ม (บน Raspberry Pi)
python bottle_sorting_system.py

# รันทดสอบ API (บน PC ปกติ)
python api_client.py
```

## 📁 โครงสร้างไฟล์

```
iot/
├── bottle_sorting_system.py  # ระบบหลัก (GPIO + YOLO + API)
├── api_client.py             # API Client สำหรับเชื่อมต่อ Web App
├── config.py                 # Configuration
├── main.py                   # ตัวอย่างจำลอง (ไม่ต้องมี GPIO)
├── requirements.txt          # Python dependencies
└── README.md                 # ไฟล์นี้
```

## 🔧 Flow การทำงาน

```
1. ผู้ใช้ล็อกอินด้วยเบอร์โทร
   │
   ▼
2. ระบบเรียก API /api/loginPhone
   │
   ▼
3. ผู้ใช้ใส่ขวด/กระป๋อง
   │
   ▼
4. Ultrasonic Sensor ตรวจจับ
   │
   ▼
5. YOLO ตรวจประเภท (glass/plastic/can)
   │
   ▼
6. Conveyor หมุนไปตำแหน่งที่ถูกต้อง
   │
   ▼
7. Pusher ดันลงถัง
   │
   ▼
8. ส่งคะแนนไป API /api/addPoint
   │
   ▼
9. Web App อัพเดทคะแนนผู้ใช้
```

## 📊 อัตราคะแนน

| ประเภท | คะแนน | Emoji |
|--------|-------|-------|
| ขวดแก้ว | 5 แต้ม | 🍾 |
| ขวดพลาสติก | 3 แต้ม | 🧴 |
| กระป๋อง | 2 แต้ม | 🥫 |

## 🌐 API Endpoints

### POST `/api/addPoint`
เพิ่มคะแนนให้ผู้ใช้

```json
// Request
{
  "user_id": "uuid-xxx",
  "points": 5,
  "label": "glass_bottle"
}

// Response
{
  "success": true,
  "data": { ... },
  "message": "Added 5 points to user uuid-xxx"
}
```

### POST `/api/loginPhone`
ค้นหาผู้ใช้จากเบอร์โทร

```json
// Request
{
  "phone": "0812345678"
}

// Response
{
  "success": true,
  "user": {
    "id": "uuid-xxx",
    "phone": "0812345678",
    "username": "John"
  }
}
```

### GET `/api/getPoint?user_id=xxx`
ดึงคะแนนของผู้ใช้

```json
// Response
{
  "success": true,
  "points": 150
}
```

## 🔒 Network Setup

### Option 1: Same Network (แนะนำสำหรับทดสอบ)
```
Raspberry Pi และ Server อยู่ใน WiFi เดียวกัน
API_BASE_URL=http://192.168.1.xxx:3000
```

### Option 2: Deploy to Cloud (แนะนำสำหรับ Production)
```
Deploy Next.js ไป Vercel
API_BASE_URL=https://your-app.vercel.app
```

### Option 3: VPN / Tunneling
```
ใช้ ngrok หรือ cloudflare tunnel
API_BASE_URL=https://xxx.ngrok.io
```

## 🐛 Troubleshooting

### ปัญหา: เชื่อมต่อ API ไม่ได้
1. ตรวจสอบว่า Server รันอยู่
2. ตรวจสอบ IP address ถูกต้อง
3. ตรวจสอบ Firewall อนุญาต port 3000

### ปัญหา: ผู้ใช้ไม่พบ
- ผู้ใช้ต้องลงทะเบียนผ่าน Web App ก่อน

### ปัญหา: Camera ไม่ทำงาน
```bash
# ตรวจสอบ camera
ls /dev/video*
# ถ้าไม่มี ให้ enable camera ใน raspi-config
```

## 📞 Support

หากมีปัญหาในการใช้งาน สามารถเปิด Issue ได้
