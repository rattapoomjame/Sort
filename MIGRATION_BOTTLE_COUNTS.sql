-- เพิ่ม columns สำหรับเก็บจำนวนขวดแต่ละประเภทใน machine_status

ALTER TABLE machine_status
ADD COLUMN IF NOT EXISTS glass_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS plastic_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS can_count INTEGER DEFAULT 0;

-- อัปเดตค่าเริ่มต้น
UPDATE machine_status 
SET glass_count = 0, plastic_count = 0, can_count = 0
WHERE machine_id = 'main';
