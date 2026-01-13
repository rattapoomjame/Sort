import { createClient, SupabaseClient } from '@supabase/supabase-js'

// ==================== Supabase Configuration ====================
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rnvkgdhgldxotqwszrtx.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_pbOks5f6GA8VEpjRjacl0w_2GGYgfBh'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// ==================== Clients ====================
// Client-side (ประชาชน)
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Server-side Admin (bypass RLS) - ใช้เฉพาะ server-side เท่านั้น
export const supabaseAdmin: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// ==================== Type Definitions ====================
export interface User {
  id: string
  phone: string
  username: string
  created_at: string
}

export interface UserPoints {
  id: string
  user_id: string
  points: number
  updated_at: string
}

export interface PointHistory {
  id: string
  user_id: string
  points: number
  item_type: string // 'glass' | 'plastic' | 'can'
  created_at: string
}

export interface Withdrawal {
  id: string
  user_id: string
  amount: number
  points_used: number
  promptpay_number: string
  status: string // 'pending' | 'completed' | 'cancelled'
  admin_note?: string
  completed_at?: string
  created_at: string
}

// ==================== User Management ====================

/**
 * ค้นหาผู้ใช้จากเบอร์โทรศัพท์
 * @param phone - เบอร์โทรศัพท์
 * @returns ข้อมูลผู้ใช้ หรือ null
 */
export async function getUserByPhone(phone: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // ไม่พบผู้ใช้
        return null
      }
      throw error
    }

    return data as User
  } catch (error) {
    console.error('❌ Error fetching user by phone:', error)
    throw error
  }
}

/**
 * สร้างผู้ใช้ใหม่
 * @param phone - เบอร์โทรศัพท์
 * @param username - ชื่อผู้ใช้
 * @returns ข้อมูลผู้ใช้ใหม่
 */
export async function registerUser(phone: string, username: string): Promise<User> {
  try {
    // ตรวจสอบว่าเบอร์นี้มีอยู่แล้วหรือไม่
    const existingUser = await getUserByPhone(phone)
    if (existingUser) {
      throw new Error('เบอร์โทรศัพท์นี้มีการลงทะเบียนแล้ว')
    }

    // สร้างผู้ใช้ใหม่
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        {
          phone,
          username
        }
      ])
      .select()
      .single()

    if (userError) {
      throw userError
    }

    const newUser = userData as User

    // สร้างแถว user_points ใหม่
    const { error: pointsError } = await supabase
      .from('user_points')
      .insert([
        {
          user_id: newUser.id,
          points: 0
        }
      ])

    if (pointsError) {
      throw pointsError
    }

    return newUser
  } catch (error) {
    console.error('❌ Error registering user:', error)
    throw error
  }
}

// ==================== Points Management ====================

/**
 * ดึงจำนวนแต้มของผู้ใช้
 * @param user_id - ID ของผู้ใช้
 * @returns จำนวนแต้ม
 */
export async function getUserPoints(user_id: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('user_points')
      .select('points')
      .eq('user_id', user_id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // ไม่พบผู้ใช้นี้
        return 0
      }
      throw error
    }

    return data?.points || 0
  } catch (error) {
    console.error('❌ Error fetching user points:', error)
    throw error
  }
}

/**
 * เพิ่มแต้มให้ผู้ใช้ พร้อมบันทึกประวัติ
 * @param user_id - ID ของผู้ใช้
 * @param points - จำนวนแต้มที่เพิ่ม
 * @param item_type - ประเภท (glass, plastic, can)
 * @returns ข้อมูลแต้มที่อัพเดต
 */
