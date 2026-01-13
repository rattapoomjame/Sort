# -*- coding: utf-8 -*-
"""
SMART BOTTLE SORTING SYSTEM – FULL AUTO (Smooth Motor Version)
FINAL VERSION WITH:
- Dual Limit Switch (HOME / END)
- IR Sensors (glass/plastic/can)
- YOLO object detection
- Ultrasonic auto start
- SAFE CAN MODE: LIMIT_END = CAN SLOT

*** ไฟล์นี้คือ Hardware Control - ห้ามแก้ไข Logic! ***
"""

import time
import threading

# ============================================================
# GPIO CONFIG (จะ import เฉพาะบน Raspberry Pi)
# ============================================================
try:
    import RPi.GPIO as GPIO
    from ultralytics import YOLO
    import cv2
    USE_HARDWARE = True
except ImportError:
    USE_HARDWARE = False
    GPIO = None
    YOLO = None
    cv2 = None

if USE_HARDWARE:
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

# Label mapping to points system
LABEL_TO_TYPE = {
    "glass_bottle": "glass",
    "plastic_bottle": "plastic",
    "can": "can"
}

if USE_HARDWARE:
    OUTPUT_PINS = [TRIG_PIN, CON_R1, CON_R2, PUSH_R1, PUSH_R2]
    INPUT_PINS  = [ECHO_PIN, IR_GLASS, IR_PLASTIC, IR_CAN,
                   LIMIT_HOME, LIMIT_END, IR_DOOR]

    GPIO.setup(OUTPUT_PINS, GPIO.OUT)
    for pin in INPUT_PINS:
        GPIO.setup(pin, GPIO.IN, pull_up_down=GPIO.PUD_UP)

# ============================================================
# BASIC MOTOR CONTROL
# ============================================================
def all_off():
    if not USE_HARDWARE:
        return
    GPIO.output(CON_R1, GPIO.HIGH)
    GPIO.output(CON_R2, GPIO.HIGH)
    GPIO.output(PUSH_R1, GPIO.HIGH)
    GPIO.output(PUSH_R2, GPIO.HIGH)

if USE_HARDWARE:
    all_off()

def conveyor_forward():
    if not USE_HARDWARE:
        return
    GPIO.output(CON_R2, GPIO.HIGH)
    GPIO.output(CON_R1, GPIO.LOW)

def conveyor_reverse():
    if not USE_HARDWARE:
        return
    GPIO.output(CON_R1, GPIO.HIGH)
    GPIO.output(CON_R2, GPIO.LOW)

def conveyor_stop():
    if not USE_HARDWARE:
        return
    GPIO.output(CON_R1, GPIO.HIGH)
    GPIO.output(CON_R2, GPIO.HIGH)

# ============================================================
# PUSHER MOTOR (ลง–กลับขึ้น)
# ============================================================
def pusher_push():
    if not USE_HARDWARE:
        time.sleep(0.5)
        return
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
    if not USE_HARDWARE:
        return 999
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
model = None
cap = None

def init_model():
    global model
    if USE_HARDWARE and model is None:
        try:
            model = YOLO("best.pt")
            print("[YOLO] Model loaded")
        except Exception as e:
            print(f"[YOLO ERROR] {e}")

def open_camera():
    if not USE_HARDWARE:
        return None
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
    if not USE_HARDWARE or model is None:
        return None
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
    if not USE_HARDWARE:
        time.sleep(0.5)
        return True

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
    if not USE_HARDWARE:
        time.sleep(0.3)
        return True
        
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
# AUTO START (รอเปิด-ปิดประตู + ตรวจจับขวด)
# ============================================================
def wait_auto_start(status_callback=None):
    """
    รอจนกว่าจะใส่ขวด
    status_callback: function(msg) สำหรับอัพเดท GUI
    """
    if not USE_HARDWARE:
        return True
        
    def update(msg):
        if status_callback:
            status_callback(msg)
        print(f"[STATUS] {msg}")
    
    try:
        update("รอเปิดประตู...")

        while GPIO.input(IR_DOOR) == 0:
            time.sleep(0.05)

        update("ประตูเปิด - ใส่ขวดได้")

        while GPIO.input(IR_DOOR) == 1:
            time.sleep(0.05)

        update("ประตูปิด - กำลังสแกน...")

        while True:
            if measure_distance() < 3:
                update("พบขวด → กำลังประมวลผล...")
                time.sleep(0.4)
                return True
            time.sleep(0.05)
    except Exception as e:
        print(f"[GPIO ERROR] {e}")
        time.sleep(0.5)
        raise

