-- =====================================================
-- MIGRATION: machine_settings Table
-- สำหรับเก็บค่า pricing และ config ต่างๆ
-- =====================================================

-- สร้างตาราง machine_settings
CREATE TABLE IF NOT EXISTS machine_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ปิด RLS เพื่อให้ admin แก้ไขได้
ALTER TABLE machine_settings DISABLE ROW LEVEL SECURITY;

-- Insert default pricing (ถ้ายังไม่มี)
INSERT INTO machine_settings (key, value) 
VALUES ('pricing', '{
  "glass": {"points": 5, "name": "ขวดแก้ว", "emoji": "🍾"},
  "plastic": {"points": 3, "name": "ขวดพลาสติก", "emoji": "🥤"},
  "can": {"points": 4, "name": "กระป๋อง", "emoji": "🥫"},
  "points_per_baht": 100,
  "min_withdrawal": 100
}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ยืนยันว่าสร้างสำเร็จ
SELECT * FROM machine_settings;
