import { supabase, supabaseAdmin } from './supabase'

/**
 * Admin API Functions
 * ฟังก์ชันสำหรับหน้า Admin Dashboard
 * ใช้ supabaseAdmin สำหรับ bypass RLS
 */

// =====================================================
// Dashboard Stats
// =====================================================

/**
 * ดึงสถิติรวมสำหรับ Dashboard
 */
export async function getDashboardStats() {
  try {
    // นับจำนวนผู้ใช้ทั้งหมด
    const { count: userCount } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })

    // รวมแต้มทั้งหมด
    const { data: pointsData } = await supabaseAdmin
      .from('user_points')
      .select('points')
    
    const totalPoints = pointsData?.reduce((sum, p) => sum + (p.points || 0), 0) || 0

    // นับรายการรอโอนเงิน
    const { count: pendingWithdrawals } = await supabaseAdmin
      .from('withdrawals')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    // นับจำนวนขวดรีไซเคิล (จาก point_history)
    const { count: bottleCount } = await supabaseAdmin
      .from('point_history')
      .select('*', { count: 'exact', head: true })

    return {
      userCount: userCount || 0,
      totalPoints,
      pendingWithdrawals: pendingWithdrawals || 0,
      bottleCount: bottleCount || 0
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    throw error
  }
}

/**
 * ดึงกิจกรรมล่าสุด
 */
export async function getRecentActivity(limit = 10) {
  try {
    const { data, error } = await supabaseAdmin
      .from('activity_logs')
      .select(`
        *,
        users (username, phone)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching recent activity:', error)
    return []
  }
}

/**
 * บันทึก activity log
 */
export async function logActivity(userId: string | null, action: string, details?: string) {
  try {
    await supabaseAdmin
      .from('activity_logs')
      .insert([{ user_id: userId, action, details }])
  } catch (error) {
    console.error('Error logging activity:', error)
  }
}

// =====================================================
// Withdrawals Management
// =====================================================

/**
 * ดึงรายการถอนเงินทั้งหมด
 */
export async function getWithdrawals(status?: string) {
  try {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    
    const response = await fetch(`/api/withdrawals?${params.toString()}`)
    const data = await response.json()
    
    if (!data.success) throw new Error(data.error)
    return data.withdrawals || []
  } catch (error) {
    console.error('Error fetching withdrawals:', error)
    return []
  }
}

/**
 * สร้างคำขอถอนเงินใหม่
 */
export async function createWithdrawal(userId: string, amount: number, pointsUsed: number, promptpayNumber: string) {
  try {
    const response = await fetch('/api/withdrawals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        userId,
        amount,
        pointsUsed,
        promptpayNumber
      })
    })
    const data = await response.json()
    
    if (!data.success) throw new Error(data.error)
    return data.data
  } catch (error) {
    console.error('Error creating withdrawal:', error)
    throw error
  }
}

/**
 * อัปเดตสถานะการถอนเงิน (admin mark as completed/rejected)
 */
export async function updateWithdrawalStatus(withdrawalId: string, status: string, adminNote?: string) {
  try {
    const response = await fetch('/api/withdrawals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'updateStatus',
        withdrawalId,
        status,
        adminNote
      })
    })
    const data = await response.json()
    
    if (!data.success) throw new Error(data.error)
    return data.data
  } catch (error) {
    console.error('Error updating withdrawal:', error)
    throw error
  }
}

/**
 * ดึงสรุปยอดถอนเงิน
 */
export async function getWithdrawalSummary() {
  try {
    const response = await fetch('/api/withdrawals?status=all')
    const data = await response.json()
    
    if (!data.success) throw new Error(data.error)
    return data.summary || { pendingCount: 0, pendingAmount: 0, completedTodayCount: 0, completedTodayAmount: 0 }
  } catch (error) {
    console.error('Error fetching withdrawal summary:', error)
    return { pendingCount: 0, pendingAmount: 0, completedTodayCount: 0, completedTodayAmount: 0 }
  }
}

// =====================================================
// Users Management
// =====================================================

/**
 * ดึงรายชื่อผู้ใช้ทั้งหมด
 */
export async function getAllUsers(search?: string) {
  try {
    let query = supabaseAdmin
      .from('users')
      .select(`
        *,
        user_points (points)
      `)
      .order('created_at', { ascending: false })

    if (search) {
      query = query.or(`username.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching users:', error)
    return []
  }
}

/**
 * อัปเดตข้อมูลผู้ใช้
 */
export async function updateUser(userId: string, updates: { username?: string; phone?: string }) {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()

    if (error) throw error
    return data?.[0]
  } catch (error) {
    console.error('Error updating user:', error)
    throw error
  }
}

