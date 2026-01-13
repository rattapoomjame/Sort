-- =====================================================
-- EcoPoints - Withdrawals Table Migration
-- ใช้ SQL นี้ใน Supabase SQL Editor เพื่อเพิ่มตาราง withdrawals
-- =====================================================

-- สร้าง Table withdrawals
-- เก็บข้อมูลการขอถอนเงิน/แลกแต้ม
CREATE TABLE withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount INT NOT NULL, -- จำนวนเงินที่ขอถอน (บาท)
  points_used INT NOT NULL, -- จำนวนแต้มที่ใช้
  promptpay_number TEXT NOT NULL, -- เลขพร้อมเพย์
  status TEXT DEFAULT 'pending', -- pending, completed, cancelled
  admin_note TEXT, -- หมายเหตุจาก admin
  completed_at TIMESTAMP, -- เวลาที่โอนเงินเสร็จ
  created_at TIMESTAMP DEFAULT now()
);

-- สร้าง Index สำหรับการค้นหา
CREATE INDEX idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);
CREATE INDEX idx_withdrawals_created_at ON withdrawals(created_at DESC);

-- =====================================================

-- สร้าง Table machine_status
-- เก็บสถานะเครื่อง IoT
CREATE TABLE machine_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  machine_id TEXT UNIQUE NOT NULL DEFAULT 'main',
  status TEXT DEFAULT 'online', -- online, offline, maintenance
  cpu_temp DECIMAL(5,2) DEFAULT 0,
  storage_used INT DEFAULT 0, -- เปอร์เซ็นต์
  bottle_count INT DEFAULT 0,
  max_bottles INT DEFAULT 500,
  last_heartbeat TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- สร้างข้อมูลเครื่องเริ่มต้น
INSERT INTO machine_status (machine_id, status, cpu_temp, storage_used, bottle_count, max_bottles)
VALUES ('main', 'online', 45.0, 30, 150, 500);

-- =====================================================

-- สร้าง Table maintenance_logs
-- เก็บประวัติการซ่อมบำรุง
CREATE TABLE maintenance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  machine_id TEXT DEFAULT 'main',
  action TEXT NOT NULL, -- รายละเอียดการซ่อม
  performed_by TEXT NOT NULL, -- ผู้ดำเนินการ
  created_at TIMESTAMP DEFAULT now()
);

-- สร้าง Index
CREATE INDEX idx_maintenance_logs_created_at ON maintenance_logs(created_at DESC);

-- =====================================================

-- สร้าง Table activity_logs
-- เก็บ log กิจกรรมทั้งหมด
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- login, register, recycle, withdraw, etc.
  details TEXT, -- รายละเอียดเพิ่มเติม
  created_at TIMESTAMP DEFAULT now()
);

-- สร้าง Index
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- =====================================================

-- ตั้งค่า Row Level Security (RLS)
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- สร้าง Policy ให้ anon key อ่านได้ (สำหรับ development)
-- Production ควรจำกัดสิทธิ์เฉพาะ admin
CREATE POLICY "Allow all for anon" ON withdrawals FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON machine_status FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON maintenance_logs FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON activity_logs FOR ALL USING (true);

-- =====================================================
-- เสร็จสิ้น! ตอนนี้สามารถใช้ระบบ Admin ได้แล้ว
-- =====================================================
