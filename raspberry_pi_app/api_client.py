# ===================================================================
# Sorting Machine - API Client
# ===================================================================

import re
import requests
import logging
from typing import Optional, Dict
from config import API_BASE_URL, API_TIMEOUT

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def is_valid_thai_phone(phone: str) -> bool:
    """ตรวจสอบรูปแบบเบอร์โทรศัพท์ไทย"""
    # เบอร์ไทย: 10 หลัก, ขึ้นต้นด้วย 0 ตามด้วย 6, 8, หรือ 9
    pattern = r'^0[689]\d{8}$'
    return bool(re.match(pattern, phone))


class APIClient:
    """Client สำหรับเชื่อมต่อ Sorting Machine API"""

    def __init__(self):
        self.base_url = API_BASE_URL
        self.session = requests.Session()
        self.current_user = None
        self.current_user_id = None

    def login(self, phone: str) -> Dict:
        """Login ด้วยเบอร์โทรศัพท์"""
        # ตรวจสอบรูปแบบเบอร์โทรศัพท์ก่อน
        if not is_valid_thai_phone(phone):
            logger.warning(f"❌ Invalid phone format: {phone}")
            return {
                'success': False,
                'error': 'เบอร์โทรศัพท์ไม่ถูกต้อง\n(ต้องขึ้นต้นด้วย 06, 08 หรือ 09 และมี 10 หลัก)'
            }
        
        try:
            response = self.session.post(
                f'{self.base_url}/api/loginPhone',
                json={'phone': phone},
                timeout=API_TIMEOUT
            )
            response.raise_for_status()
            data = response.json()

            if data.get('user'):
                self.current_user = data['user']
                self.current_user_id = data['user']['id']
                logger.info(f"✅ Login successful: {data['user']['username']}")
                return {
                    'success': True,
                    'user': data['user'],
                    'points': data.get('points', 0)
                }
            else:
                return {'success': False, 'error': 'ไม่พบบัญชีผู้ใช้'}

        except requests.exceptions.HTTPError as e:
            # Handle specific HTTP errors
            if e.response.status_code == 404:
                logger.warning(f"❌ User not found: {phone}")
                return {'success': False, 'error': 'ไม่พบเบอร์โทรศัพท์นี้ในระบบ\nกรุณาลงทะเบียนก่อนใช้งาน'}
            elif e.response.status_code == 400:
                logger.warning(f"❌ Bad request: {phone}")
                return {'success': False, 'error': 'ข้อมูลไม่ถูกต้อง'}
            else:
                logger.error(f"❌ Login HTTP error: {e}")
                return {'success': False, 'error': f'เกิดข้อผิดพลาด ({e.response.status_code})'}
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Login error: {e}")
            return {'success': False, 'error': 'ไม่สามารถเชื่อมต่อ API ได้'}

    def logout(self):
        """Logout"""
        self.current_user = None
        self.current_user_id = None
        logger.info("👋 Logged out")

    def send_points(self, item_type: str, points: int) -> Dict:
        """ส่งคะแนนไปยัง API"""
        if not self.current_user_id:
            return {'success': False, 'error': 'กรุณา Login ก่อน'}

        try:
            response = self.session.post(
                f'{self.base_url}/api/addPoint',
                json={
                    'user_id': self.current_user_id,
                    'points': points,
                    'label': item_type
                },
                timeout=API_TIMEOUT
            )
            response.raise_for_status()
            data = response.json()
            logger.info(f"✅ Points sent: +{points} for {item_type}")
            return {'success': True, 'data': data}

        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Send points error: {e}")
            return {'success': False, 'error': str(e)}

    def get_points(self) -> Optional[int]:
        """ดึงคะแนนปัจจุบัน"""
        if not self.current_user_id:
            return None

        try:
            response = self.session.get(
                f'{self.base_url}/api/getPoint',
                params={'user_id': self.current_user_id},
                timeout=API_TIMEOUT
            )
            response.raise_for_status()
            data = response.json()
            return data.get('points', 0)

        except Exception as e:
            logger.error(f"❌ Get points error: {e}")
            return None

    def is_connected(self) -> bool:
        """ตรวจสอบการเชื่อมต่อ API"""
        try:
            response = self.session.get(
                f'{self.base_url}/api/getPoint',
                params={'user_id': 'test'},
                timeout=5
            )
            return response.status_code in [200, 400, 404]
        except:
            return False
