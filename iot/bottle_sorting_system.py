# -*- coding: utf-8 -*-
"""
SMART BOTTLE SORTING SYSTEM – FULL AUTO (Smooth Motor Version)
INTEGRATED WITH SORTING MACHINE API

FINAL VERSION WITH:
- Dual Limit Switch (HOME / END)
- IR Sensors (glass/plastic/can)
- YOLO object detection
- Ultrasonic auto start
- Tkinter GUI
- API Integration for points
- SAFE CAN MODE: LIMIT_END = CAN SLOT
"""

import cv2
import time
import threading
import tkinter as tk
from tkinter import ttk, messagebox
from PIL import Image, ImageTk
import RPi.GPIO as GPIO
from ultralytics import YOLO

# Import API Client
from api_client import SortingMachineAPIClient
from config import API_BASE_URL

# ============================================================
# POINTS CONFIG - คะแนนต่อประเภท
# ============================================================
POINTS_CONFIG = {
    "glass_bottle": {"points": 5, "name": "ขวดแก้ว", "emoji": "🍾"},
    "plastic_bottle": {"points": 3, "name": "ขวดพลาสติก", "emoji": "🧴"},
    "can": {"points": 2, "name": "กระป๋อง", "emoji": "🥫"},
}

# ============================================================
# GPIO CONFIG
# ============================================================
GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)

# --- Ultrasonic ---
TRIG_PIN = 20
ECHO_PIN = 21

# --- Conveyor Motor (12V Relay) ---
CON_R1 = 23   # forward
CON_R2 = 24   # reverse

# --- Pusher Motor ---
PUSH_R1 = 26   # down
PUSH_R2 = 16   # up

# --- IR Sensors ---
IR_GLASS   = 17
IR_PLASTIC = 13
IR_CAN     = 19

# --- Limit Switch ---
LIMIT_HOME = 25   # กลับบ้าน
LIMIT_END  = 7    # สุดทาง (จุดทิ้ง CAN)

# --- Door IR ---
IR_DOOR = 22

# Map slots
SLOT_IR = {
    "glass_bottle": IR_GLASS,
    "plastic_bottle": IR_PLASTIC,
    "can": IR_CAN
}

OUTPUT_PINS = [TRIG_PIN, CON_R1, CON_R2, PUSH_R1, PUSH_R2]
INPUT_PINS  = [ECHO_PIN, IR_GLASS, IR_PLASTIC, IR_CAN,
               LIMIT_HOME, LIMIT_END, IR_DOOR]

GPIO.setup(OUTPUT_PINS, GPIO.OUT)
for pin in INPUT_PINS:
    GPIO.setup(pin, GPIO.IN, pull_up_down=GPIO.PUD_UP)

# ============================================================
# API CLIENT
# ============================================================
api_client = SortingMachineAPIClient(API_BASE_URL)
current_user_phone = None  # เก็บเบอร์โทรผู้ใช้ปัจจุบัน

# ============================================================
# SESSION STATS - สถิติรอบการใช้งาน
# ============================================================
session_stats = {
    "glass_bottle": 0,
    "plastic_bottle": 0,
    "can": 0,
    "total_points": 0,
}

def reset_session():
    global session_stats
    session_stats = {
        "glass_bottle": 0,
        "plastic_bottle": 0,
        "can": 0,
        "total_points": 0,
    }

# ============================================================
# BASIC MOTOR CONTROL
# ============================================================
def all_off():
    GPIO.output(CON_R1, GPIO.HIGH)
    GPIO.output(CON_R2, GPIO.HIGH)
    GPIO.output(PUSH_R1, GPIO.HIGH)
    GPIO.output(PUSH_R2, GPIO.HIGH)

all_off()

def conveyor_forward():
    GPIO.output(CON_R2, GPIO.HIGH)
    GPIO.output(CON_R1, GPIO.LOW)

def conveyor_reverse():
    GPIO.output(CON_R1, GPIO.HIGH)
    GPIO.output(CON_R2, GPIO.LOW)

