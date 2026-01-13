-- =====================================================
-- Sorting Machine Database Schema
-- ใช้ SQL นี้ใน Supabase SQL Editor
-- =====================================================

-- สร้าง Table Users
-- เก็บข้อมูลผู้ใช้งาน (เบอร์โทรศัพท์และชื่อผู้ใช้)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- สร้าง Index สำหรับ phone เพื่อเร่งการค้นหา
CREATE INDEX idx_users_phone ON users(phone);

-- =====================================================

-- สร้าง Table user_points
-- เก็บคะแนนสะสมของผู้ใช้แต่ละคน
CREATE TABLE user_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  points INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT now()
);

-- สร้าง Index สำหรับ user_id เพื่อเร่งการค้นหา
CREATE INDEX idx_user_points_user_id ON user_points(user_id);

-- =====================================================

-- สร้าง Table point_history (optional)
-- เก็บบันทึกการได้คะแนน เพื่อความโปร่งใส
CREATE TABLE point_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  points INT NOT NULL,
  label TEXT, -- ตัวอย่าง: "plastic_bottle", "paper", "metal"
  created_at TIMESTAMP DEFAULT now()
);

-- สร้าง Index สำหรับ user_id
CREATE INDEX idx_point_history_user_id ON point_history(user_id);

-- =====================================================

-- ตั้งค่า Row Level Security (RLS) - ถ้าต้องการ
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_history ENABLE ROW LEVEL SECURITY;

-- (ทั้งหมด: optional, ให้ control ได้ตามต้องการ)
