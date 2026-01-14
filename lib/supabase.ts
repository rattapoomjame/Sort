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

export interface ActivityLog {
  id: string
  user_id?: string
  action: string
  details?: any
  ip_address?: string
  created_at: string
}

export interface MachineStatus {
  id: string
  machine_id: string
  status: string
  cpu_temp: number
  storage_used: number
  bottle_count: number
  max_bottles: number
  glass_count?: number
  plastic_count?: number
  can_count?: number
  last_heartbeat: string
  updated_at: string
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

/**
 * ดึงข้อมูลผู้ใช้จาก ID
 * @param user_id - ID ของผู้ใช้
 * @returns ข้อมูลผู้ใช้ หรือ null
 */
export async function getUserById(user_id: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user_id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw error
    }

    return data as User
  } catch (error) {
    console.error('❌ Error fetching user by ID:', error)
    throw error
  }
}

/**
 * ดึงรายชื่อผู้ใช้ทั้งหมด (Admin only)
 * @param limit - จำนวนผู้ใช้ที่ต้องการ
 * @param offset - ตำแหน่งเริ่มต้น
 * @returns array ของผู้ใช้
 */
export async function getAllUsers(limit: number = 50, offset: number = 0): Promise<User[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw error
    }

    return (data || []) as User[]
  } catch (error) {
    console.error('❌ Error fetching all users:', error)
    throw error
  }
}

/**
 * นับจำนวนผู้ใช้ทั้งหมด
 * @returns จำนวนผู้ใช้
 */
export async function getTotalUserCount(): Promise<number> {
  try {
    const { count, error } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })

    if (error) {
      throw error
    }

    return count || 0
  } catch (error) {
    console.error('❌ Error counting users:', error)
    return 0
  }
}

/**
 * อัปเดตข้อมูลผู้ใช้
 * @param user_id - ID ของผู้ใช้
 * @param username - ชื่อผู้ใช้ใหม่
 * @returns ข้อมูลผู้ใช้ที่อัปเดต
 */
export async function updateUserInfo(user_id: string, username: string): Promise<User> {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ username })
      .eq('id', user_id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data as User
  } catch (error) {
    console.error('❌ Error updating user info:', error)
    throw error
  }
}

/**
 * ลบผู้ใช้ (Admin only)
 * @param user_id - ID ของผู้ใช้
 * @returns boolean - สำเร็จหรือไม่
 */