def conveyor_stop():
    GPIO.output(CON_R1, GPIO.HIGH)
    GPIO.output(CON_R2, GPIO.HIGH)

# ============================================================
# PUSHER MOTOR (ลง–กลับขึ้น)
# ============================================================
def pusher_push():
    # ลง
    GPIO.output(PUSH_R1, GPIO.LOW)
    GPIO.output(PUSH_R2, GPIO.HIGH)
    time.sleep(1.1)
    GPIO.output(PUSH_R1, GPIO.HIGH)

    time.sleep(0.3)

    # ขึ้นกลับ TOP
    GPIO.output(PUSH_R2, GPIO.LOW)
    GPIO.output(PUSH_R1, GPIO.HIGH)
    time.sleep(1.9)
    GPIO.output(PUSH_R2, GPIO.HIGH)

# ============================================================
# ULTRASONIC
# ============================================================
def measure_distance():
    try:
        GPIO.output(TRIG_PIN, False)
        time.sleep(0.02)

        GPIO.output(TRIG_PIN, True)
        time.sleep(0.00001)
        GPIO.output(TRIG_PIN, False)

        start = time.time()
        stop = start

        timeout = start + 0.05
        while GPIO.input(ECHO_PIN) == 0:
            start = time.time()
            if time.time() > timeout:
                print("[ULTRASONIC] Timeout waiting for echo")
                return 999

        timeout = time.time() + 0.05
        while GPIO.input(ECHO_PIN) == 1:
            stop = time.time()
            if time.time() > timeout:
                break

        distance = (stop - start) * 34300 / 2
        return distance
    except Exception as e:
        print(f"[ULTRASONIC ERROR] {e}")
        return 999

# ============================================================
# CAMERA + YOLO
# ============================================================
model = YOLO("best.pt")
cap = None

def open_camera():
    try:
        print("[CAM] Searching for camera...")
        for i in range(0, 10):
            cap = cv2.VideoCapture(i)
            if cap.isOpened():
                print(f"[CAM] Camera opened at index {i}")
                return cap
            cap.release()
        print("[CAM] No camera found")
        return None
    except Exception as e:
        print(f"[CAM ERROR] {e}")
        return None

def detect_label(frame):
    try:
        r = model.predict(frame, imgsz=640, conf=0.25, verbose=False)[0]
        if r.obb is None or len(r.obb.data) == 0:
            return None
        class_id = int(r.obb.data.cpu().numpy()[0][6])
        return r.names[class_id]
    except Exception as e:
        print(f"[YOLO ERROR] {e}")
        return None

# ============================================================
# ROTATE TO SLOT (CAN ใช้ LIMIT_END เป็นตำแหน่ง)
# ============================================================
CHECK_DELAY = 0.05
MIN_RUN_TIME = 0.3

def rotate_to_slot(label):

    # GLASS = ตำแหน่ง Home
    if label == "glass_bottle":
        conveyor_stop()
        return True

    # CAN → ใช้ LIMIT_END เป็น fallback
    if label == "can":
        while True:
            conveyor_forward()

            # เจอ IR_CAN
            if GPIO.input(IR_CAN) == 0:
                conveyor_stop()
                return True

            # LIMIT_END = ใช้เป็นตำแหน่งทิ้ง CAN
            if GPIO.input(LIMIT_END) == 0:
                conveyor_stop()
                return True

            time.sleep(0.03)

    # PLASTIC
    target = SLOT_IR[label]

    for attempt in range(3):
        start = time.time()
        last_run = time.time()

        while True:
            if time.time() - last_run < MIN_RUN_TIME:
                time.sleep(CHECK_DELAY)
            else:
                conveyor_forward()
                last_run = time.time()

            # เจอ IR
            if GPIO.input(target) == 0:
                conveyor_stop()
                return True

            # ห้ามชน END
            if GPIO.input(LIMIT_END) == 0:
                conveyor_stop()
                return False

            # timeout
            if time.time() - start > 12:
                conveyor_stop()
                break

            time.sleep(0.05)

        time.sleep(0.3)

    return False