# ============================================================
# CLEANUP
# ============================================================
def cleanup():
    all_off()
    global cap
    if cap is not None:
        cap.release()
        cap = None
    if USE_HARDWARE:
        GPIO.cleanup()
        print("[GPIO] Cleanup done")


# ============================================================
# SORTING CONTROLLER CLASS (สำหรับเชื่อมกับ GUI)
# ============================================================
class SortingController:
    """
    Controller สำหรับเชื่อม Hardware กับ GUI
    """
    
    def __init__(self):
        self.cap = None
        self.is_running = False
        self.on_status = None      # callback: (msg) -> None
        self.on_item_sorted = None  # callback: (item_type) -> None  "glass", "plastic", "can"
        
        if USE_HARDWARE:
            init_model()
    
    def start(self):
        """เริ่มการทำงาน"""
        self.is_running = True
        
        if USE_HARDWARE:
            self.cap = open_camera()
            if self.cap:
                self.cap.set(3, 640)
                self.cap.set(4, 480)
        
        # Start auto loop in thread
        threading.Thread(target=self._auto_loop, daemon=True).start()
    
    def stop(self):
        """หยุดการทำงาน"""
        self.is_running = False
        all_off()
        if self.cap:
            self.cap.release()
            self.cap = None
    
    def _update_status(self, msg):
        """อัพเดทสถานะ"""
        if self.on_status:
            self.on_status(msg)
        print(f"[STATUS] {msg}")
    
    def _auto_loop(self):
        """Loop หลักการทำงาน"""
        camera_retry_count = 0
        MAX_RETRY = 5

        while self.is_running:
            if USE_HARDWARE and self.cap is None:
                camera_retry_count += 1
                if camera_retry_count >= MAX_RETRY:
                    self._update_status(f"กล้องไม่พบ - กำลังลองใหม่...")
                    self.cap = open_camera()
                    camera_retry_count = 0
                    if self.cap:
                        self.cap.set(3, 640)
                        self.cap.set(4, 480)
                self._update_status("ไม่พบกล้อง")
                time.sleep(1)
                continue

            camera_retry_count = 0

            # รอใส่ขวด
            try:
                if USE_HARDWARE:
                    wait_auto_start(self._update_status)
                else:
                    self._update_status("กำลังรอรับขยะ")
                    time.sleep(2)  # Simulation
                    continue
            except Exception as e:
                print(f"[AUTO] Auto-start error: {e}")
                time.sleep(0.5)
                continue

            if not self.is_running:
                break

            # อ่านภาพและตรวจจับ
            if USE_HARDWARE and self.cap:
                ret, frame = self.cap.read()
                if not ret:
                    self._update_status("กล้องมีปัญหา")
                    self.cap.release()
                    self.cap = None
                    time.sleep(1)
                    continue

                label = detect_label(frame)
            else:
                label = None

            if label is None:
                self._update_status("ตรวจจับไม่สำเร็จ")
                time.sleep(0.2)
                continue

            if label not in SLOT_IR:
                self._update_status(f"ไม่รู้จัก: {label}")
                continue

            # แสดงว่าพบอะไร
            item_type = LABEL_TO_TYPE.get(label)
            self._update_status(f"พบ: {label}")

            # หมุนไปยังช่อง
            ok = rotate_to_slot(label)
            if not ok:
                self._update_status("หมุนไม่สำเร็จ")
                continue

            # ดัน
            self._update_status("กำลังทิ้ง...")
            pusher_push()

            # เพิ่มแต้ม (ส่งไป GUI)
            if self.on_item_sorted and item_type:
                self.on_item_sorted(item_type)

            # กลับ Home (ถ้าไม่ใช่ Glass)
            if label != "glass_bottle":
                self._update_status("กลับตำแหน่ง...")
                go_home()

            self._update_status("พร้อมรับขยะ")


# ============================================================
# TEST
# ============================================================
if __name__ == '__main__':
    print("=" * 50)
    print("Sorting Hardware Test")
    print("=" * 50)
    print(f"USE_HARDWARE = {USE_HARDWARE}")
    
    if USE_HARDWARE:
        print("\nTesting distance sensor...")
        dist = measure_distance()
        print(f"Distance: {dist:.1f} cm")
        
        print("\nTesting camera...")
        cap = open_camera()
        if cap:
            ret, frame = cap.read()
            print(f"Camera: {'OK' if ret else 'FAILED'}")
            cap.release()
        
        cleanup()
    else:
        print("\nRunning in simulation mode")
        print("This file needs to run on Raspberry Pi with GPIO")
