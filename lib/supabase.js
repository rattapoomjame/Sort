import { createClient } from '@supabase/supabase-js'

// Updated Supabase credentials
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rnvkgdhgldxotqwszrtx.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJudmtnZGhnbGR4b3Rxd3N6cnR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMDA0NjMsImV4cCI6MjA4Mzg3NjQ2M30.M6VDFKAPxPr8X8sW7Nq2KJopzW-VIepj28peC2nwZEI';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJudmtnZGhnbGR4b3Rxd3N6cnR4Iiwicm9zZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMwMDQ2MywiZXhwIjoyMDgzODc2NDYzfQ.gd6DVZFD4pTYp96__VRxSkK46uqjeSySRnYtp4tE2kU';

const isMissingCredentials = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (isMissingCredentials && typeof window !== 'undefined') {
  console.warn('⚠️ Supabase credentials are missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
}

// สร้าง Supabase client (สำหรับ client-side)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// สร้าง Supabase Admin client (สำหรับ server-side - bypass RLS)
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY)

/**
 * ฟังก์ชันตรวจสอบว่าผู้ใช้เบอร์โทรมีในฐานข้อมูลหรือไม่
 * @param {string} phone - เบอร์โทรศัพท์ผู้ใช้
 * @returns {Promise<Object>} ข้อมูลผู้ใช้ หรือ null ถ้าไม่พบ
 */
export async function getUserByPhone(phone) {
  try {
    // ตรวจสอบเบอร์โทรศัพท์ไทยก่อน
    const thaiPhoneRegex = /^0[689]\d{8}$/
    if (!thaiPhoneRegex.test(phone)) {
      throw new Error('เบอร์โทรศัพท์ไม่ถูกต้อง (ต้องขึ้นต้นด้วย 06, 08 หรือ 09)')
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // ไม่พบผู้ใช้
      }
      throw error
    }

    return data
  } catch (error) {
    console.error('❌ Error fetching user:', error)
    throw error
  }
}

/**
 * ฟังก์ชันดึงจำนวนคะแนนของผู้ใช้
 * @param {string} userId - ID ของผู้ใช้
 * @returns {Promise<number>} จำนวนคะแนน
 */
export async function getUserPoints(userId) {
  try {
    const { data, error } = await supabase
      .from('user_points')
      .select('points')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return 0 // ยังไม่มีคะแนน สร้างใหม่
      }
      throw error
    }

    return data?.points || 0
  } catch (error) {
    console.error('❌ Error fetching points:', error)
    throw error
  }
}

/**
 * ฟังก์ชันเพิ่มคะแนนให้ผู้ใช้
 * @param {string} userId - ID ของผู้ใช้
 * @param {number} points - จำนวนคะแนนที่ต้องการเพิ่ม
 * @param {string} itemType - ประเภทขยะ (glass, plastic, can)
 * @returns {Promise<Object>} ข้อมูลการอัปเดต
 */
export async function addPoints(userId, points, itemType = null) {
  try {
    // ดึงคะแนนปัจจุบัน
    let currentPoints = await getUserPoints(userId)
    const newPoints = currentPoints + points

    // ตรวจสอบว่ามี record อยู่แล้วหรือไม่
    const { data: existing } = await supabase
      .from('user_points')
      .select('id')
      .eq('user_id', userId)
      .single()

    let data, error

    if (existing) {
      // อัปเดต record ที่มีอยู่
      const result = await supabase
        .from('user_points')
        .update({
          points: newPoints,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
      
      data = result.data
      error = result.error
    } else {
      // สร้าง record ใหม่
      const result = await supabase
        .from('user_points')
        .insert({
          user_id: userId,
          points: newPoints,
          updated_at: new Date().toISOString()
        })
        .select()
      
      data = result.data
      error = result.error
    }

    if (error) throw error

    // บันทึกประวัติการได้คะแนนลง point_history (ใช้ supabaseAdmin เพื่อ bypass RLS)
    let historyResult = null
    if (itemType) {
      const { data: historyData, error: historyError } = await supabaseAdmin
        .from('point_history')
        .insert({
          user_id: userId,
          points: points,
          label: itemType,
          created_at: new Date().toISOString()
        })
        .select()
      
      if (historyError) {
        console.error('❌ Error saving point history:', historyError)
        historyResult = { error: historyError.message }
      } else {
        historyResult = { success: true, data: historyData }
      }
    }

    return { points: data, history: historyResult }
  } catch (error) {
    console.error('❌ Error adding points:', error)
    throw error
  }
}

/**
 * ฟังก์ชันอัปเดตคะแนนผู้ใช้ (ตั้งค่าใหม่)
 * @param {string} userId - ID ของผู้ใช้
 * @param {number} newPoints - จำนวนคะแนนใหม่
 * @returns {Promise<Object>} ข้อมูลการอัปเดต
 */
export async function updateUserPoints(userId, newPoints) {
  try {
    // ใช้ update แทน upsert เพราะ user_points record มีอยู่แล้ว
    const { data, error } = await supabase
      .from('user_points')
      .update({
        points: newPoints,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()

    if (error) throw error

    return data
  } catch (error) {
    console.error('❌ Error updating points:', error)
    throw error
  }
}

/**
 * ตรวจสอบเบอร์โทรศัพท์ไทย
 * @param {string} phone - เบอร์โทรศัพท์
 * @returns {boolean} true ถ้าถูกต้อง
 */
function isValidThaiPhone(phone) {
  // เบอร์ไทย: 10 หลัก, ขึ้นต้นด้วย 0 ตามด้วย 6, 8, หรือ 9
  const thaiPhoneRegex = /^0[689]\d{8}$/
  return thaiPhoneRegex.test(phone)
}

/**
 * ฟังก์ชันลงทะเบียนผู้ใช้ใหม่
 * @param {string} phone - เบอร์โทรศัพท์
 * @param {string} username - ชื่อผู้ใช้
 * @returns {Promise<Object>} ข้อมูลผู้ใช้ที่เพิ่มใหม่
 */
export async function registerUser(phone, username) {
  try {
    // ตรวจสอบเบอร์โทรศัพท์ไทยก่อน
    if (!isValidThaiPhone(phone)) {
      throw new Error('เบอร์โทรศัพท์ไม่ถูกต้อง (ต้องขึ้นต้นด้วย 06, 08 หรือ 09 และมี 10 หลัก)')
    }

    // ตรวจสอบว่าเบอร์นี้มีอยู่แล้วหรือไม่
    const existingUser = await getUserByPhone(phone)
    if (existingUser) {
      throw new Error('เบอร์โทรศัพท์นี้ถูกลงทะเบียนแล้ว')
    }

    const { data, error } = await supabase
      .from('users')
      .insert([{ phone, username }])
      .select()

    if (error) {
      console.error('❌ Supabase Error:', error)
      throw new Error(error.message || 'Failed to register user')
    }

    if (!data || data.length === 0) {
      throw new Error('No data returned from register')
    }

    const userId = data[0].id

    // สร้างระเบียนคะแนนใหม่
    const { error: pointsError } = await supabase
      .from('user_points')
      .insert([{ user_id: userId, points: 0 }])

    if (pointsError) {
      console.error('❌ Error creating points record:', pointsError)
      throw pointsError
    }

    return data[0]
  } catch (error) {
    console.error('❌ Error registering user:', error instanceof Error ? error.message : error)
    throw error
  }
}

export default supabase