# ============================================================
# RETURN HOME
# ============================================================
def go_home():
    start = time.time()
    last_run = start

    while True:
        if time.time() - last_run < MIN_RUN_TIME:
            time.sleep(CHECK_DELAY)
        else:
            # เดินกลับหลัง
            if GPIO.input(LIMIT_HOME) == 0:
                conveyor_stop()
                return True

            conveyor_reverse()
            last_run = time.time()

        # ถ้า IR_GLASS เจอ = HOME
        if GPIO.input(IR_GLASS) == 0:
            conveyor_stop()
            return True

        # timeout
        if time.time() - start > 15:
            conveyor_stop()
            return False

        time.sleep(0.05)

# ============================================================
# SEND POINTS TO API
# ============================================================
def send_points_to_api(label):
    """ส่งคะแนนไปยัง API"""
    global current_user_phone, session_stats
    
    if not current_user_phone:
        print("[API] No user logged in - skipping points")
        return False
    
    try:
        config = POINTS_CONFIG.get(label, {"points": 1})
        points = config["points"]
        
        print(f"[API] Sending {points} points for {label} to {current_user_phone}")
        
        result = api_client.send_point(current_user_phone, label, points)
        
        if result.get("success"):
            # อัพเดทสถิติ session
            session_stats[label] += 1
            session_stats["total_points"] += points
            
            print(f"[API] ✅ Points sent successfully!")
            update_session_display()
            return True
        else:
            print(f"[API] ❌ Failed: {result.get('error')}")
            return False
            
    except Exception as e:
        print(f"[API ERROR] {e}")
        return False

# ============================================================
# AUTO START
# ============================================================
def wait_auto_start():
    try:
        update_status("รอเปิดฝา...")

        while GPIO.input(IR_DOOR) == 0:
            time.sleep(0.05)

        update_status("ฝาเปิด – ใส่ขวด/กระป๋อง")

        while GPIO.input(IR_DOOR) == 1:
            time.sleep(0.05)

        update_status("ฝาปิด – กำลังสแกน...")

        while True:
            if measure_distance() < 3:
                update_status("ตรวจพบวัตถุ → กำลังประมวลผล...")
                time.sleep(0.4)
                return
            time.sleep(0.05)
    except Exception as e:
        print(f"[GPIO ERROR] {e}")
        time.sleep(0.5)
        raise

# ============================================================
# AUTO LOOP
# ============================================================
def auto_loop():
    global cap, current_user_phone
    camera_retry_count = 0
    MAX_RETRY = 5

    while True:
        # ตรวจสอบว่ามี user login หรือยัง
        if not current_user_phone:
            update_status("⚠️ กรุณาล็อกอินก่อนใช้งาน")
            time.sleep(1)
            continue

        if cap is None:
            camera_retry_count += 1
            if camera_retry_count >= MAX_RETRY:
                update_status(f"Camera failed {MAX_RETRY} times - retrying...")
                print(f"[AUTO] Attempting camera reconnect (attempt {camera_retry_count})")
                cap = open_camera()
                camera_retry_count = 0
                if cap is not None:
                    cap.set(3, 640)
                    cap.set(4, 480)
            update_status("Camera not detected")
            time.sleep(1)
            continue

        camera_retry_count = 0  # Reset on successful connection

        try:
            wait_auto_start()
        except Exception as e:
            print(f"[AUTO] Auto-start error: {e}")
            time.sleep(0.5)
            continue

        ret, frame = cap.read()
        if not ret:
            print("[AUTO] Failed to read frame - reconnecting camera")
            update_status("Camera error")
            cap.release()
            cap = None
            time.sleep(1)
            continue

        label = detect_label(frame)

        if label is None:
            update_status("❌ ตรวจจับไม่ได้")
            time.sleep(0.2)
            continue

        if label not in SLOT_IR:
            update_status(f"❓ ไม่รู้จัก: {label}")
            print(f"[INFO] Detected unknown label: {label}")
            continue

        # แสดงข้อมูลที่ตรวจพบ
        config = POINTS_CONFIG.get(label, {})
        emoji = config.get("emoji", "")
        name = config.get("name", label)
        points = config.get("points", 0)
        
        update_status(f"{emoji} ตรวจพบ: {name} (+{points} แต้ม)")

        ok = rotate_to_slot(label)
        if not ok:
            update_status("❌ การหมุนล้มเหลว")
            continue

        update_status(f"⬇️ กำลังดัน {name}...")
        pusher_push()

        # ส่งคะแนนไปยัง API
        update_status("📤 กำลังส่งคะแนน...")
        send_points_to_api(label)

        if label != "glass_bottle":
            update_status("🔄 กลับตำแหน่งเริ่มต้น...")
            go_home()

        update_status("✅ พร้อมรับวัตถุใหม่")