export async function deleteUser(user_id: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', user_id)

    if (error) {
      throw error
    }

    return true
  } catch (error) {
    console.error('❌ Error deleting user:', error)
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

/**
 * หักแต้มจากผู้ใช้
 * @param user_id - ID ของผู้ใช้
 * @param points - จำนวนแต้มที่หัก
 * @param reason - เหตุผล (optional)
 * @returns ข้อมูลแต้มที่อัพเดต
 */
export async function deductPoints(
  user_id: string,
  points: number,
  reason: string = 'withdrawal'
): Promise<UserPoints> {
  try {
    const currentPoints = await getUserPoints(user_id)
    
    if (currentPoints < points) {
      throw new Error('แต้มไม่เพียงพอในการหัก')
    }

    const newPoints = currentPoints - points

    const { data, error } = await supabase
      .from('user_points')
      .update({
        points: newPoints,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user_id)
      .select()
      .single()

    if (error) {
      throw error
    }

    // บันทึกประวัติ
    try {
      await supabase
        .from('point_history')
        .insert([
          {
            user_id,
            points: -points,
            item_type: reason,
            created_at: new Date().toISOString()
          }
        ])
    } catch (err) {
      console.warn('⚠️ Failed to log deduction history:', err)
    }

    return data as UserPoints
  } catch (error) {
    console.error('❌ Error deducting points:', error)
    throw error
  }
}

/**
 * ดึงผู้ใช้ top N ตามแต้มสูงสุด
 * @param limit - จำนวนผู้ใช้ที่ต้องการ (default: 10)
 * @returns array ของผู้ใช้พร้อมแต้ม
 */
export async function getTopUsers(limit: number = 10): Promise<(User & { points: number })[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_points')
      .select(`
        points,
        users (id, phone, username, created_at)
      `)
      .order('points', { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    return (data || []).map((item: any) => ({
      ...item.users,
      points: item.points
    }))
  } catch (error) {
    console.error('❌ Error fetching top users:', error)
    throw error
  }
}

/**
 * ดึงสถิติแต้มทั้งหมด
 * @returns object ของสถิติแต้ม
 */
export async function getTotalPointsStats(): Promise<{
  totalPoints: number
  averagePoints: number
  maxPoints: number
  minPoints: number
  userCount: number
}> {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_points')
      .select('points')

    if (error) {
      throw error
    }

    const points = (data || []).map((item: any) => item.points)
    const total = points.reduce((sum: number, p: number) => sum + p, 0)
    const count = points.length

    return {
      totalPoints: total,
      averagePoints: count > 0 ? Math.floor(total / count) : 0,
      maxPoints: count > 0 ? Math.max(...points) : 0,
      minPoints: count > 0 ? Math.min(...points) : 0,
      userCount: count
    }
  } catch (error) {
    console.error('❌ Error fetching points stats:', error)
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

/**
 * ดึงข้อมูลการถอนเงินจาก ID
 * @param withdrawal_id - ID ของการถอนเงิน
 * @returns ข้อมูลการถอนเงิน
 */
export async function getWithdrawalById(withdrawal_id: string): Promise<Withdrawal | null> {
  try {
    const { data, error } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('id', withdrawal_id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw error
    }

    return data as Withdrawal
  } catch (error) {
    console.error('❌ Error fetching withdrawal by ID:', error)
    throw error
  }
}

/**
 * ดึงรายการถอนเงินทั้งหมด (Admin only)
 * @param status - สถานะการถอน (optional)
 * @param limit - จำนวนรายการ
 * @param offset - ตำแหน่งเริ่มต้น
 * @returns array ของการถอนเงิน
 */
export async function getAllWithdrawals(
  status?: string,
  limit: number = 50,
  offset: number = 0
): Promise<Withdrawal[]> {
  try {
    let query = supabaseAdmin
      .from('withdrawals')
      .select(`
        *,
        users (id, username, phone)
      `)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw error
    }

    return (data || []) as Withdrawal[]
  } catch (error) {
    console.error('❌ Error fetching all withdrawals:', error)
    throw error
  }
}

/**
 * อัปเดตสถานะการถอนเงิน (Admin only)
 * @param withdrawal_id - ID ของการถอนเงิน
 * @param status - สถานะใหม่ (pending, completed, cancelled)
 * @param admin_note - หมายเหตุจาก Admin (optional)
 * @returns ข้อมูลการถอนเงินที่อัปเดต
 */
export async function updateWithdrawalStatus(
  withdrawal_id: string,
  status: 'pending' | 'completed' | 'cancelled',
  admin_note?: string
): Promise<Withdrawal> {
  try {
    const updateData: any = { status }

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString()
    }

    if (admin_note) {
      updateData.admin_note = admin_note
    }

    const { data, error } = await supabaseAdmin
      .from('withdrawals')
      .update(updateData)
      .eq('id', withdrawal_id)
      .select()
      .single()

    if (error) {
      throw error
    }

    // บันทึก activity log
    if (data) {
      await logActivity(null, `withdrawal_status_updated`, {
        withdrawal_id,
        new_status: status,
        note: admin_note
      }).catch(err => console.warn('⚠️ Failed to log activity:', err))
    }

    return data as Withdrawal
  } catch (error) {
    console.error('❌ Error updating withdrawal status:', error)
    throw error
  }
}

// ==================== Activity Logging ====================

/**
 * บันทึก activity log
 * @param user_id - ID ของผู้ใช้ (optional)
 * @param action - ประเภท action
 * @param details - รายละเอียด (optional)
 * @returns boolean - สำเร็จหรือไม่
 */
export async function logActivity(
  user_id: string | null,
  action: string,
  details?: any
): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('activity_logs')
      .insert([
        {
          user_id,
          action,
          details: details || null,
          created_at: new Date().toISOString()
        }
      ])

    if (error) {
      throw error
    }

    return true
  } catch (error) {
    console.error('❌ Error logging activity:', error)
    return false
  }
}

/**
 * ดึง activity logs (Admin only)
 * @param limit - จำนวนบันทึก
 * @param offset - ตำแหน่งเริ่มต้น
 * @returns array ของ activity logs
 */