/**
 * ลบผู้ใช้
 */
export async function deleteUser(userId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting user:', error)
    throw error
  }
}

// =====================================================
// Machine Management
// =====================================================

/**
 * ดึงสถานะเครื่อง
 */
export async function getMachineStatus(machineId = 'main') {
  try {
    const { data, error } = await supabaseAdmin
      .from('machine_status')
      .select('*')
      .eq('machine_id', machineId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  } catch (error) {
    console.error('Error fetching machine status:', error)
    return null
  }
}

/**
 * อัปเดตสถานะเครื่อง
 */
export async function updateMachineStatus(machineId: string, updates: Record<string, unknown>) {
  try {
    const { data, error } = await supabaseAdmin
      .from('machine_status')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('machine_id', machineId)
      .select()

    if (error) throw error
    return data?.[0]
  } catch (error) {
    console.error('Error updating machine status:', error)
    throw error
  }
}

/**
 * เปิด/ปิดโหมดซ่อมบำรุง
 */
export async function toggleMaintenanceMode(machineId: string, isEnabled: boolean) {
  try {
    const status = isEnabled ? 'maintenance' : 'online'
    const result = await updateMachineStatus(machineId, { status })
    
    // Log maintenance
    await addMaintenanceLog(
      machineId,
      isEnabled ? 'เปิดโหมดซ่อมบำรุง' : 'ปิดโหมดซ่อมบำรุง',
      'Admin'
    )

    return result
  } catch (error) {
    console.error('Error toggling maintenance mode:', error)
    throw error
  }
}

/**
 * ดึงประวัติการซ่อมบำรุง
 */
export async function getMaintenanceLogs(machineId = 'main', limit = 20) {
  try {
    const { data, error } = await supabaseAdmin
      .from('maintenance_logs')
      .select('*')
      .eq('machine_id', machineId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching maintenance logs:', error)
    return []
  }
}

/**
 * เพิ่ม log การซ่อมบำรุง
 */
export async function addMaintenanceLog(machineId: string, action: string, performedBy: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('maintenance_logs')
      .insert([{
        machine_id: machineId,
        action,
        performed_by: performedBy
      }])
      .select()

    if (error) throw error
    return data?.[0]
  } catch (error) {
    console.error('Error adding maintenance log:', error)
    throw error
  }
}

// =====================================================
// Debug & System
// =====================================================

/**
 * ดึง System Info
 */
export function getSystemInfo() {
  return {
    version: '2.1.0',
    nodeVersion: process.env.NODE_VERSION || 'N/A',
    nextVersion: '14.2.0',
    environment: process.env.NODE_ENV || 'development',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not Set',
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not Set'
  }
}

/**
 * ทดสอบ Database Connection
 */
export async function testDatabaseConnection() {
  try {
    const { error } = await supabaseAdmin.from('users').select('id').limit(1)
    return { connected: !error, error: error?.message }
  } catch (error) {
    return { connected: false, error: String(error) }
  }
}

/**
 * Danger Zone: Reset user points
 */
export async function resetAllUserPoints() {
  try {
    const { error } = await supabaseAdmin
      .from('user_points')
      .update({ points: 0, updated_at: new Date().toISOString() })
      .neq('points', -999) // Update all

    if (error) throw error
    
    await logActivity(null, 'admin_reset_points', 'Reset all user points to 0')
    return true
  } catch (error) {
    console.error('Error resetting points:', error)
    throw error
  }
}

/**
 * Danger Zone: Clear withdrawal history
 */
export async function clearWithdrawalHistory() {
  try {
    const { error } = await supabaseAdmin
      .from('withdrawals')
      .delete()
      .eq('status', 'completed')

    if (error) throw error
    
    await logActivity(null, 'admin_clear_withdrawals', 'Cleared completed withdrawal history')
    return true
  } catch (error) {
    console.error('Error clearing withdrawals:', error)
    throw error
  }
}

export default {
  getDashboardStats,
  getRecentActivity,
  logActivity,
  getWithdrawals,
  createWithdrawal,
  updateWithdrawalStatus,
  getWithdrawalSummary,
  getAllUsers,
  updateUser,
  deleteUser,
  getMachineStatus,
  updateMachineStatus,
  toggleMaintenanceMode,
  getMaintenanceLogs,
  addMaintenanceLog,
  getSystemInfo,
  testDatabaseConnection,
  resetAllUserPoints,
  clearWithdrawalHistory
}
