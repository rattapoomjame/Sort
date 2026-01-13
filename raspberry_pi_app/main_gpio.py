#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
╔═══════════════════════════════════════════════════════════════════╗
║    SORTING MACHINE - RASPBERRY PI VERSION WITH GPIO SUPPORT       ║
║                     For Real Hardware Integration                  ║
╚═══════════════════════════════════════════════════════════════════╝

วิธีใช้งานบน Raspberry Pi:
    1. sudo apt install python3-pyqt5
    2. pip install requests python-dotenv
    3. python main_gpio.py
"""

import sys
import os
import threading
import time
from PyQt5.QtWidgets import QApplication
from PyQt5.QtCore import Qt, QTimer, pyqtSignal, QObject

# Import main GUI
from main import MainWindow, POINTS_CONFIG

# Try to import GPIO
try:
    import RPi.GPIO as GPIO
    IS_RASPBERRY_PI = True
except ImportError:
    IS_RASPBERRY_PI = False
    print("⚠️ RPi.GPIO not found - Running in simulation mode")


# GPIO Pin Configuration
PIN_IR_GLASS = 23
PIN_IR_PLASTIC = 24
PIN_IR_CAN = 25
PIN_SERVO = 18
PIN_LED_GREEN = 20
PIN_LED_RED = 21
PIN_BUZZER = 16


class GPIOController(QObject):
    """Controller สำหรับจัดการ GPIO"""
    item_detected = pyqtSignal(str)  # Signal เมื่อตรวจพบขยะ

    def __init__(self):
        super().__init__()
        self.running = False
        self.thread = None
        
        if IS_RASPBERRY_PI:
            self.setup_gpio()

    def setup_gpio(self):
        """ตั้งค่า GPIO pins"""
        GPIO.setmode(GPIO.BCM)
        GPIO.setwarnings(False)

        # Input - IR Sensors
        GPIO.setup(PIN_IR_GLASS, GPIO.IN, pull_up_down=GPIO.PUD_UP)
        GPIO.setup(PIN_IR_PLASTIC, GPIO.IN, pull_up_down=GPIO.PUD_UP)
        GPIO.setup(PIN_IR_CAN, GPIO.IN, pull_up_down=GPIO.PUD_UP)

        # Output
        GPIO.setup(PIN_SERVO, GPIO.OUT)
        GPIO.setup(PIN_LED_GREEN, GPIO.OUT)
        GPIO.setup(PIN_LED_RED, GPIO.OUT)
        GPIO.setup(PIN_BUZZER, GPIO.OUT)

        # Initial state
        GPIO.output(PIN_LED_GREEN, GPIO.LOW)
        GPIO.output(PIN_LED_RED, GPIO.LOW)
        GPIO.output(PIN_BUZZER, GPIO.LOW)

        # Servo PWM
        self.servo = GPIO.PWM(PIN_SERVO, 50)
        self.servo.start(0)

        print("✅ GPIO initialized")

    def start_detection(self):
        """เริ่มตรวจจับขยะ"""
        if not IS_RASPBERRY_PI:
            print("⚠️ GPIO not available - use keyboard 1,2,3 to simulate")
            return

        self.running = True
        self.thread = threading.Thread(target=self._detection_loop, daemon=True)
        self.thread.start()
        
        # LED สีเขียว
        GPIO.output(PIN_LED_GREEN, GPIO.HIGH)
        GPIO.output(PIN_LED_RED, GPIO.LOW)
        
        print("🟢 Detection started")

    def stop_detection(self):
        """หยุดตรวจจับ"""
        self.running = False
        
        if IS_RASPBERRY_PI:
            GPIO.output(PIN_LED_GREEN, GPIO.LOW)
        
        print("⏸️ Detection stopped")

    def _detection_loop(self):
        """Loop ตรวจจับขยะจาก IR Sensors"""
        last_detection = 0
        debounce_time = 2  # วินาที

        while self.running:
            current_time = time.time()

            # ตรวจสอบแต่ละ sensor
            if GPIO.input(PIN_IR_GLASS) == GPIO.LOW:
                if current_time - last_detection > debounce_time:
                    self._on_item_detected('glass')
                    last_detection = current_time

            elif GPIO.input(PIN_IR_PLASTIC) == GPIO.LOW:
                if current_time - last_detection > debounce_time:
                    self._on_item_detected('plastic')
                    last_detection = current_time

            elif GPIO.input(PIN_IR_CAN) == GPIO.LOW:
                if current_time - last_detection > debounce_time:
                    self._on_item_detected('can')
                    last_detection = current_time

            time.sleep(0.05)  # 50ms polling

    def _on_item_detected(self, item_type: str):
        """เมื่อตรวจพบขยะ"""
        print(f"📦 Detected: {item_type}")
        
        # Beep
        self._beep()
        
        # Move servo
        self._move_servo(item_type)
        
        # Emit signal to UI
        self.item_detected.emit(item_type)

    def _beep(self, duration=0.1):
        """ส่งเสียง buzzer"""
        if IS_RASPBERRY_PI:
            GPIO.output(PIN_BUZZER, GPIO.HIGH)
            time.sleep(duration)
            GPIO.output(PIN_BUZZER, GPIO.LOW)

    def _move_servo(self, item_type: str):
        """หมุน servo ไปช่องที่ถูกต้อง"""
        angles = {
            'glass': 0,
            'plastic': 90,
            'can': 180
        }
        
        angle = angles.get(item_type, 90)
        
        if IS_RASPBERRY_PI:
            duty = angle / 18 + 2
            self.servo.ChangeDutyCycle(duty)
            time.sleep(0.5)
            self.servo.ChangeDutyCycle(0)

    def show_error(self):
        """แสดง LED สีแดง"""
        if IS_RASPBERRY_PI:
            GPIO.output(PIN_LED_RED, GPIO.HIGH)
            GPIO.output(PIN_LED_GREEN, GPIO.LOW)

    def cleanup(self):
        """ล้าง GPIO"""
        if IS_RASPBERRY_PI:
            self.servo.stop()
            GPIO.cleanup()
            print("✅ GPIO cleaned up")


class MainWindowGPIO(MainWindow):
    """MainWindow พร้อม GPIO support"""

    def __init__(self):
        super().__init__()
        self.gpio = GPIOController()
        self.gpio.item_detected.connect(self.on_gpio_item_detected)

        # Override start/stop buttons
        self.main_page.start_btn.clicked.disconnect()
        self.main_page.start_btn.clicked.connect(self.start_with_gpio)

        self.main_page.stop_btn.clicked.disconnect()
        self.main_page.stop_btn.clicked.connect(self.stop_with_gpio)

    def start_with_gpio(self):
        self.main_page.start_machine()
        self.gpio.start_detection()

    def stop_with_gpio(self):
        self.main_page.stop_machine()
        self.gpio.stop_detection()

    def on_gpio_item_detected(self, item_type: str):
        """เมื่อ GPIO ตรวจพบขยะ"""
        self.main_page.add_item(item_type)

    def closeEvent(self, event):
        """Cleanup เมื่อปิดโปรแกรม"""
        self.gpio.cleanup()
        super().closeEvent(event)


def main():
    # High DPI support
    QApplication.setAttribute(Qt.AA_EnableHighDpiScaling, True)
    QApplication.setAttribute(Qt.AA_UseHighDpiPixmaps, True)

    app = QApplication(sys.argv)
    app.setStyle('Fusion')

    window = MainWindowGPIO()
    window.show()

    print("\n" + "=" * 50)
    print("🚀 Sorting Machine GUI Started")
    print("=" * 50)
    
    if IS_RASPBERRY_PI:
        print("✅ Running on Raspberry Pi with GPIO")
    else:
        print("⚠️ Simulation mode - Press 1, 2, 3 to add items")
    
    print("=" * 50 + "\n")

    sys.exit(app.exec_())


if __name__ == '__main__':
    main()
