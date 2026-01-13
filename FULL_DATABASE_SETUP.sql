-- =====================================================
-- 🗑️ SORTING MACHINE - FULL DATABASE SETUP
-- =====================================================
-- ใช้ SQL นี้ใน Supabase SQL Editor
-- จะลบข้อมูลเก่าทั้งหมดและสร้างใหม่
-- =====================================================

-- ============== ลบ TABLES เดิมทั้งหมด ==============
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS maintenance_logs CASCADE;
DROP TABLE IF EXISTS withdrawals CASCADE;
DROP TABLE IF EXISTS point_history CASCADE;
DROP TABLE IF EXISTS user_points CASCADE;
DROP TABLE IF EXISTS machine_status CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============== สร้าง EXTENSION ==============
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1️⃣ TABLE: users - ข้อมูลผู้ใช้งาน
-- =====================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index สำหรับค้นหาเบอร์โทร
CREATE INDEX idx_users_phone ON users(phone);

-- =====================================================
-- 2️⃣ TABLE: user_points - คะแนนสะสมของผู้ใช้
-- =====================================================
CREATE TABLE user_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  points INT DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index สำหรับค้นหา user_id
CREATE INDEX idx_user_points_user_id ON user_points(user_id);

-- =====================================================
-- 3️⃣ TABLE: point_history - ประวัติการได้รับคะแนน
-- =====================================================
CREATE TABLE point_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  points INT NOT NULL,
  item_type TEXT NOT NULL, -- glass, plastic, can
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_point_history_user_id ON point_history(user_id);
CREATE INDEX idx_point_history_created_at ON point_history(created_at DESC);

-- =====================================================
-- 4️⃣ TABLE: withdrawals - การขอถอนเงิน
-- =====================================================
CREATE TABLE withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount INT NOT NULL, -- จำนวนเงินที่ขอถอน (บาท)
  points_used INT NOT NULL, -- จำนวนแต้มที่ใช้
  promptpay_number TEXT NOT NULL, -- เลขพร้อมเพย์
  status TEXT DEFAULT 'pending', -- pending, completed, cancelled
  admin_note TEXT, -- หมายเหตุจาก admin
  completed_at TIMESTAMP WITH TIME ZONE, -- เวลาที่โอนเงินเสร็จ
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);
CREATE INDEX idx_withdrawals_created_at ON withdrawals(created_at DESC);

-- =====================================================
-- 5️⃣ TABLE: machine_status - สถานะเครื่อง IoT
-- =====================================================
CREATE TABLE machine_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  machine_id TEXT UNIQUE NOT NULL DEFAULT 'main',
  status TEXT DEFAULT 'online', -- online, offline, maintenance
  cpu_temp DECIMAL(5,2) DEFAULT 0,
  storage_used INT DEFAULT 0, -- เปอร์เซ็นต์
  bottle_count INT DEFAULT 0, -- จำนวนขวดในถัง
  max_bottles INT DEFAULT 500, -- ความจุสูงสุด
  last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6️⃣ TABLE: maintenance_logs - ประวัติการซ่อมบำรุง
-- =====================================================
CREATE TABLE maintenance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  machine_id TEXT DEFAULT 'main',
  action TEXT NOT NULL, -- รายละเอียดการซ่อม
  performed_by TEXT NOT NULL, -- ผู้ดำเนินการ
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_maintenance_logs_created_at ON maintenance_logs(created_at DESC);

-- =====================================================
-- 7️⃣ TABLE: activity_logs - log กิจกรรมทั้งหมด
-- =====================================================
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- login, register, recycle, withdraw, etc.
  details JSONB, -- รายละเอียดเพิ่มเติม (JSON format)
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);

-- =====================================================
-- 🔐 ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy: อนุญาตให้ anon key ใช้งานได้ทุกอย่าง (สำหรับ development)
-- ⚠️ Production: ควรจำกัดสิทธิ์ตาม role

CREATE POLICY "Allow all for anon" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON user_points FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON point_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON withdrawals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON machine_status FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON maintenance_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON activity_logs FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- 📊 ข้อมูลเริ่มต้น (Initial Data)
-- =====================================================

-- สถานะเครื่องเริ่มต้น
INSERT INTO machine_status (machine_id, status, cpu_temp, storage_used, bottle_count, max_bottles)
VALUES ('main', 'online', 42.5, 25, 0, 500);

-- =====================================================
-- 🔧 FUNCTIONS (Optional)
-- =====================================================

-- Function: อัปเดต updated_at อัตโนมัติ
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: user_points
CREATE TRIGGER update_user_points_updated_at
    BEFORE UPDATE ON user_points
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: machine_status
CREATE TRIGGER update_machine_status_updated_at
    BEFORE UPDATE ON machine_status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ✅ เสร็จสิ้น!
-- =====================================================
-- ตารางทั้งหมด:
-- 1. users - ข้อมูลผู้ใช้
-- 2. user_points - คะแนนสะสม
-- 3. point_history - ประวัติการได้รับคะแนน
-- 4. withdrawals - การขอถอนเงิน
-- 5. machine_status - สถานะเครื่อง
-- 6. maintenance_logs - ประวัติซ่อมบำรุง
-- 7. activity_logs - log กิจกรรม
-- =====================================================
