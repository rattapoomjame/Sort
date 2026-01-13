# ===================================================================
# Sorting Machine IoT Main Application
# จำลองการทำงานของเครื่อง IoT ในการเลือกประเภทสินค้าและส่งคะแนน
# ===================================================================

import time
import logging
from api_client import SortingMachineAPIClient
from config import API_BASE_URL

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ชนิดของสินค้าที่เครื่องสามารถระบุได้
RECYCLABLES = {
    'plastic_bottle': {
        'name': 'ขวดพลาสติก',
        'points': 1,
        'emoji': '🍾',
    },
    'paper': {
        'name': 'กระดาษ',
        'points': 2,
        'emoji': '📄',
    },
    'metal': {
        'name': 'โลหะ',
        'points': 3,
        'emoji': '🥫',
    },
    'glass': {
        'name': 'แก้ว',
        'points': 2,
        'emoji': '🥤',
    },
}


def scan_item() -> tuple:
    """
    จำลองการสแกนสินค้า
    Returns: (label, phone) tuple
    """
    # ในโปรแกรมจริง จะต้องเชื่อมต่อกับ barcode scanner หรือ camera
    print('\n📍 โปรแกรมจำลอง - ระบบจะทำการสแกนสินค้า')
    print('🔍 ชนิดสินค้า:')
    for i, (label, info) in enumerate(RECYCLABLES.items(), 1):
        print(f"   {i}. {info['emoji']} {info['name']} ({label}) - {info['points']} คะแนน")

    choice = input('เลือกหมายเลข (1-4): ').strip()

    items = list(RECYCLABLES.items())
    if choice.isdigit() and 0 < int(choice) <= len(items):
        label, _ = items[int(choice) - 1]
    else:
        label = 'plastic_bottle'  # ค่าเริ่มต้น

    phone = input('ใส่เบอร์โทรศัพท์ (เช่น 0812345678): ').strip()
    if not phone:
        phone = '0812345678'  # ค่าเริ่มต้น

    return label, phone


def process_item(client: SortingMachineAPIClient, label: str, phone: str):
    """
    ประมวลผลสินค้าและส่งคะแนน
    """
    try:
        item_info = RECYCLABLES.get(label, {})
        points = item_info.get('points', 1)

        print(f'\n⚙️  ประมวลผล: {item_info.get("emoji")} {item_info.get("name")}')
        print(f'📞 ผู้ใช้: {phone}')
        print(f'⭐ คะแนน: {points}')

        # ขั้นตอนที่ 1: Scanning (1 วินาที)
        print('\n🔍 กำลังสแกน...')
        time.sleep(1)

        # ขั้นตอนที่ 2: Processing (2 วินาที)
        print('⚙️  กำลังประมวลผล...')
        time.sleep(2)

        # ขั้นตอนที่ 3: Sending Points
        print('📤 กำลังส่งคะแนน...')
        result = client.send_point(phone, label, points)

        if result['success']:
            print(f'✅ บันทึกสำเร็จ! +{points} คะแนน')

            # แสดงคะแนนรวม
            current_points = client.get_user_points(phone)
            if current_points is not None:
                print(f'🎯 คะแนนรวม: {current_points}')
        else:
            print(f'❌ เกิดข้อผิดพลาด: {result.get("error")}')

    except Exception as e:
        logger.error(f'❌ Error processing item: {str(e)}')


def auto_loop(client: SortingMachineAPIClient, phone: str, iterations: int = 5):
    """
    โหมดอัตโนมัติ - ทำการประมวลผลหลายครั้ง
    
    Args:
        client: API Client
        phone: เบอร์โทรศัพท์
        iterations: จำนวนครั้งที่ต้องการทำ
    """
    print(f'\n🚀 เริ่มโหมดอัตโนมัติ ({iterations} ครั้ง)')

    for i in range(iterations):
        print(f'\n--- รอบที่ {i + 1}/{iterations} ---')

        # สแกนสินค้าแบบสุ่ม
        items = list(RECYCLABLES.keys())
        import random
        label = random.choice(items)

        # ประมวลผล
        process_item(client, label, phone)

        # หยุด 3 วินาทีก่อนรอบถัดไป
        if i < iterations - 1:
            print('⏳ รอสำหรับรอบถัดไป...')
            time.sleep(3)

    print('\n✅ การประมวลผลเสร็จสิ้น!')


def main():
    """
    โปรแกรมหลัก
    """
    print('=' * 60)
    print('🌱 Sorting Machine IoT Demo')
    print('=' * 60)

    # สร้าง API client
    client = SortingMachineAPIClient(API_BASE_URL)

    print(f'\n✅ เชื่อมต่อ API: {API_BASE_URL}')

    # เมนู
    while True:
        print('\n📋 เมนู:')
        print('1. สแกนสินค้าด้วยตนเอง')
        print('2. โหมดอัตโนมัติ')
        print('3. ออกจากโปรแกรม')

        choice = input('เลือก (1-3): ').strip()

        if choice == '1':
            # โหมดด้วยตนเอง
            label, phone = scan_item()
            process_item(client, label, phone)

        elif choice == '2':
            # โหมดอัตโนมัติ
            phone = input('ใส่เบอร์โทรศัพท์: ').strip()
            if not phone:
                phone = '0812345678'

            try:
                iterations = int(input('จำนวนครั้ง (default 5): ').strip() or '5')
            except ValueError:
                iterations = 5

            auto_loop(client, phone, iterations)

        elif choice == '3':
            print('👋 ขอบคุณที่ใช้ Sorting Machine!')
            break

        else:
            print('❌ ตัวเลือกไม่ถูกต้อง')


if __name__ == '__main__':
    main()