export async function addPoints(
  user_id: string,
  points: number,
  item_type: string = 'glass'
): Promise<UserPoints> {
  try {
    // ดึงแต้มปัจจุบัน
    const currentPoints = await getUserPoints(user_id)
    const newPoints = currentPoints + points

    // อัพเดตแต้ม
    const { data: updatedPoints, error: updateError } = await supabase
      .from('user_points')
      .update({
        points: newPoints,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user_id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    // บันทึกประวัติ
    const { error: historyError } = await supabase
      .from('point_history')
      .insert([
        {
          user_id,
          points,
          item_type,
          created_at: new Date().toISOString()
        }
      ])

    if (historyError) {
      console.warn('⚠️ Failed to log point history:', historyError)
    }

    return updatedPoints as UserPoints
  } catch (error) {
    console.error('❌ Error adding points:', error)
    throw error
  }
}

/**
 * อัพเดตแต้มผู้ใช้เป็นค่าที่ระบุ (ไม่เพิ่ม)
 * @param user_id - ID ของผู้ใช้
 * @param points - จำนวนแต้มที่ตั้ง
 * @returns ข้อมูลแต้มที่อัพเดต
 */
export async function updatePoints(user_id: string, points: number): Promise<UserPoints> {
  try {
    const { data, error } = await supabase
      .from('user_points')
      .update({
        points,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user_id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data as UserPoints
  } catch (error) {
    console.error('❌ Error updating points:', error)
    throw error
  }
}

// ==================== History & Logs ====================

/**
 * ดึงประวัติการรีไซเคิลของผู้ใช้
 * @param user_id - ID ของผู้ใช้
 * @param limit - จำนวนบันทึกที่ต้องการ
 * @returns array ของประวัติ
 */
export async function getHistory(user_id: string, limit: number = 20): Promise<PointHistory[]> {
  try {
    const { data, error } = await supabase
      .from('point_history')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    return (data || []) as PointHistory[]
  } catch (error) {
    console.error('❌ Error fetching history:', error)
    throw error
  }
}

// ==================== Withdrawals ====================

/**
 * สร้างคำขอถอนเงิน
 * @param user_id - ID ของผู้ใช้
 * @param amount - จำนวนเงินที่ขอถอน
 * @param points_used - จำนวนแต้มที่ใช้
 * @param promptpay_number - เลขพร้อมเพย์
 * @returns ข้อมูลการถอนเงิน
 */
export async function createWithdrawal(
  user_id: string,
  amount: number,
  points_used: number,
  promptpay_number: string
): Promise<Withdrawal> {
  try {
    const { data, error } = await supabase
      .from('withdrawals')
      .insert([
        {
          user_id,
          amount,
          points_used,
          promptpay_number,
          status: 'pending',
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (error) {
      throw error
    }

    // หักแต้มทันที
    await updatePoints(user_id, (await getUserPoints(user_id)) - points_used)

    return data as Withdrawal
  } catch (error) {
    console.error('❌ Error creating withdrawal:', error)
    throw error
  }
}

/**
 * ดึงข้อมูลการถอนเงินของผู้ใช้
 * @param user_id - ID ของผู้ใช้
 * @returns array ของการถอนเงิน
 */
export async function getWithdrawals(user_id: string): Promise<Withdrawal[]> {
  try {
    const { data, error } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return (data || []) as Withdrawal[]
  } catch (error) {
    console.error('❌ Error fetching withdrawals:', error)
    throw error
  }
}

// ==================== Pricing & Settings ====================

/**
 * ดึงค่า pricing ปัจจุบัน
 * @returns object ของราคา
 */
export async function getPricing(): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('machine_settings')
      .select('value')
      .eq('key', 'pricing')
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return data?.value || {
      glass: { points: 5, name: 'ขวดแก้ว', emoji: '🍾' },
      plastic: { points: 3, name: 'ขวดพลาสติก', emoji: '🥤' },
      can: { points: 4, name: 'กระป๋อง', emoji: '🥫' },
      points_per_baht: 100,
      min_withdrawal: 100
    }
  } catch (error) {
    console.error('❌ Error fetching pricing:', error)
    throw error
  }
}

// ==================== Machine Status ====================

/**
 * ดึงสถานะของเครื่อง
 * @param machine_id - ID ของเครื่อง (default: 'main')
 * @returns ข้อมูลสถานะเครื่อง
 */
export async function getMachineStatus(machine_id: string = 'main'): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('machine_status')
      .select('*')
      .eq('machine_id', machine_id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw error
    }

    return data
  } catch (error) {
    console.error('❌ Error fetching machine status:', error)
    throw error
  }
}

/**
 * ดึงจำนวนขวดแต่ละประเภท
 * @param machine_id - ID ของเครื่อง (default: 'main')
 * @returns object ของจำนวนขวด
 */
export async function getBottleCounts(machine_id: string = 'main'): Promise<{
  glass: number
  plastic: number
  can: number
  total: number
}> {
  try {
    const { data, error } = await supabase
      .from('machine_status')
      .select('glass_count, plastic_count, can_count')
      .eq('machine_id', machine_id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { glass: 0, plastic: 0, can: 0, total: 0 }
      }
      throw error
    }

    const counts = {
      glass: data?.glass_count || 0,
      plastic: data?.plastic_count || 0,
      can: data?.can_count || 0
    }

    return {
      ...counts,
      total: counts.glass + counts.plastic + counts.can
    }
  } catch (error) {
    console.error('❌ Error fetching bottle counts:', error)
    throw error
  }
}

// ==================== Helper Functions ====================

/**
 * ตรวจสอบว่าเบอร์โทรไทยถูกต้องหรือไม่
 * @param phone - เบอร์โทร
 * @returns boolean
 */
export function isValidThaiPhone(phone: string): boolean {
  const thaiPhoneRegex = /^0[689]\d{8}$/
  return thaiPhoneRegex.test(phone)
}

/**
 * แปลง points เป็น baht
 * @param points - จำนวนแต้ม
 * @param rate - อัตรา (default: 100 points = 1 baht)
 * @returns จำนวนบาท
 */
export function pointsToBaht(points: number, rate: number = 100): number {
  return Math.floor(points / rate)
}

/**
 * แปลง baht เป็น points
 * @param baht - จำนวนบาท
 * @param rate - อัตรา (default: 1 baht = 100 points)
 * @returns จำนวนแต้ม
 */
export function bahtToPoints(baht: number, rate: number = 100): number {
  return baht * rate
}
