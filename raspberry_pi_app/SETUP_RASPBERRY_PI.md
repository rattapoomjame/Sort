# 🍓 วิธีติดตั้ง Sorting Machine บน Raspberry Pi

## 1️⃣ เตรียม Raspberry Pi

### ติดตั้ง OS
- ใช้ **Raspberry Pi OS (Desktop)** - ต้องมี GUI
- แนะนำ Raspberry Pi 4 หรือ 5

### เปิดใช้งาน SSH (optional - สำหรับ remote)
```bash
sudo raspi-config
# Interface Options > SSH > Enable
```

---

## 2️⃣ คัดลอกไฟล์ไป Raspberry Pi

### วิธี A: ใช้ USB Drive
1. คัดลอกโฟลเดอร์ `raspberry_pi_app/` และ `public/` ลง USB
2. เสียบ USB เข้า Raspberry Pi
3. คัดลอกไปยัง home folder:
```bash
cp -r /media/pi/USB/raspberry_pi_app ~/sorting_machine
cp -r /media/pi/USB/public ~/sorting_machine/public
```

### วิธี B: ใช้ SCP (ผ่าน Network)
```bash
# จากคอมพิวเตอร์ Windows (PowerShell)
scp -r raspberry_pi_app pi@<IP_ADDRESS>:~/sorting_machine
scp -r public pi@<IP_ADDRESS>:~/sorting_machine/public
```

### วิธี C: ใช้ Git
```bash
# บน Raspberry Pi
git clone <your-repo-url>
cd ecopoints/raspberry_pi_app
```

---

## 3️⃣ ติดตั้ง Dependencies

```bash
cd ~/sorting_machine

# อัพเดท system
sudo apt update
sudo apt upgrade -y

# ติดตั้ง Python dependencies
sudo apt install -y python3-pyqt5 python3-pip

# ติดตั้ง packages
pip3 install requests python-dotenv

# (ถ้าใช้ GPIO)
pip3 install RPi.GPIO
```

---

## 4️⃣ ตั้งค่า config.py

แก้ไข `config.py` ตามต้องการ:

```python
# API URL - ไม่ต้องเปลี่ยนถ้าใช้ Vercel
API_BASE_URL = "https://sortingmachine.vercel.app"

# ขนาดหน้าจอ
DISPLAY_WIDTH = 1024   # ปรับตามหน้าจอ
DISPLAY_HEIGHT = 600

# เปิด Fullscreen
FULLSCREEN = True

# GPIO Pins (ถ้าต่อ sensor)
GPIO_GLASS = 17
GPIO_PLASTIC = 27
GPIO_CAN = 22
```

---

## 5️⃣ รันโปรแกรม

### รันปกติ
```bash
cd ~/sorting_machine
python3 main.py
```

### รันแบบ Fullscreen
แก้ `config.py`:
```python
FULLSCREEN = True
```

---

## 6️⃣ ตั้งค่าให้รันอัตโนมัติเมื่อเปิดเครื่อง

### วิธี A: ใช้ Autostart (แนะนำ)
```bash
mkdir -p ~/.config/autostart
nano ~/.config/autostart/sorting_machine.desktop
```

ใส่เนื้อหา:
```ini
[Desktop Entry]
Type=Application
Name=Sorting Machine
Exec=/usr/bin/python3 /home/pi/sorting_machine/main.py
```

### วิธี B: ใช้ systemd service
```bash
sudo nano /etc/systemd/system/sorting_machine.service
```

ใส่เนื้อหา:
```ini
[Unit]
Description=Sorting Machine GUI
After=graphical.target

[Service]
Environment=DISPLAY=:0
User=pi
WorkingDirectory=/home/pi/sorting_machine
ExecStart=/usr/bin/python3 /home/pi/sorting_machine/main.py
Restart=always

[Install]
WantedBy=graphical.target
```

เปิดใช้งาน:
```bash
sudo systemctl enable sorting_machine
sudo systemctl start sorting_machine
```

---

## 7️⃣ เชื่อมต่อ Sensor (GPIO) - Optional

### การต่อวงจร
```
Raspberry Pi          Sensor
-----------          ------
GPIO 17  <--------   Glass Sensor (Signal)
GPIO 27  <--------   Plastic Sensor (Signal)
GPIO 22  <--------   Can Sensor (Signal)
GND      <--------   GND (ทุก Sensor)
3.3V     <--------   VCC (ทุก Sensor)
```

### เปิดใช้งาน GPIO ใน config.py
```python
USE_GPIO = True
GPIO_GLASS = 17
GPIO_PLASTIC = 27
GPIO_CAN = 22
```

---

## 8️⃣ Troubleshooting

### ปัญหา: หน้าจอดำ / ไม่แสดง GUI
```bash
export DISPLAY=:0
python3 main.py
```

### ปัญหา: ไม่สามารถเชื่อมต่อ API
- ตรวจสอบ Internet: `ping google.com`
- ตรวจสอบ API: `curl https://sortingmachine.vercel.app`

### ปัญหา: Font ภาษาไทยไม่แสดง
```bash
sudo apt install fonts-thai-tlwg
```

### ปัญหา: PyQt5 import error
```bash
sudo apt install python3-pyqt5 python3-pyqt5.qtsvg
```

---

## 9️⃣ โครงสร้างโฟลเดอร์บน Raspberry Pi

```
/home/pi/sorting_machine/
├── main.py
├── config.py
├── api_client.py
├── requirements.txt
└── public/
    ├── glass.png
    ├── plastic.png
    ├── can.png
    └── frame.png
```

---

## 🔗 การเชื่อมต่อกับระบบ

```
┌─────────────────┐     Internet      ┌─────────────────┐
│  Raspberry Pi   │ ───────────────▶  │  Vercel Server  │
│  (GUI + Sensor) │     HTTPS API     │  (Next.js API)  │
└─────────────────┘                   └────────┬────────┘
                                               │
                                               ▼
                                      ┌─────────────────┐
                                      │    Supabase     │
                                      │   (Database)    │
                                      └─────────────────┘
```

### API Endpoints ที่ใช้:
- `POST /api/loginPhone` - เข้าสู่ระบบด้วยเบอร์โทร
- `POST /api/addPoint` - เพิ่มแต้มเมื่อใส่ขยะ
- `GET /api/getPoint` - ดึงแต้มปัจจุบัน

---

## ✅ เสร็จสิ้น!

หลังจากติดตั้งเสร็จ:
1. เปิดเครื่อง Raspberry Pi
2. โปรแกรมจะรันอัตโนมัติ (ถ้าตั้งค่า autostart)
3. ผู้ใช้กรอกเบอร์โทรเข้าสู่ระบบ
4. ใส่ขยะรีไซเคิล
5. ระบบส่งข้อมูลไป API และบันทึกแต้ม

