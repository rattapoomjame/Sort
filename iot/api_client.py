# ===================================================================
# Sorting Machine IoT API Client
# ใช้สำหรับส่งข้อมูลจากเครื่อง IoT ไปยัง API
# ===================================================================

import requests
import json
import logging
from typing import Dict, Optional
from config import ENDPOINT_ADD_POINT, ENDPOINT_GET_POINT, API_TIMEOUT

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SortingMachineAPIClient:
    """
    Client สำหรับเชื่อมต่อ Sorting Machine API
    """

    def __init__(self, base_url: str):
        """
        Initialize API Client
        Args:
            base_url: URL ของ API server
        """
        self.base_url = base_url
        self.timeout = API_TIMEOUT
        self.session = requests.Session()

    def send_point(self, phone: str, label: str, points: int) -> Dict:
        """
        ส่งคะแนนไปยัง API
        
        Args:
            phone (str): เบอร์โทรศัพท์ของผู้ใช้
            label (str): ชนิดของสินค้า (เช่น 'plastic_bottle', 'paper', 'metal')
            points (int): จำนวนคะแนนที่ได้
            
        Returns:
            dict: Response จาก API
            
        Example:
            >>> client = SortingMachineAPIClient('http://localhost:3000')
            >>> result = client.send_point('0812345678', 'plastic_bottle', 1)
            >>> print(result['success'])
            True
        """
        try:
            # ขั้นตอนที่ 1: ค้นหาผู้ใช้จากเบอร์โทร
            logger.info(f'🔍 Fetching user for phone: {phone}')
            user_response = self._get_user_by_phone(phone)

            if not user_response or 'user' not in user_response:
                logger.error(f'❌ User not found for phone: {phone}')
                return {'success': False, 'error': 'User not found'}

            user = user_response['user']
            user_id = user['id']

            # ขั้นตอนที่ 2: ส่งคะแนน
            logger.info(f'📤 Sending {points} points for label: {label}')
            payload = {
                'user_id': user_id,
                'points': points,
                'label': label,
            }

            response = self.session.post(
                ENDPOINT_ADD_POINT,
                json=payload,
                timeout=self.timeout,
            )

            response.raise_for_status()
            result = response.json()

            logger.info(
                f'✅ Points sent successfully: {points} points to {phone}'
            )
            return {'success': True, 'data': result}

        except requests.exceptions.RequestException as e:
            logger.error(f'❌ Request error: {str(e)}')
            return {'success': False, 'error': str(e)}
        except Exception as e:
            logger.error(f'❌ Error sending point: {str(e)}')
            return {'success': False, 'error': str(e)}

    def get_user_points(self, phone: str) -> Optional[int]:
        """
        ดึงจำนวนคะแนนของผู้ใช้
        
        Args:
            phone (str): เบอร์โทรศัพท์ของผู้ใช้
            
        Returns:
            int or None: จำนวนคะแนน หรือ None ถ้ามีข้อผิดพลาด
        """
        try:
            user_response = self._get_user_by_phone(phone)

            if not user_response or 'user' not in user_response:
                logger.error(f'❌ User not found for phone: {phone}')
                return None

            user_id = user_response['user']['id']
            response = self.session.get(
                ENDPOINT_GET_POINT,
                params={'user_id': user_id},
                timeout=self.timeout,
            )

            response.raise_for_status()
            data = response.json()

            return data.get('points', 0)

        except Exception as e:
            logger.error(f'❌ Error getting points: {str(e)}')
            return None

    def _get_user_by_phone(self, phone: str) -> Optional[Dict]:
        """
        ค้นหาผู้ใช้จากเบอร์โทรศัพท์ (Private method)
        """
        try:
            response = self.session.post(
                f'{self.base_url}/api/loginPhone',
                json={'phone': phone},
                timeout=self.timeout,
            )

            response.raise_for_status()
            return response.json()

        except Exception as e:
            logger.error(f'❌ Error fetching user: {str(e)}')
            return None


# ตัวอย่างการใช้งาน
if __name__ == '__main__':
    # สร้าง client
    from config import API_BASE_URL
    client = SortingMachineAPIClient(API_BASE_URL)

    # ตัวอย่างที่ 1: ส่งคะแนน
    print('\n--- Example 1: Send Point ---')
    result = client.send_point('0812345678', 'plastic_bottle', 1)
    print(json.dumps(result, indent=2, ensure_ascii=False))

    # ตัวอย่างที่ 2: ดึงคะแนน
    print('\n--- Example 2: Get User Points ---')
    points = client.get_user_points('0812345678')
    print(f'Points: {points}')