# ============================================================
# GUI
# ============================================================
root = tk.Tk()
root.title("🌱 Sorting Machine - Smart Bottle Sorting System")
root.geometry("900x800")
root.configure(bg="#ecfdf5")

# Style
style = ttk.Style()
style.configure("Green.TButton", font=("Arial", 12), padding=10)
style.configure("Big.TLabel", font=("Arial", 16))

# Header
header_frame = tk.Frame(root, bg="#10b981", height=80)
header_frame.pack(fill="x")
header_frame.pack_propagate(False)

title_label = tk.Label(
    header_frame,
    text="🌱 Sorting Machine - ระบบคัดแยกขวดอัตโนมัติ",
    font=("Arial", 20, "bold"),
    bg="#10b981",
    fg="white"
)
title_label.pack(pady=25)

# User Frame
user_frame = tk.Frame(root, bg="#ecfdf5", pady=10)
user_frame.pack(fill="x", padx=20)

phone_label = tk.Label(user_frame, text="📱 เบอร์โทรศัพท์:", font=("Arial", 14), bg="#ecfdf5")
phone_label.pack(side="left")

phone_entry = tk.Entry(user_frame, font=("Arial", 14), width=15)
phone_entry.pack(side="left", padx=10)

def login_user():
    global current_user_phone
    phone = phone_entry.get().strip()
    
    if len(phone) < 10:
        messagebox.showerror("Error", "กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง")
        return
    
    # ตรวจสอบว่ามี user อยู่ในระบบหรือไม่
    points = api_client.get_user_points(phone)
    
    if points is not None:
        current_user_phone = phone
        reset_session()
        user_info_label.config(text=f"👤 {phone} | 💰 {points} แต้ม")
        login_btn.config(state="disabled")
        logout_btn.config(state="normal")
        phone_entry.config(state="disabled")
        update_status("✅ ล็อกอินสำเร็จ - พร้อมใช้งาน")
        messagebox.showinfo("สำเร็จ", f"ยินดีต้อนรับ!\nแต้มปัจจุบัน: {points}")
    else:
        messagebox.showerror("Error", "ไม่พบบัญชีผู้ใช้นี้ กรุณาลงทะเบียนที่เว็บก่อน")

def logout_user():
    global current_user_phone
    
    # แสดงสรุป session
    if session_stats["total_points"] > 0:
        summary = f"""
สรุปการใช้งาน:
🍾 ขวดแก้ว: {session_stats['glass_bottle']} ชิ้น
🧴 ขวดพลาสติก: {session_stats['plastic_bottle']} ชิ้น
🥫 กระป๋อง: {session_stats['can']} ชิ้น

💰 แต้มที่ได้รับ: {session_stats['total_points']} แต้ม
        """
        messagebox.showinfo("สรุปการใช้งาน", summary)
    
    current_user_phone = None
    reset_session()
    user_info_label.config(text="👤 ยังไม่ได้ล็อกอิน")
    login_btn.config(state="normal")
    logout_btn.config(state="disabled")
    phone_entry.config(state="normal")
    phone_entry.delete(0, tk.END)
    update_status("⚠️ กรุณาล็อกอินก่อนใช้งาน")
    update_session_display()

