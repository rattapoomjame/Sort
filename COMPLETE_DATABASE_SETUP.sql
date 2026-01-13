-- =====================================================
-- FULL DATABASE SETUP FOR SORTING MACHINE
-- รัน SQL นี้ใน Supabase SQL Editor
-- =====================================================

-- 1. สร้าง Table users (ถ้ายังไม่มี)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- 2. สร้าง Table user_points (ถ้ายังไม่มี)
CREATE TABLE IF NOT EXISTS user_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  points INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT now()
);

-- 3. สร้าง Table point_history (บันทึกการรีไซเคิล)
CREATE TABLE IF NOT EXISTS point_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  points INT NOT NULL,
  label TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- 4. สร้าง Table withdrawals (คำขอถอนเงิน)
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  points_used INT NOT NULL,
  promptpay_number TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  admin_note TEXT,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- 5. สร้าง Table activity_logs (บันทึกกิจกรรม)
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- 6. สร้าง Table machine_status (สถานะเครื่อง)
CREATE TABLE IF NOT EXISTS machine_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  machine_id TEXT UNIQUE NOT NULL DEFAULT 'main',
  status TEXT DEFAULT 'online',
  last_heartbeat TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 7. สร้าง Table maintenance_logs (บันทึกการซ่อมบำรุง)
CREATE TABLE IF NOT EXISTS maintenance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  machine_id TEXT NOT NULL DEFAULT 'main',
  action TEXT NOT NULL,
  performed_by TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- =====================================================
-- สร้าง Indexes เพื่อเพิ่มความเร็ว
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_point_history_user_id ON point_history(user_id);
CREATE INDEX IF NOT EXISTS idx_point_history_created_at ON point_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- =====================================================
-- ปิด RLS สำหรับทุก Table (เพื่อให้ API ทำงานได้)
-- =====================================================

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_points DISABLE ROW LEVEL SECURITY;
ALTER TABLE point_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE machine_status DISABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- สร้าง Default machine_status record
-- =====================================================

INSERT INTO machine_status (machine_id, status) 
VALUES ('main', 'online')
ON CONFLICT (machine_id) DO NOTHING;

-- =====================================================
-- เสร็จสิ้น!
-- =====================================================