export async function getActivityLogs(
  limit: number = 50,
  offset: number = 0
): Promise<ActivityLog[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('activity_logs')
      .select(`
        *,
        users (id, username, phone)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw error
    }

    return (data || []) as ActivityLog[]
  } catch (error) {
    console.error('❌ Error fetching activity logs:', error)
    throw error
  }
}

/**
 * ดึง activity logs ตามเงื่อนไข (Admin only)
 * @param filter - object ของเงื่อนไข
 * @param limit - จำนวนบันทึก
 * @returns array ของ activity logs
 */
export async function getActivityLogsByFilter(
  filter: { user_id?: string; action?: string; dateFrom?: string; dateTo?: string },
  limit: number = 50
): Promise<ActivityLog[]> {
  try {
    let query = supabaseAdmin.from('activity_logs').select('*')

    if (filter.user_id) {
      query = query.eq('user_id', filter.user_id)
    }

    if (filter.action) {
      query = query.eq('action', filter.action)
    }

    if (filter.dateFrom) {
      query = query.gte('created_at', filter.dateFrom)
    }

    if (filter.dateTo) {
      query = query.lte('created_at', filter.dateTo)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    return (data || []) as ActivityLog[]
  } catch (error) {
    console.error('❌ Error fetching activity logs by filter:', error)
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

/**
 * อัปเดตค่า pricing (Admin only)
 * @param pricing - object ของราคาใหม่
 * @returns boolean - สำเร็จหรือไม่
 */
export async function updatePricing(pricing: any): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('machine_settings')
      .upsert(
        {
          key: 'pricing',
          value: pricing,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'key' }
      )

    if (error) {
      throw error
    }

    // บันทึก activity log
    await logActivity(null, 'pricing_updated', { new_pricing: pricing })
      .catch(err => console.warn('⚠️ Failed to log activity:', err))

    return true
  } catch (error) {
    console.error('❌ Error updating pricing:', error)
    throw error
  }
}

// ==================== Machine Status ====================

/**
 * ดึงสถานะของเครื่อง
 * @param machine_id - ID ของเครื่อง (default: 'main')
 * @returns ข้อมูลสถานะเครื่อง
 */
export async function getMachineStatus(machine_id: string = 'main'): Promise<MachineStatus | null> {
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

    return data as MachineStatus
  } catch (error) {
    console.error('❌ Error fetching machine status:', error)
    throw error
  }
}

/**
 * อัปเดตสถานะของเครื่อง (Admin only)
 * @param machine_id - ID ของเครื่อง
 * @param status - สถานะใหม่ (online, offline, maintenance)
 * @param data - ข้อมูลเพิ่มเติม
 * @returns ข้อมูลสถานะที่อัปเดต
 */
export async function updateMachineStatus(
  machine_id: string,
  status: 'online' | 'offline' | 'maintenance',
  data?: Partial<MachineStatus>
): Promise<MachineStatus> {
  try {
    const updateData: any = {
      status,
      last_heartbeat: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (data) {
      Object.assign(updateData, data)
    }

    const { data: result, error } = await supabaseAdmin
      .from('machine_status')
      .update(updateData)
      .eq('machine_id', machine_id)
      .select()
      .single()

    if (error) {
      throw error
    }

    // บันทึก activity log
    await logActivity(null, 'machine_status_updated', {
      machine_id,
      new_status: status
    }).catch(err => console.warn('⚠️ Failed to log activity:', err))

    return result as MachineStatus
  } catch (error) {
    console.error('❌ Error updating machine status:', error)
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

/**
 * อัปเดตจำนวนขวดแต่ละประเภท (Admin only)
 * @param machine_id - ID ของเครื่อง
 * @param counts - object ของจำนวนขวด
 * @returns ข้อมูลสถานะเครื่องที่อัปเดต
 */
export async function updateBottleCounts(
  machine_id: string,
  counts: { glass?: number; plastic?: number; can?: number }
): Promise<MachineStatus> {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (counts.glass !== undefined) updateData.glass_count = counts.glass
    if (counts.plastic !== undefined) updateData.plastic_count = counts.plastic
    if (counts.can !== undefined) updateData.can_count = counts.can

    const { data, error } = await supabaseAdmin
      .from('machine_status')
      .update(updateData)
      .eq('machine_id', machine_id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data as MachineStatus
  } catch (error) {
    console.error('❌ Error updating bottle counts:', error)
    throw error
  }
}

/**
 * ดึงสถิติเครื่อง
 * @param machine_id - ID ของเครื่อง
 * @returns object ของสถิติ
 */
export async function getMachineStats(machine_id: string = 'main'): Promise<any> {
  try {
    const machineStatus = await getMachineStatus(machine_id)
    const bottleCounts = await getBottleCounts(machine_id)

    if (!machineStatus) {
      return null
    }

    return {
      machine_id,
      status: machineStatus.status,
      cpu_temp: machineStatus.cpu_temp,
      storage_used: machineStatus.storage_used,
      bottle_counts: bottleCounts,
      last_updated: machineStatus.updated_at,
      is_online: machineStatus.status === 'online',
      health: {
        temp: machineStatus.cpu_temp < 80 ? 'good' : 'warning',
        storage: machineStatus.storage_used < 90 ? 'good' : 'warning',
        bottles: bottleCounts.total < machineStatus.max_bottles ? 'good' : 'warning'
      }
    }
  } catch (error) {
    console.error('❌ Error fetching machine stats:', error)
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