login_btn = tk.Button(user_frame, text="เข้าสู่ระบบ", font=("Arial", 12), bg="#10b981", fg="white", command=login_user)
login_btn.pack(side="left", padx=5)

logout_btn = tk.Button(user_frame, text="ออกจากระบบ", font=("Arial", 12), bg="#ef4444", fg="white", command=logout_user, state="disabled")
logout_btn.pack(side="left", padx=5)

# User Info
user_info_label = tk.Label(root, text="👤 ยังไม่ได้ล็อกอิน", font=("Arial", 14), bg="#ecfdf5", fg="#374151")
user_info_label.pack(pady=5)

# Status Label
status_frame = tk.Frame(root, bg="white", relief="solid", bd=1)
status_frame.pack(fill="x", padx=20, pady=10)

status_label = tk.Label(
    status_frame,
    text="⚠️ กรุณาล็อกอินก่อนใช้งาน",
    font=("Arial", 18, "bold"),
    bg="white",
    fg="#10b981",
    pady=15
)
status_label.pack()

# Video Label
video_frame = tk.Frame(root, bg="#ecfdf5")
video_frame.pack(pady=10)

video_label = tk.Label(video_frame, bg="#d1d5db")
video_label.pack()

# Session Stats Frame
stats_frame = tk.Frame(root, bg="white", relief="solid", bd=1)
stats_frame.pack(fill="x", padx=20, pady=10)

stats_title = tk.Label(stats_frame, text="📊 สถิติรอบนี้", font=("Arial", 14, "bold"), bg="white")
stats_title.pack(pady=5)

stats_display = tk.Label(
    stats_frame,
    text="🍾 ขวดแก้ว: 0  |  🧴 พลาสติก: 0  |  🥫 กระป๋อง: 0  |  💰 แต้ม: 0",
    font=("Arial", 12),
    bg="white",
    fg="#374151"
)
stats_display.pack(pady=10)

def update_session_display():
    """อัพเดทแสดงสถิติ"""
    text = f"🍾 ขวดแก้ว: {session_stats['glass_bottle']}  |  "
    text += f"🧴 พลาสติก: {session_stats['plastic_bottle']}  |  "
    text += f"🥫 กระป๋อง: {session_stats['can']}  |  "
    text += f"💰 แต้ม: {session_stats['total_points']}"
    root.after(0, lambda: stats_display.config(text=text))

# Rate Info
rate_frame = tk.Frame(root, bg="#fef3c7", relief="solid", bd=1)
rate_frame.pack(fill="x", padx=20, pady=10)

rate_title = tk.Label(rate_frame, text="💡 อัตราแต้ม", font=("Arial", 12, "bold"), bg="#fef3c7")
rate_title.pack(pady=5)

rate_info = tk.Label(
    rate_frame,
    text="🍾 ขวดแก้ว = 5 แต้ม  |  🧴 ขวดพลาสติก = 3 แต้ม  |  🥫 กระป๋อง = 2 แต้ม",
    font=("Arial", 11),
    bg="#fef3c7",
    fg="#92400e"
)
rate_info.pack(pady=5)

def update_status(msg):
    root.after(0, lambda: status_label.config(text=msg))

def update_video():
    if cap is None:
        video_label.after(200, update_video)
        return
    ret, frame = cap.read()
    if ret:
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        img = ImageTk.PhotoImage(Image.fromarray(rgb))
        video_label.imgtk = img
        video_label.configure(image=img)
    video_label.after(80, update_video)

def on_close():
    if cap is not None:
        cap.release()
    all_off()
    GPIO.cleanup()
    root.destroy()

root.protocol("WM_DELETE_WINDOW", on_close)

# ============================================================
# START SYSTEM
# ============================================================
cap = open_camera()
if cap is not None:
    cap.set(3, 640)
    cap.set(4, 480)

time.sleep(1)  # Wait for GPIO to fully initialize
update_video()
threading.Thread(target=auto_loop, daemon=True).start()
root.mainloop()
