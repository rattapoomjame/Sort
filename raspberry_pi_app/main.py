#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
╔═══════════════════════════════════════════════════════════════════╗
║                    SORTING MACHINE - PyQt5 GUI                     ║
║              ระบบสะสมแต้มรีไซเคิล (Recycle Points System)           ║
║                   + Hardware Control (GPIO/YOLO)                   ║
╚═══════════════════════════════════════════════════════════════════╝

วิธีใช้งาน:
    pip install PyQt5 requests python-dotenv
    python main.py
    
สำหรับ Raspberry Pi (ต่อ Hardware):
    - ตั้ง USE_GPIO=true ใน .env
    - ติดตั้ง: pip install RPi.GPIO ultralytics opencv-python
"""

import sys
import os
from PyQt5.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QLabel, QPushButton, QLineEdit, QStackedWidget, QFrame,
    QGridLayout, QMessageBox, QSizePolicy, QSpacerItem, QShortcut, QDialog
)
from PyQt5.QtCore import Qt, QTimer, QSize, QPropertyAnimation, QSequentialAnimationGroup, pyqtProperty, pyqtSignal, QObject
from PyQt5.QtGui import QFont, QPixmap, QPainter, QColor, QKeySequence
from PyQt5.QtSvg import QSvgWidget, QSvgRenderer

from config import POINTS_CONFIG, DISPLAY_WIDTH, DISPLAY_HEIGHT, FULLSCREEN, USE_GPIO
from api_client import APIClient

# Hardware Controller (สำหรับ Raspberry Pi)
if USE_GPIO:
    from sorting_hardware import SortingController, cleanup as hardware_cleanup
else:
    SortingController = None
    hardware_cleanup = None

# Get the path to images
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# raspberry_pi_app → ecopoints → public
PROJECT_DIR = os.path.dirname(BASE_DIR)
PUBLIC_DIR = os.path.join(PROJECT_DIR, 'public')

# Image paths
IMAGES = {
    'glass': os.path.join(PUBLIC_DIR, 'glass.png'),
    'plastic': os.path.join(PUBLIC_DIR, 'plastic.png'),
    'can': os.path.join(PUBLIC_DIR, 'can.png'),
    'recycle': os.path.join(PUBLIC_DIR, 'recycle.svg'),
    'bottle': os.path.join(PUBLIC_DIR, 'bottle.svg'),
    'qr_register': os.path.join(PUBLIC_DIR, 'frame.png'),
}

# Colors
COLORS = {
    'primary': '#10B981',
    'primary_dark': '#059669',
    'primary_light': '#D1FAE5',
    'background': '#ECFDF5',
    'white': '#FFFFFF',
    'text': '#064E3B',
    'text_secondary': '#6B7280',
    'danger': '#EF4444',
    'warning': '#F59E0B',
}


def create_icon_label(emoji: str, size: int = 48) -> QLabel:
    """สร้าง label แสดง emoji"""
    label = QLabel(emoji)
    label.setFont(QFont('Segoe UI Emoji', size))
    label.setAlignment(Qt.AlignCenter)
    return label


def create_image_label(image_path: str, width: int = 64, height: int = 64) -> QWidget:
    """สร้าง widget แสดงรูปภาพ (รองรับทั้ง PNG และ SVG)"""
    
    if os.path.exists(image_path):
        # ถ้าเป็น SVG ใช้ QSvgWidget
        if image_path.lower().endswith('.svg'):
            try:
                svg_widget = QSvgWidget(image_path)
                svg_widget.setFixedSize(width, height)
                return svg_widget
            except:
                pass
        
        # ถ้าเป็นรูปอื่น (PNG, JPG) ใช้ QLabel + QPixmap
        pixmap = QPixmap(image_path)
        if not pixmap.isNull():
            label = QLabel()
            label.setAlignment(Qt.AlignCenter)
            scaled = pixmap.scaled(width, height, Qt.KeepAspectRatio, Qt.SmoothTransformation)
            label.setPixmap(scaled)
            label.setFixedSize(width, height)
            return label
    
    # Fallback: แสดง emoji
    label = QLabel("♻️")
    label.setFont(QFont('Segoe UI Emoji', width // 2))
    label.setAlignment(Qt.AlignCenter)
    label.setFixedSize(width, height)
    return label


class StyleHelper:
    """Helper class สำหรับ styles"""

    @staticmethod
    def button_primary(min_height: int = 50) -> str:
        return f"""
            QPushButton {{
                background-color: {COLORS['primary']};
                color: white;
                border: none;
                border-radius: 12px;
                font-size: 18px;
                font-weight: bold;
                min-height: {min_height}px;
                padding: 0 24px;
            }}
            QPushButton:hover {{
                background-color: {COLORS['primary_dark']};
            }}
            QPushButton:pressed {{
                background-color: #047857;
            }}
            QPushButton:disabled {{
                background-color: #9CA3AF;
            }}
        """

    @staticmethod
    def button_secondary(min_height: int = 50) -> str:
        return f"""
            QPushButton {{
                background-color: white;
                color: {COLORS['primary']};
                border: 2px solid {COLORS['primary']};
                border-radius: 12px;
                font-size: 18px;
                font-weight: bold;
                min-height: {min_height}px;
                padding: 0 24px;
            }}
            QPushButton:hover {{
                background-color: {COLORS['primary_light']};
            }}
        """

    @staticmethod
    def button_danger(min_height: int = 40) -> str:
        return f"""
            QPushButton {{
                background-color: {COLORS['danger']};
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: bold;
                min-height: {min_height}px;
                padding: 0 16px;
            }}
            QPushButton:hover {{
                background-color: #DC2626;
            }}
        """

    @staticmethod
    def button_icon(size: int = 40) -> str:
        return f"""
            QPushButton {{
                background-color: rgba(255, 255, 255, 0.9);
                color: {COLORS['text']};
                border: none;
                border-radius: {size // 2}px;
                font-size: 18px;
                min-width: {size}px;
                max-width: {size}px;
                min-height: {size}px;
                max-height: {size}px;
            }}
            QPushButton:hover {{
                background-color: white;
            }}
        """

    @staticmethod
    def input_field() -> str:
        return f"""
            QLineEdit {{
                border: 2px solid #D1D5DB;
                border-radius: 12px;
                padding: 12px 16px;
                font-size: 20px;
                background: white;
            }}
            QLineEdit:focus {{
                border-color: {COLORS['primary']};
            }}
        """

    @staticmethod
    def card() -> str:
        return f"""
            QFrame {{
                background-color: white;
                border-radius: 16px;
                border: none;
            }}
        """


# ============================================================
# PAGE: HOME (หน้าแรก)
# ============================================================
class HomePage(QWidget):
    """หน้าแรกของระบบ - ออกแบบให้สวยงาม"""

    def __init__(self, parent=None):
        super().__init__(parent)
        self.main_window = parent
        self.setup_ui()

    def setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(40, 30, 40, 30)
        layout.setSpacing(0)

        # Top bar with fullscreen button
        top_bar = QHBoxLayout()
        top_bar.addStretch()

        self.fullscreen_btn = QPushButton("⛶")
        self.fullscreen_btn.setStyleSheet(StyleHelper.button_icon(36))
        self.fullscreen_btn.setToolTip("เต็มจอ / ออกจากเต็มจอ (F11)")
        self.fullscreen_btn.clicked.connect(self.toggle_fullscreen)
        top_bar.addWidget(self.fullscreen_btn)

        layout.addLayout(top_bar)

        layout.addStretch(2)

        # Logo area
        logo_frame = QFrame()
        logo_frame.setFixedSize(90, 90)
        logo_frame.setStyleSheet(f"""
            QFrame {{
                background-color: {COLORS['primary']};
                border-radius: 22px;
            }}
        """)
        logo_layout = QVBoxLayout(logo_frame)
        logo_layout.setAlignment(Qt.AlignCenter)
        logo_layout.setContentsMargins(0, 0, 0, 0)

        recycle_icon = QLabel("♻️")
        recycle_icon.setFont(QFont('Segoe UI Emoji', 36))
        recycle_icon.setAlignment(Qt.AlignCenter)
        recycle_icon.setStyleSheet("background: transparent;")
        logo_layout.addWidget(recycle_icon)

        logo_container = QHBoxLayout()
        logo_container.addStretch()
        logo_container.addWidget(logo_frame)
        logo_container.addStretch()
        layout.addLayout(logo_container)

        layout.addSpacing(15)

        # Title
        title = QLabel("Sorting Machine")
        title.setFont(QFont('Segoe UI', 36, QFont.Bold))
        title.setStyleSheet(f"color: {COLORS['primary']};")
        title.setAlignment(Qt.AlignCenter)
        layout.addWidget(title)

        # Subtitle
        subtitle = QLabel("ระบบสะสมแต้มรีไซเคิล")
        subtitle.setFont(QFont('Segoe UI', 14))
        subtitle.setStyleSheet(f"color: {COLORS['primary_dark']};")
        subtitle.setAlignment(Qt.AlignCenter)
        layout.addWidget(subtitle)

        layout.addStretch(2)

        # Features row - 3 cards แยกชัดเจน
        features_layout = QHBoxLayout()
        features_layout.setSpacing(25)

        features = [
            ("🌍", "ช่วยโลก"),
            ("♻️", "รีไซเคิล"),
            ("💰", "แลกเงิน"),
        ]

        for emoji, title_text in features:
            card = QFrame()
            card.setFixedSize(110, 100)
            card.setStyleSheet(f"""
                QFrame {{
                    background-color: white;
                    border-radius: 18px;
                }}
            """)
            
            card_layout = QVBoxLayout(card)
            card_layout.setContentsMargins(10, 12, 10, 12)
            card_layout.setSpacing(5)
            card_layout.setAlignment(Qt.AlignCenter)

            icon = QLabel(emoji)
            icon.setFont(QFont('Segoe UI Emoji', 30))
            icon.setAlignment(Qt.AlignCenter)
            card_layout.addWidget(icon)

            label = QLabel(title_text)
            label.setFont(QFont('Segoe UI', 12, QFont.Bold))
            label.setStyleSheet(f"color: {COLORS['text']};")
            label.setAlignment(Qt.AlignCenter)
            card_layout.addWidget(label)

            features_layout.addWidget(card)

        features_container = QHBoxLayout()
        features_container.addStretch()
        features_container.addLayout(features_layout)
        features_container.addStretch()
        layout.addLayout(features_container)

        layout.addStretch(3)

        # Start button
        start_btn = QPushButton("🚀  เริ่มต้นใช้งาน")
        start_btn.setFixedHeight(60)
        start_btn.setStyleSheet(f"""
            QPushButton {{
                background-color: {COLORS['primary']};
                color: white;
                border: none;
                border-radius: 15px;
                font-size: 20px;
                font-weight: bold;
            }}
            QPushButton:hover {{
                background-color: {COLORS['primary_dark']};
            }}
        """)
        start_btn.setCursor(Qt.PointingHandCursor)
        start_btn.clicked.connect(lambda: self.main_window.show_page('login'))
        layout.addWidget(start_btn)

        layout.addSpacing(10)

        # Footer hint
        hint = QLabel("กด F11 เพื่อเต็มจอ")
        hint.setFont(QFont('Segoe UI', 9))
        hint.setStyleSheet(f"color: {COLORS['text_secondary']};")
        hint.setAlignment(Qt.AlignCenter)
        layout.addWidget(hint)

    def toggle_fullscreen(self):
        if self.main_window:
            self.main_window.toggle_fullscreen()


# ============================================================
# PAGE: LOGIN (หน้าล็อกอิน)
# ============================================================
class LoginPage(QWidget):
    """หน้าล็อกอินด้วยเบอร์โทร - พร้อม Numpad สำหรับ Touchscreen"""

    def __init__(self, parent=None):
        super().__init__(parent)
        self.main_window = parent
        self.setup_ui()

    def setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(20, 15, 20, 15)
        layout.setSpacing(0)

        # Top bar
        top_bar = QHBoxLayout()

        back_btn = QPushButton("←")
        back_btn.setStyleSheet(f"""
            QPushButton {{
                background-color: white;
                color: {COLORS['text']};
                border: none;
                border-radius: 20px;
                font-size: 20px;
                font-weight: bold;
                min-width: 40px;
                max-width: 40px;
                min-height: 40px;
                max-height: 40px;
            }}
            QPushButton:hover {{
                background-color: {COLORS['primary_light']};
            }}
        """)
        back_btn.setCursor(Qt.PointingHandCursor)
        back_btn.clicked.connect(lambda: self.main_window.show_page('home'))
        top_bar.addWidget(back_btn)

        top_bar.addStretch()

        self.fullscreen_btn = QPushButton("⛶")
        self.fullscreen_btn.setStyleSheet(StyleHelper.button_icon(40))
        self.fullscreen_btn.clicked.connect(lambda: self.main_window.toggle_fullscreen())
        top_bar.addWidget(self.fullscreen_btn)

        layout.addLayout(top_bar)

        # Main content - horizontal layout
        content_layout = QHBoxLayout()
        content_layout.setSpacing(30)

        # Left side - Login info
        left_widget = QWidget()
        left_layout = QVBoxLayout(left_widget)
        left_layout.setContentsMargins(0, 0, 0, 0)
        left_layout.setSpacing(0)

        left_layout.addStretch(1)

        # Icon with circle background
        icon_frame = QFrame()
        icon_frame.setFixedSize(70, 70)
        icon_frame.setStyleSheet(f"""
            QFrame {{
                background-color: {COLORS['primary']};
                border-radius: 35px;
            }}
        """)
        icon_layout = QVBoxLayout(icon_frame)
        icon_layout.setContentsMargins(0, 0, 0, 0)
        icon_layout.setAlignment(Qt.AlignCenter)
        
        phone_icon = QLabel("📱")
        phone_icon.setFont(QFont('Segoe UI Emoji', 30))
        phone_icon.setAlignment(Qt.AlignCenter)
        phone_icon.setStyleSheet("background: transparent;")
        icon_layout.addWidget(phone_icon)

        icon_container = QHBoxLayout()
        icon_container.addStretch()
        icon_container.addWidget(icon_frame)
        icon_container.addStretch()
        left_layout.addLayout(icon_container)

        left_layout.addSpacing(15)

        # Title
        title = QLabel("เข้าสู่ระบบ")
        title.setFont(QFont('Segoe UI', 28, QFont.Bold))
        title.setStyleSheet(f"color: {COLORS['primary']};")
        title.setAlignment(Qt.AlignCenter)
        left_layout.addWidget(title)

        # Subtitle
        login_subtitle = QLabel("กรอกเบอร์โทรศัพท์ 10 หลัก")
        login_subtitle.setFont(QFont('Segoe UI', 12))
        login_subtitle.setStyleSheet(f"color: {COLORS['text_secondary']};")
        login_subtitle.setAlignment(Qt.AlignCenter)
        left_layout.addWidget(login_subtitle)

        left_layout.addSpacing(20)

        # Phone display - แสดงเบอร์ที่กด
        self.phone_display = QLabel("_ _ _ _ _ _ _ _ _ _")
        self.phone_display.setFont(QFont('Segoe UI', 28, QFont.Bold))
        self.phone_display.setStyleSheet(f"""
            color: {COLORS['text']};
            background-color: white;
            border-radius: 15px;
            padding: 15px;
        """)
        self.phone_display.setAlignment(Qt.AlignCenter)
        self.phone_display.setFixedHeight(70)
        left_layout.addWidget(self.phone_display)

        left_layout.addSpacing(10)

        # Error message
        self.error_label = QLabel("")
        self.error_label.setStyleSheet(f"color: {COLORS['danger']}; font-size: 13px;")
        self.error_label.setAlignment(Qt.AlignCenter)
        self.error_label.setFixedHeight(20)
        left_layout.addWidget(self.error_label)

        left_layout.addStretch(1)

        # Hidden input for storing phone number
        self.phone_input = QLineEdit()
        self.phone_input.setMaxLength(10)
        self.phone_input.hide()

        content_layout.addWidget(left_widget, 1)

        # Right side - Numpad
        numpad_widget = QFrame()
        numpad_widget.setStyleSheet(f"""
            QFrame {{
                background-color: white;
                border-radius: 20px;
            }}
        """)
        numpad_widget.setFixedWidth(280)
        numpad_layout = QVBoxLayout(numpad_widget)
        numpad_layout.setContentsMargins(15, 15, 15, 15)
        numpad_layout.setSpacing(10)

        # Number buttons style
        num_btn_style = f"""
            QPushButton {{
                background-color: {COLORS['background']};
                color: {COLORS['text']};
                border: none;
                border-radius: 12px;
                font-size: 24px;
                font-weight: bold;
                min-height: 55px;
            }}
            QPushButton:hover {{
                background-color: {COLORS['primary_light']};
            }}
            QPushButton:pressed {{
                background-color: {COLORS['primary']};
                color: white;
            }}
        """

        # Create numpad grid
        # Row 1: 1 2 3
        row1 = QHBoxLayout()
        row1.setSpacing(10)
        for num in ['1', '2', '3']:
            btn = QPushButton(num)
            btn.setStyleSheet(num_btn_style)
            btn.setCursor(Qt.PointingHandCursor)
            btn.clicked.connect(lambda checked, n=num: self.numpad_press(n))
            row1.addWidget(btn)
        numpad_layout.addLayout(row1)

        # Row 2: 4 5 6
        row2 = QHBoxLayout()
        row2.setSpacing(10)
        for num in ['4', '5', '6']:
            btn = QPushButton(num)
            btn.setStyleSheet(num_btn_style)
            btn.setCursor(Qt.PointingHandCursor)
            btn.clicked.connect(lambda checked, n=num: self.numpad_press(n))
            row2.addWidget(btn)
        numpad_layout.addLayout(row2)

        # Row 3: 7 8 9
        row3 = QHBoxLayout()
        row3.setSpacing(10)
        for num in ['7', '8', '9']:
            btn = QPushButton(num)
            btn.setStyleSheet(num_btn_style)
            btn.setCursor(Qt.PointingHandCursor)
            btn.clicked.connect(lambda checked, n=num: self.numpad_press(n))
            row3.addWidget(btn)
        numpad_layout.addLayout(row3)

        # Row 4: Clear 0 Delete
        row4 = QHBoxLayout()
        row4.setSpacing(10)

        # Clear button
        clear_btn = QPushButton("C")
        clear_btn.setStyleSheet(f"""
            QPushButton {{
                background-color: {COLORS['danger']};
                color: white;
                border: none;
                border-radius: 12px;
                font-size: 20px;
                font-weight: bold;
                min-height: 55px;
            }}
            QPushButton:hover {{
                background-color: #DC2626;
            }}
        """)
        clear_btn.setCursor(Qt.PointingHandCursor)
        clear_btn.clicked.connect(self.numpad_clear)
        row4.addWidget(clear_btn)

        # 0 button
        btn_0 = QPushButton("0")
        btn_0.setStyleSheet(num_btn_style)
        btn_0.setCursor(Qt.PointingHandCursor)
        btn_0.clicked.connect(lambda: self.numpad_press('0'))
        row4.addWidget(btn_0)

        # Delete button
        del_btn = QPushButton("⌫")
        del_btn.setStyleSheet(f"""
            QPushButton {{
                background-color: {COLORS['warning']};
                color: white;
                border: none;
                border-radius: 12px;
                font-size: 20px;
                font-weight: bold;
                min-height: 55px;
            }}
            QPushButton:hover {{
                background-color: #D97706;
            }}
        """)
        del_btn.setCursor(Qt.PointingHandCursor)
        del_btn.clicked.connect(self.numpad_delete)
        row4.addWidget(del_btn)

        numpad_layout.addLayout(row4)

        # Login button
        self.login_btn = QPushButton("เข้าสู่ระบบ")
        self.login_btn.setStyleSheet(f"""
            QPushButton {{
                background-color: {COLORS['primary']};
                color: white;
                border: none;
                border-radius: 12px;
                font-size: 18px;
                font-weight: bold;
                min-height: 55px;
            }}
            QPushButton:hover {{
                background-color: {COLORS['primary_dark']};
            }}
            QPushButton:disabled {{
                background-color: #9CA3AF;
            }}
        """)
        self.login_btn.setCursor(Qt.PointingHandCursor)
        self.login_btn.clicked.connect(self.do_login)
        numpad_layout.addWidget(self.login_btn)

        content_layout.addWidget(numpad_widget)

        layout.addLayout(content_layout, 1)

    def numpad_press(self, num: str):
        """กดตัวเลข"""
        current = self.phone_input.text()
        if len(current) < 10:
            self.phone_input.setText(current + num)
            self.update_display()
            self.error_label.setText("")

    def numpad_delete(self):
        """ลบตัวเลขสุดท้าย"""
        current = self.phone_input.text()
        if current:
            self.phone_input.setText(current[:-1])
            self.update_display()

    def numpad_clear(self):
        """ล้างทั้งหมด"""
        self.phone_input.setText("")
        self.update_display()
        self.error_label.setText("")

    def update_display(self):
        """อัพเดทการแสดงเบอร์โทร"""
        phone = self.phone_input.text()
        display = ""
        for i in range(10):
            if i < len(phone):
                display += phone[i]
            else:
                display += "_"
            if i < 9:
                display += " "
        
        self.phone_display.setText(display)
        
        # เปลี่ยนสีเมื่อครบ 10 หลัก
        if len(phone) == 10:
            self.phone_display.setStyleSheet(f"""
                color: {COLORS['primary']};
                background-color: {COLORS['primary_light']};
                border-radius: 15px;
                padding: 15px;
            """)
        else:
            self.phone_display.setStyleSheet(f"""
                color: {COLORS['text']};
                background-color: white;
                border-radius: 15px;
                padding: 15px;
            """)

    def do_login(self):
        phone = self.phone_input.text().strip()

        if not phone or len(phone) < 10:
            self.error_label.setText("กรุณากรอกเบอร์โทรศัพท์ 10 หลัก")
            self.error_label.show()
            return

        self.login_btn.setEnabled(False)
        self.login_btn.setText("กำลังเข้าสู่ระบบ...")

        result = self.main_window.api.login(phone)

        if result['success']:
            self.error_label.hide()
            self.main_window.user_data = result['user']
            self.main_window.current_points = result.get('points', 0)
            # ไปหน้า Processing เลย (ข้าม MainPage)
            self.main_window.processing_page.start_processing()
            self.main_window.show_page('processing')
            # Reset หลัง login สำเร็จ
            self.reset()
        else:
            # ไม่พบเบอร์ในระบบ - แสดง error และ QR Code สำหรับลงทะเบียน
            self.error_label.setText("❌ ไม่พบเบอร์นี้ในระบบ")
            self.error_label.show()
            self.show_register_qr_dialog()
            # Reset เบอร์โทรเพื่อให้กรอกใหม่
            self.reset()

        self.login_btn.setEnabled(True)
        self.login_btn.setText("เข้าสู่ระบบ")

    def show_register_qr_dialog(self):
        """แสดง Dialog พร้อม QR Code สำหรับลงทะเบียน"""
        dialog = QDialog(self)
        dialog.setWindowTitle("ลงทะเบียน")
        dialog.setFixedSize(320, 420)
        dialog.setStyleSheet(f"background-color: white; border-radius: 20px;")
        
        layout = QVBoxLayout(dialog)
        layout.setContentsMargins(20, 20, 20, 20)
        layout.setSpacing(8)
        
        # Title
        title = QLabel("❌ ไม่พบเบอร์ในระบบ")
        title.setFont(QFont('Segoe UI', 16, QFont.Bold))
        title.setStyleSheet(f"color: {COLORS['danger']};")
        title.setAlignment(Qt.AlignCenter)
        layout.addWidget(title)
        
        # Subtitle
        subtitle = QLabel("สแกน QR Code เพื่อลงทะเบียน")
        subtitle.setFont(QFont('Segoe UI', 11))
        subtitle.setStyleSheet(f"color: {COLORS['text_secondary']};")
        subtitle.setAlignment(Qt.AlignCenter)
        layout.addWidget(subtitle)
        
        # QR Code Image - ขนาดเล็กลง
        qr_label = QLabel()
        qr_label.setAlignment(Qt.AlignCenter)
        qr_path = IMAGES.get('qr_register', '')
        if os.path.exists(qr_path):
            pixmap = QPixmap(qr_path)
            if not pixmap.isNull():
                scaled = pixmap.scaled(220, 220, Qt.KeepAspectRatio, Qt.SmoothTransformation)
                qr_label.setPixmap(scaled)
            else:
                qr_label.setText("QR Code")
                qr_label.setFont(QFont('Segoe UI', 16))
        else:
            qr_label.setText("📷 QR Code\n(วางไฟล์ frame.png ใน public)")
            qr_label.setFont(QFont('Segoe UI', 11))
            qr_label.setStyleSheet(f"color: {COLORS['text_secondary']}; padding: 30px; border: 2px dashed #ccc; border-radius: 10px;")
        layout.addWidget(qr_label)
        
        # Close button
        close_btn = QPushButton("ปิด")
        close_btn.setStyleSheet(StyleHelper.button_primary(45))
        close_btn.setCursor(Qt.PointingHandCursor)
        close_btn.clicked.connect(dialog.close)
        layout.addWidget(close_btn)
        
        dialog.exec_()

    def reset(self):
        """Reset ฟอร์ม login"""
        self.phone_input.clear()
        self.error_label.hide()
        # Reset display กลับเป็นค่าเริ่มต้น
        self.phone_display.setText("_ _ _ _ _ _ _ _ _ _")
        self.phone_display.setStyleSheet(f"""
            color: {COLORS['text']};
            background-color: white;
            border-radius: 15px;
            padding: 15px;
        """)


# ============================================================
# PAGE: MAIN (หน้าหลัก - พร้อมเริ่มใส่ขยะ)
# ============================================================
class MainPage(QWidget):
    """หน้าหลักหลัง Login - แสดงข้อมูลผู้ใช้และปุ่มเริ่มใส่ขยะ"""

    def __init__(self, parent=None):
        super().__init__(parent)
        self.main_window = parent
        self.setup_ui()

    def setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(30, 30, 30, 30)
        layout.setSpacing(15)

        # Top bar
        top_bar = QHBoxLayout()

        # User info
        self.user_label = QLabel("👤 ผู้ใช้")
        self.user_label.setFont(QFont('Segoe UI', 14))
        self.user_label.setStyleSheet(f"color: {COLORS['text']};")
        top_bar.addWidget(self.user_label)

        top_bar.addStretch()

        # Points badge
        self.points_badge = QLabel("⭐ 0 แต้ม")
        self.points_badge.setFont(QFont('Segoe UI', 14, QFont.Bold))
        self.points_badge.setStyleSheet(f"""
            background-color: {COLORS['warning']};
            color: white;
            padding: 8px 20px;
            border-radius: 20px;
        """)
        top_bar.addWidget(self.points_badge)

        # Fullscreen button
        fullscreen_btn = QPushButton("⛶")
        fullscreen_btn.setStyleSheet(StyleHelper.button_icon(40))
        fullscreen_btn.clicked.connect(lambda: self.main_window.toggle_fullscreen())
        top_bar.addWidget(fullscreen_btn)

        # Logout button
        logout_btn = QPushButton("ออก")
        logout_btn.setStyleSheet(StyleHelper.button_danger(40))
        logout_btn.setCursor(Qt.PointingHandCursor)
        logout_btn.clicked.connect(self.do_logout)
        top_bar.addWidget(logout_btn)

        layout.addLayout(top_bar)

        layout.addStretch()

        # Center content
        center_frame = QFrame()
        center_frame.setStyleSheet(f"""
            QFrame {{
                background-color: white;
                border-radius: 25px;
            }}
        """)
        center_layout = QVBoxLayout(center_frame)
        center_layout.setContentsMargins(40, 40, 40, 40)
        center_layout.setSpacing(20)
        center_layout.setAlignment(Qt.AlignCenter)

        # Welcome icon
        welcome_icon = QLabel("♻️")
        welcome_icon.setFont(QFont('Segoe UI Emoji', 70))
        welcome_icon.setAlignment(Qt.AlignCenter)
        center_layout.addWidget(welcome_icon)

        # Welcome text
        welcome_text = QLabel("พร้อมรีไซเคิล!")
        welcome_text.setFont(QFont('Segoe UI', 32, QFont.Bold))
        welcome_text.setStyleSheet(f"color: {COLORS['primary']};")
        welcome_text.setAlignment(Qt.AlignCenter)
        center_layout.addWidget(welcome_text)

        # Sub text
        sub_text = QLabel("กดปุ่มด้านล่างเพื่อเริ่มใส่ขยะรีไซเคิล")
        sub_text.setFont(QFont('Segoe UI', 14))
        sub_text.setStyleSheet(f"color: {COLORS['text_secondary']};")
        sub_text.setAlignment(Qt.AlignCenter)
        center_layout.addWidget(sub_text)

        layout.addWidget(center_frame)

        layout.addStretch()

        # Start button - big and prominent
        start_btn = QPushButton("🚀  เริ่มใส่ขยะ")
        start_btn.setFixedHeight(70)
        start_btn.setStyleSheet(f"""
            QPushButton {{
                background-color: {COLORS['primary']};
                color: white;
                border: none;
                border-radius: 18px;
                font-size: 24px;
                font-weight: bold;
            }}
            QPushButton:hover {{
                background-color: {COLORS['primary_dark']};
            }}
        """)
        start_btn.setCursor(Qt.PointingHandCursor)
        start_btn.clicked.connect(self.go_to_processing)
        layout.addWidget(start_btn)

        # Hint
        hint_label = QLabel("💡 กด 1=แก้ว, 2=พลาสติก, 3=กระป๋อง เพื่อทดสอบ")
        hint_label.setFont(QFont('Segoe UI', 10))
        hint_label.setStyleSheet(f"color: {COLORS['text_secondary']};")
        hint_label.setAlignment(Qt.AlignCenter)
        layout.addWidget(hint_label)

    def update_user_info(self):
        """อัพเดทข้อมูลผู้ใช้"""
        if self.main_window.user_data:
            username = self.main_window.user_data.get('username', 'ผู้ใช้')
            self.user_label.setText(f"👤 {username}")
            points = self.main_window.current_points
            self.points_badge.setText(f"⭐ {points:,} แต้ม")

    def go_to_processing(self):
        """ไปหน้า Processing"""
        self.main_window.processing_page.start_processing()
        self.main_window.show_page('processing')

    def do_logout(self):
        """ออกจากระบบ"""
        self.main_window.api.logout()
        self.main_window.user_data = None
        self.main_window.current_points = 0
        self.main_window.login_page.reset()
        self.main_window.show_page('home')


# ============================================================
# PAGE: PROCESSING (หน้ากำลังทำงาน)
# ============================================================
# Signal Emitter สำหรับ Hardware → GUI (Thread-safe)
# ============================================================
class HardwareSignals(QObject):
    """ส่ง Signal จาก Hardware Thread ไป GUI"""
    status_changed = pyqtSignal(str)
    item_detected = pyqtSignal(str)


# ============================================================
class ProcessingPage(QWidget):
    """หน้าแสดงสถานะกำลังทำงาน พร้อม Animation + Hardware Control"""

    def __init__(self, parent=None):
        super().__init__(parent)
        self.main_window = parent
        self.counts = {'glass': 0, 'plastic': 0, 'can': 0}
        self.animation_step = 0
        self.dot_count = 0
        self.is_processing = False
        
        # Timer สำหรับ animation
        self.anim_timer = QTimer()
        self.anim_timer.timeout.connect(self.animate)
        
        # Hardware Controller (ถ้ารันบน Raspberry Pi)
        self.sorting_controller = None
        self.hw_signals = HardwareSignals()
        self.hw_signals.status_changed.connect(self.update_status_text)
        self.hw_signals.item_detected.connect(self.add_item)
        
        self.setup_ui()

    def setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(20, 15, 20, 15)
        layout.setSpacing(0)

        # Top bar with user info
        top_bar = QHBoxLayout()
        
        # User info (left)
        user_frame = QFrame()
        user_frame.setStyleSheet(f"""
            QFrame {{
                background-color: white;
                border-radius: 10px;
                padding: 5px;
            }}
        """)
        user_layout = QHBoxLayout(user_frame)
        user_layout.setContentsMargins(10, 5, 10, 5)
        
        self.user_label = QLabel("👤 ผู้ใช้")
        self.user_label.setFont(QFont('Segoe UI', 12))
        user_layout.addWidget(self.user_label)
        
        self.points_badge = QLabel("⭐ 0 แต้ม")
        self.points_badge.setFont(QFont('Segoe UI', 12, QFont.Bold))
        self.points_badge.setStyleSheet(f"color: {COLORS['warning']};")
        user_layout.addWidget(self.points_badge)
        
        top_bar.addWidget(user_frame)
        top_bar.addStretch()
        
        self.fullscreen_btn = QPushButton("⛶")
        self.fullscreen_btn.setStyleSheet(StyleHelper.button_icon(36))
        self.fullscreen_btn.clicked.connect(lambda: self.main_window.toggle_fullscreen())
        top_bar.addWidget(self.fullscreen_btn)
        
        layout.addLayout(top_bar)
        layout.addSpacing(10)

        # Main content area - horizontal layout
        content_layout = QHBoxLayout()
        content_layout.setSpacing(20)

        # LEFT SIDE - QR Code
        qr_frame = QFrame()
        qr_frame.setStyleSheet(f"""
            QFrame {{
                background-color: white;
                border-radius: 15px;
                border: 2px solid {COLORS['primary']};
            }}
        """)
        qr_frame.setFixedWidth(200)
        qr_layout = QVBoxLayout(qr_frame)
        qr_layout.setContentsMargins(15, 15, 15, 15)
        qr_layout.setAlignment(Qt.AlignCenter)
        
        qr_title = QLabel("📱 ดูแต้มสะสม")
        qr_title.setFont(QFont('Segoe UI', 11, QFont.Bold))
        qr_title.setStyleSheet(f"color: {COLORS['primary']};")
        qr_title.setAlignment(Qt.AlignCenter)
        qr_layout.addWidget(qr_title)
        
        # QR Code image
        qr_label = QLabel()
        qr_path = IMAGES.get('qr_register', '')
        if os.path.exists(qr_path):
            pixmap = QPixmap(qr_path)
            qr_label.setPixmap(pixmap.scaled(150, 150, Qt.KeepAspectRatio, Qt.SmoothTransformation))
        else:
            qr_label.setText("📷")
            qr_label.setFont(QFont('Segoe UI Emoji', 48))
        qr_label.setAlignment(Qt.AlignCenter)
        qr_layout.addWidget(qr_label)
        
        qr_sub = QLabel("สแกนเพื่อดูแต้ม")
        qr_sub.setFont(QFont('Segoe UI', 9))
        qr_sub.setStyleSheet(f"color: {COLORS['text_secondary']};")
        qr_sub.setAlignment(Qt.AlignCenter)
        qr_layout.addWidget(qr_sub)
        
        content_layout.addWidget(qr_frame)

        # CENTER - Main Animation
        center_frame = QFrame()
        center_frame.setStyleSheet(f"""
            QFrame {{
                background-color: white;
                border-radius: 20px;
            }}
        """)
        center_layout = QVBoxLayout(center_frame)
        center_layout.setContentsMargins(20, 20, 20, 20)
        center_layout.setSpacing(5)
        
        center_layout.addStretch()

        # Main icon - คงที่ไม่เปลี่ยน
        self.main_icon = QLabel("♻️")
        self.main_icon.setFont(QFont('Segoe UI Emoji', 60))
        self.main_icon.setAlignment(Qt.AlignCenter)
        center_layout.addWidget(self.main_icon)

        # Status text - คงที่
        self.status_text = QLabel("กำลังรอรับขยะ")
        self.status_text.setFont(QFont('Segoe UI', 28, QFont.Bold))
        self.status_text.setStyleSheet(f"color: {COLORS['primary']};")
        self.status_text.setAlignment(Qt.AlignCenter)
        center_layout.addWidget(self.status_text)

        # Animated dots - แค่จุดขยับ
        self.dots_label = QLabel(".")
        self.dots_label.setFont(QFont('Segoe UI', 36, QFont.Bold))
        self.dots_label.setStyleSheet(f"color: {COLORS['primary']};")
        self.dots_label.setAlignment(Qt.AlignCenter)
        self.dots_label.setFixedHeight(50)
        center_layout.addWidget(self.dots_label)

        center_layout.addSpacing(20)

        # Count display
        self.count_label = QLabel("📦 0 ชิ้น")
        self.count_label.setFont(QFont('Segoe UI', 24, QFont.Bold))
        self.count_label.setStyleSheet(f"color: {COLORS['text']};")
        self.count_label.setAlignment(Qt.AlignCenter)
        center_layout.addWidget(self.count_label)

        # Points display
        self.points_label = QLabel("⭐ +0 แต้ม")
        self.points_label.setFont(QFont('Segoe UI', 18))
        self.points_label.setStyleSheet(f"color: {COLORS['warning']};")
        self.points_label.setAlignment(Qt.AlignCenter)
        center_layout.addWidget(self.points_label)

        center_layout.addStretch()
        
        content_layout.addWidget(center_frame, 1)

        # RIGHT SIDE - Item counts
        items_frame = QFrame()
        items_frame.setStyleSheet(f"""
            QFrame {{
                background-color: white;
                border-radius: 15px;
            }}
        """)
        items_frame.setFixedWidth(200)
        items_layout = QVBoxLayout(items_frame)
        items_layout.setContentsMargins(15, 15, 15, 15)
        items_layout.setSpacing(8)
        
        items_title = QLabel("🗑️ ขยะที่ใส่")
        items_title.setFont(QFont('Segoe UI', 12, QFont.Bold))
        items_title.setStyleSheet(f"color: {COLORS['text']};")
        items_title.setAlignment(Qt.AlignCenter)
        items_layout.addWidget(items_title)
        
        self.item_labels = {}
        for item_type, config in POINTS_CONFIG.items():
            item_row = QFrame()
            item_row.setStyleSheet(f"""
                QFrame {{
                    background-color: {COLORS['background']};
                    border-radius: 10px;
                }}
            """)
            item_row.setFixedHeight(60)
            row_layout = QHBoxLayout(item_row)
            row_layout.setContentsMargins(10, 5, 10, 5)
            
            # ใช้รูปภาพแทน emoji
            icon_lbl = QLabel()
            img_path = IMAGES.get(item_type, '')
            if os.path.exists(img_path):
                pixmap = QPixmap(img_path)
                icon_lbl.setPixmap(pixmap.scaled(40, 40, Qt.KeepAspectRatio, Qt.SmoothTransformation))
            else:
                icon_lbl.setText(config['emoji'])
                icon_lbl.setFont(QFont('Segoe UI Emoji', 20))
            icon_lbl.setFixedSize(45, 45)
            icon_lbl.setAlignment(Qt.AlignCenter)
            row_layout.addWidget(icon_lbl)
            
            name_lbl = QLabel(config['name'])
            name_lbl.setFont(QFont('Segoe UI', 11))
            row_layout.addWidget(name_lbl)
            
            row_layout.addStretch()
            
            count_lbl = QLabel("0")
            count_lbl.setFont(QFont('Segoe UI', 20, QFont.Bold))
            count_lbl.setStyleSheet(f"color: {COLORS['primary']};")
            row_layout.addWidget(count_lbl)
            
            self.item_labels[item_type] = count_lbl
            items_layout.addWidget(item_row)
        
        items_layout.addStretch()
        
        # Hint
        hint_lbl = QLabel("💡 กด 1,2,3 เพื่อทดสอบ")
        hint_lbl.setFont(QFont('Segoe UI', 9))
        hint_lbl.setStyleSheet(f"color: {COLORS['text_secondary']};")
        hint_lbl.setAlignment(Qt.AlignCenter)
        items_layout.addWidget(hint_lbl)
        
        content_layout.addWidget(items_frame)
        
        layout.addLayout(content_layout, 1)
        layout.addSpacing(10)

        # Bottom button - เฉพาะปุ่มหยุด
        btn_layout = QHBoxLayout()
        
        # Stop button
        self.stop_btn = QPushButton("⏹️  หยุด & สรุปผล")
        self.stop_btn.setFixedHeight(55)
        self.stop_btn.setStyleSheet(f"""
            QPushButton {{
                background-color: {COLORS['danger']};
                color: white;
                border: none;
                border-radius: 14px;
                font-size: 18px;
                font-weight: bold;
            }}
            QPushButton:hover {{
                background-color: #DC2626;
            }}
        """)
        self.stop_btn.setCursor(Qt.PointingHandCursor)
        self.stop_btn.clicked.connect(self.stop_processing)
        btn_layout.addWidget(self.stop_btn)
        
        layout.addLayout(btn_layout)

    def start_processing(self):
        """เริ่มการทำงาน"""
        self.counts = {'glass': 0, 'plastic': 0, 'can': 0}
        self.is_processing = True
        self.update_user_info()
        self.update_display()
        self.dot_count = 0
        self.anim_timer.start(600)  # ช้าลง - ขยับทุก 600ms
        
        # เริ่ม Hardware (ถ้ารันบน Raspberry Pi)
        if USE_GPIO and SortingController:
            self.sorting_controller = SortingController()
            # เชื่อม callbacks
            self.sorting_controller.on_status = lambda msg: self.hw_signals.status_changed.emit(msg)
            self.sorting_controller.on_item_sorted = lambda item: self.hw_signals.item_detected.emit(item)
            self.sorting_controller.start()

    def update_status_text(self, msg: str):
        """อัพเดทข้อความสถานะ (เรียกจาก Signal)"""
        self.status_text.setText(msg)

    def update_user_info(self):
        """อัพเดทข้อมูลผู้ใช้"""
        if self.main_window.user_data:
            username = self.main_window.user_data.get('username', 'ผู้ใช้')
            self.user_label.setText(f"👤 {username}")
            points = self.main_window.current_points
            self.points_badge.setText(f"⭐ {points:,} แต้ม")

    def stop_processing(self):
        """หยุดการทำงาน"""
        self.is_processing = False
        self.anim_timer.stop()
        
        if self.sorting_controller:
            self.sorting_controller.stop()
            self.sorting_controller = None
        
        total_items = sum(self.counts.values())
        total_points = self.get_total_points()
        
        if total_items > 0:
            # Update main points
            self.main_window.current_points += total_points
            # Go to result page
            self.main_window.result_page.set_result(self.counts.copy(), total_points)
            self.main_window.show_page('result')
        else:
            # No items - go back to main page
            self.main_window.main_page.update_user_info()
            self.main_window.show_page('main')

    def animate(self):
        """Animation loop - แค่ขยับจุดเรียบๆ"""
        self.dot_count = (self.dot_count + 1) % 4
        
        # แค่ขยับจุด . .. ... ....
        dots = "." * (self.dot_count + 1)
        self.dots_label.setText(dots)

    def add_item(self, item_type: str):
        """เพิ่มขยะ"""
        if item_type in self.counts:
            self.counts[item_type] += 1
            self.update_display()
            
            # Flash effect on item label
            if item_type in self.item_labels:
                self.item_labels[item_type].setStyleSheet(f"color: {COLORS['warning']}; font-size: 20px;")
                QTimer.singleShot(200, lambda t=item_type: self.item_labels[t].setStyleSheet(f"color: {COLORS['primary']};"))
            
            # Flash effect on count
            self.count_label.setStyleSheet(f"color: {COLORS['primary']}; font-size: 28px;")
            QTimer.singleShot(200, lambda: self.count_label.setStyleSheet(f"color: {COLORS['text']};"))
            
            # Send to API
            config = POINTS_CONFIG[item_type]
            self.main_window.api.send_points(item_type, config['points'])

    def update_display(self):
        """อัพเดทการแสดงผล"""
        total_items = sum(self.counts.values())
        total_points = self.get_total_points()
        
        self.count_label.setText(f"📦 {total_items} ชิ้น")
        self.points_label.setText(f"⭐ +{total_points} แต้ม")
        
        # Update individual item counts
        for item_type, count in self.counts.items():
            if item_type in self.item_labels:
                self.item_labels[item_type].setText(str(count))
        
        # อัพเดทแต้มสะสมด้านบน (รวมแต้มเดิม + แต้มใหม่)
        current_total = self.main_window.current_points + total_points
        self.points_badge.setText(f"⭐ {current_total:,} แต้ม")

    def get_total_points(self) -> int:
        total = 0
        for item_type, count in self.counts.items():
            total += count * POINTS_CONFIG[item_type]['points']
        return total

    def reset(self):
        """รีเซ็ตหน้า Processing"""
        self.counts = {'glass': 0, 'plastic': 0, 'can': 0}
        self.is_processing = False
        self.anim_timer.stop()
        if self.sorting_controller:
            self.sorting_controller.stop()
            self.sorting_controller = None
        self.count_label.setText("📦 0 ชิ้น")
        self.points_label.setText("⭐ +0 แต้ม")
        self.status_text.setText("กำลังรอรับขยะ")
        self.dots_label.setText("...")
        self.main_icon.setText("♻️")
        # Update item labels
        for item_type in self.item_labels:
            self.item_labels[item_type].setText("0")


# ============================================================
# PAGE: RESULT (หน้าสรุปผล)
# ============================================================
class ResultPage(QWidget):
    """หน้าสรุปผลการใส่ขยะ - รอ 10 วินาทีแล้วกลับหน้าแรกอัตโนมัติ"""

    def __init__(self, parent=None):
        super().__init__(parent)
        self.main_window = parent
        self.countdown = 10
        self.countdown_timer = QTimer()
        self.countdown_timer.timeout.connect(self.update_countdown)
        self.setup_ui()

    def setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(30, 30, 30, 30)
        layout.setSpacing(20)

        layout.addStretch()

        # Success icon - ใช้รูป recycle.svg
        self.success_icon_container = QHBoxLayout()
        self.success_icon_container.setAlignment(Qt.AlignCenter)
        
        recycle_path = IMAGES.get('recycle', '')
        if os.path.exists(recycle_path) and recycle_path.endswith('.svg'):
            icon_widget = QSvgWidget(recycle_path)
            icon_widget.setFixedSize(100, 100)
        else:
            icon_widget = QLabel("✅")
            icon_widget.setFont(QFont('Segoe UI Emoji', 64))
            icon_widget.setAlignment(Qt.AlignCenter)
        self.success_icon_container.addWidget(icon_widget)
        layout.addLayout(self.success_icon_container)

        # Title
        title = QLabel("ขอบคุณที่รีไซเคิล!")
        title.setFont(QFont('Segoe UI', 32, QFont.Bold))
        title.setStyleSheet(f"color: {COLORS['primary']};")
        title.setAlignment(Qt.AlignCenter)
        layout.addWidget(title)

        # Points earned
        self.points_label = QLabel("+0 แต้ม")
        self.points_label.setFont(QFont('Segoe UI', 48, QFont.Bold))
        self.points_label.setStyleSheet(f"color: {COLORS['warning']};")
        self.points_label.setAlignment(Qt.AlignCenter)
        layout.addWidget(self.points_label)

        # Items summary - ใช้รูปภาพ
        self.summary_container = QWidget()
        self.summary_layout = QHBoxLayout(self.summary_container)
        self.summary_layout.setAlignment(Qt.AlignCenter)
        self.summary_layout.setSpacing(30)
        layout.addWidget(self.summary_container)

        layout.addSpacing(30)

        # Countdown label
        self.countdown_label = QLabel("กลับหน้าแรกใน 10 วินาที...")
        self.countdown_label.setFont(QFont('Segoe UI', 14))
        self.countdown_label.setStyleSheet(f"color: {COLORS['text_secondary']};")
        self.countdown_label.setAlignment(Qt.AlignCenter)
        layout.addWidget(self.countdown_label)

        layout.addStretch()

    def set_result(self, counts: dict, points: int):
        self.points_label.setText(f"+{points} แต้ม")

        # ล้าง summary เดิม
        while self.summary_layout.count():
            item = self.summary_layout.takeAt(0)
            if item.widget():
                item.widget().deleteLater()

        # สร้าง summary ใหม่ด้วยรูปภาพ
        for item_type, count in counts.items():
            if count > 0:
                config = POINTS_CONFIG[item_type]
                
                # สร้าง frame สำหรับแต่ละ item
                item_frame = QFrame()
                item_frame.setStyleSheet(f"""
                    QFrame {{
                        background-color: white;
                        border-radius: 15px;
                        padding: 10px;
                    }}
                """)
                item_layout = QVBoxLayout(item_frame)
                item_layout.setAlignment(Qt.AlignCenter)
                item_layout.setSpacing(5)
                
                # รูปภาพ
                img_path = IMAGES.get(item_type, '')
                if os.path.exists(img_path):
                    img_label = QLabel()
                    pixmap = QPixmap(img_path)
                    img_label.setPixmap(pixmap.scaled(50, 50, Qt.KeepAspectRatio, Qt.SmoothTransformation))
                    img_label.setAlignment(Qt.AlignCenter)
                else:
                    img_label = QLabel(config['emoji'])
                    img_label.setFont(QFont('Segoe UI Emoji', 30))
                    img_label.setAlignment(Qt.AlignCenter)
                item_layout.addWidget(img_label)
                
                # ชื่อและจำนวน
                name_label = QLabel(f"{config['name']}")
                name_label.setFont(QFont('Segoe UI', 12))
                name_label.setStyleSheet(f"color: {COLORS['text']};")
                name_label.setAlignment(Qt.AlignCenter)
                item_layout.addWidget(name_label)
                
                count_label = QLabel(f"x{count}")
                count_label.setFont(QFont('Segoe UI', 18, QFont.Bold))
                count_label.setStyleSheet(f"color: {COLORS['primary']};")
                count_label.setAlignment(Qt.AlignCenter)
                item_layout.addWidget(count_label)
                
                self.summary_layout.addWidget(item_frame)
        
        # เริ่ม countdown
        self.countdown = 10
        self.countdown_label.setText(f"กลับหน้าแรกใน {self.countdown} วินาที...")
        self.countdown_timer.start(1000)  # ทุก 1 วินาที

    def update_countdown(self):
        """อัพเดท countdown และกลับหน้าแรกเมื่อหมดเวลา"""
        self.countdown -= 1
        if self.countdown <= 0:
            self.countdown_timer.stop()
            self.finish_session()
        else:
            self.countdown_label.setText(f"กลับหน้าแรกใน {self.countdown} วินาที...")

    def finish_session(self):
        """กลับหน้าแรกและ Reset ทุกอย่าง"""
        self.countdown_timer.stop()
        self.main_window.api.logout()
        self.main_window.user_data = None
        self.main_window.current_points = 0
        self.main_window.login_page.reset()
        self.main_window.processing_page.reset()
        self.main_window.show_page('home')


# ============================================================
# MAIN WINDOW
# ============================================================
class MainWindow(QMainWindow):
    """Main Window ของแอปพลิเคชัน"""

    def __init__(self):
        super().__init__()
        self.api = APIClient()
        self.user_data = None
        self.current_points = 0
        self.is_fullscreen = False

        self.setup_ui()
        self.setup_shortcuts()

    def setup_ui(self):
        self.setWindowTitle("Sorting Machine")
        self.setMinimumSize(800, 500)
        self.resize(DISPLAY_WIDTH, DISPLAY_HEIGHT)

        # Central widget
        central = QWidget()
        central.setStyleSheet(f"background-color: {COLORS['background']};")
        self.setCentralWidget(central)

        main_layout = QVBoxLayout(central)
        main_layout.setContentsMargins(0, 0, 0, 0)

        # Stacked widget for pages
        self.stack = QStackedWidget()
        main_layout.addWidget(self.stack)

        # Create pages
        self.home_page = HomePage(self)
        self.login_page = LoginPage(self)
        self.main_page = MainPage(self)
        self.processing_page = ProcessingPage(self)
        self.result_page = ResultPage(self)

        self.stack.addWidget(self.home_page)
        self.stack.addWidget(self.login_page)
        self.stack.addWidget(self.main_page)
        self.stack.addWidget(self.processing_page)
        self.stack.addWidget(self.result_page)

        self.pages = {
            'home': 0,
            'login': 1,
            'main': 2,
            'processing': 3,
            'result': 4
        }

        # Start fullscreen if configured
        if FULLSCREEN:
            QTimer.singleShot(100, self.showFullScreen)
            self.is_fullscreen = True

    def setup_shortcuts(self):
        # F11 for fullscreen toggle
        QShortcut(QKeySequence(Qt.Key_F11), self, self.toggle_fullscreen)

        # Escape to exit fullscreen
        QShortcut(QKeySequence(Qt.Key_Escape), self, self.exit_fullscreen)

        # 1, 2, 3 for testing items on processing page
        QShortcut(QKeySequence(Qt.Key_1), self, lambda: self.processing_page.add_item('glass'))
        QShortcut(QKeySequence(Qt.Key_2), self, lambda: self.processing_page.add_item('plastic'))
        QShortcut(QKeySequence(Qt.Key_3), self, lambda: self.processing_page.add_item('can'))

    def show_page(self, page_name: str):
        if page_name in self.pages:
            self.stack.setCurrentIndex(self.pages[page_name])

    def toggle_fullscreen(self):
        if self.is_fullscreen:
            self.showNormal()
            self.is_fullscreen = False
        else:
            self.showFullScreen()
            self.is_fullscreen = True

    def exit_fullscreen(self):
        if self.is_fullscreen:
            self.showNormal()
            self.is_fullscreen = False

    def closeEvent(self, event):
        """ทำความสะอาดเมื่อปิดโปรแกรม"""
        # หยุด Processing
        self.processing_page.reset()
        
        # Cleanup Hardware
        if USE_GPIO and hardware_cleanup:
            hardware_cleanup()
        
        event.accept()

    def keyPressEvent(self, event):
        # Handle key events
        super().keyPressEvent(event)


def main():
    # High DPI support
    QApplication.setAttribute(Qt.AA_EnableHighDpiScaling, True)
    QApplication.setAttribute(Qt.AA_UseHighDpiPixmaps, True)

    app = QApplication(sys.argv)
    app.setStyle('Fusion')

    window = MainWindow()
    window.show()

    print("\n" + "=" * 50)
    print("🚀 Sorting Machine GUI Started")
    print("=" * 50)
    print("📌 Press F11 to toggle fullscreen")
    print("📌 Press 1, 2, 3 to add items (when running)")
    print("📌 Press ESC to exit fullscreen")
    print("=" * 50 + "\n")

    sys.exit(app.exec_())


if __name__ == '__main__':
    main()
