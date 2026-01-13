'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  getDashboardStats,
  getRecentActivity,
  getWithdrawals,
  updateWithdrawalStatus,
  getWithdrawalSummary,
  getAllUsers,
  getMachineStatus,
  toggleMaintenanceMode,
  getMaintenanceLogs,
  addMaintenanceLog,
  updateMachineStatus,
  getSystemInfo,
  testDatabaseConnection,
  resetAllUserPoints,
  clearWithdrawalHistory,
  logActivity
} from '@/lib/adminApi'

/**
 * Admin Dashboard Page - Real-time Data
 * หน้า Admin สำหรับจัดการระบบ Sorting Machine
 */
export default function AdminPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('dashboard')

  // Admin password (ควรเก็บใน env จริงๆ)
  const ADMIN_PASSWORD = 'admin1234'

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      setError('')
      logActivity(null, 'admin_login', 'Admin logged in')
    } else {
      setError('รหัสผ่านไม่ถูกต้อง')
    }
  }

  // ถ้ายังไม่ login แสดงหน้า login
  if (!isAuthenticated) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-8 bg-gray-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[360px]"
        >
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto bg-linear-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-3xl">🔐</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Admin Login</h1>
              <p className="text-gray-500 text-sm mt-1">กรอกรหัสผ่านเพื่อเข้าสู่ระบบ</p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 border border-red-200 rounded-xl px-4 py-3 text-sm mb-4 text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="รหัสผ่าน Admin"
                className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 mb-4 text-lg"
              />
              <button
                type="submit"
                className="w-full py-4 bg-linear-to-r from-red-500 to-orange-500 text-white font-semibold rounded-xl shadow-lg text-lg"
              >
                เข้าสู่ระบบ Admin
              </button>
            </form>

            <button
              onClick={() => router.push('/')}
              className="w-full py-3 text-gray-500 text-sm mt-4 hover:text-gray-700"
            >
              ← กลับหน้าหลัก
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
    { id: 'withdrawals', label: '💳 รายการแลกเงิน', icon: '💳' },
    { id: 'users', label: '👥 ผู้ใช้งาน', icon: '👥' },
    { id: 'pricing', label: '💰 ตั้งค่าราคา', icon: '💰' },
    { id: 'machine', label: '🔧 Service เครื่อง', icon: '🔧' },
    { id: 'debug', label: '🐛 Debug', icon: '🐛' },
  ]

  return (
    <div className="min-h-dvh bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-linear-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                <span className="text-xl">⚙️</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">Sorting Machine Admin</h1>
                <p className="text-xs text-gray-500">ระบบจัดการ (Real-time)</p>
              </div>
            </div>
            <button
              onClick={() => {
                logActivity(null, 'admin_logout', 'Admin logged out')
                setIsAuthenticated(false)
              }}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-red-500 text-red-600 bg-red-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'withdrawals' && <WithdrawalsTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'pricing' && <PricingTab />}
        {activeTab === 'machine' && <MachineTab />}
        {activeTab === 'debug' && <DebugTab />}
      </div>
    </div>
  )
}

// Dashboard Tab - Real Data
function DashboardTab() {
  const [stats, setStats] = useState({ userCount: 0, totalPoints: 0, pendingWithdrawals: 0, bottleCount: 0 })
  const [recentActivity, setRecentActivity] = useState<Array<{
    id: string
    action: string
    details: string
    created_at: string
    users?: { username: string; phone: string }
  }>>([])
  const [machineStatus, setMachineStatus] = useState<{
    status: string
    cpu_temp: number
    storage_used: number
    bottle_count: number
    max_bottles: number
    last_heartbeat: string
  } | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [statsData, activityData, machineData] = await Promise.all([
        getDashboardStats(),
        getRecentActivity(10),
        getMachineStatus()
      ])
      setStats(statsData)
      setRecentActivity(activityData)
      setMachineStatus(machineData)
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  const statCards = [
    { label: 'ผู้ใช้ทั้งหมด', value: stats.userCount.toLocaleString(), icon: '👥', color: 'from-blue-500 to-cyan-500' },
    { label: 'แต้มทั้งหมด', value: stats.totalPoints.toLocaleString(), icon: '⭐', color: 'from-amber-500 to-yellow-500' },
    { label: 'รอโอนเงิน', value: stats.pendingWithdrawals.toString(), icon: '💳', color: 'from-red-500 to-pink-500' },
    { label: 'ขวดรีไซเคิล', value: stats.bottleCount.toLocaleString(), icon: '♻️', color: 'from-emerald-500 to-teal-500' },
  ]

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'เมื่อกี้'
    if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} ชั่วโมงที่แล้ว`
    return `${Math.floor(diffMins / 1440)} วันที่แล้ว`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"
        >
          🔄 รีเฟรช
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
          >
            <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${stat.color} flex items-center justify-center mb-3`}>
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">📋 กิจกรรมล่าสุด</h3>
        {recentActivity.length === 0 ? (
          <p className="text-gray-500 text-center py-8">ยังไม่มีกิจกรรม</p>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-sm">👤</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {activity.users?.username || 'ระบบ'}
                    </p>
                    <p className="text-sm text-gray-500">{activity.details || activity.action}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    activity.action.includes('withdraw') ? 'bg-amber-100 text-amber-700' :
                    activity.action.includes('login') ? 'bg-blue-100 text-blue-700' :
                    activity.action.includes('register') ? 'bg-emerald-100 text-emerald-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {activity.action}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">{formatTime(activity.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Machine Status */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">🖥️ สถานะเครื่อง</h3>
        {machineStatus ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className={`p-4 rounded-xl border ${
              machineStatus.status === 'online' ? 'bg-emerald-50 border-emerald-200' :
              machineStatus.status === 'maintenance' ? 'bg-amber-50 border-amber-200' :
              'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-3 h-3 rounded-full ${
                  machineStatus.status === 'online' ? 'bg-emerald-500 animate-pulse' :
                  machineStatus.status === 'maintenance' ? 'bg-amber-500' :
                  'bg-red-500'
                }`}></span>
                <span className={`font-medium ${
                  machineStatus.status === 'online' ? 'text-emerald-700' :
                  machineStatus.status === 'maintenance' ? 'text-amber-700' :
                  'text-red-700'
                }`}>
                  {machineStatus.status === 'online' ? 'Online' :
                   machineStatus.status === 'maintenance' ? 'ซ่อมบำรุง' : 'Offline'}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Last: {formatTime(machineStatus.last_heartbeat)}
              </p>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm text-blue-600 mb-1">อุณหภูมิ CPU</p>
              <p className={`text-xl font-bold ${machineStatus.cpu_temp > 70 ? 'text-red-600' : 'text-blue-700'}`}>
                {machineStatus.cpu_temp}°C
              </p>
            </div>
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
              <p className="text-sm text-purple-600 mb-1">ขวดในถัง</p>
              <p className="text-xl font-bold text-purple-700">
                {machineStatus.bottle_count} / {machineStatus.max_bottles}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">ไม่พบข้อมูลเครื่อง (กรุณารัน SQL Migration ก่อน)</p>
        )}
      </div>
    </motion.div>
  )
}

// Withdrawals Tab - Real Data with Manual Transfer
function WithdrawalsTab() {
  const [filter, setFilter] = useState('pending') // Default to pending
  const [withdrawals, setWithdrawals] = useState<Array<{
    id: string
    amount: number
    points_used: number
    promptpay_number: string
    status: string
    admin_note?: string
    created_at: string
    completed_at?: string
    users?: { id: string; username: string; phone: string }
  }>>([])
  const [summary, setSummary] = useState({ pendingCount: 0, pendingAmount: 0, completedTodayCount: 0, completedTodayAmount: 0 })
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [adminNote, setAdminNote] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const [withdrawalsData, summaryData] = await Promise.all([
        getWithdrawals(filter),
        getWithdrawalSummary()
      ])
      setWithdrawals(withdrawalsData)
      setSummary(summaryData)
    } catch (error) {
      console.error('Error fetching withdrawals:', error)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchData()
    // Auto refresh every 30 seconds for pending items
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  const handleTransfer = async (id: string) => {
    const item = withdrawals.find(w => w.id === id)
    if (!item) return
    
    const confirmMsg = `ยืนยันว่าโอนเงินแล้ว?\n\n💰 จำนวน: ${item.amount} บาท\n📱 พร้อมเพย์: ${item.promptpay_number}\n👤 ผู้รับ: ${item.users?.username || 'ไม่ทราบ'}`
    if (!confirm(confirmMsg)) return
    
    setProcessing(id)
    try {
      await updateWithdrawalStatus(id, 'completed', adminNote || 'โอนเงินสำเร็จ')
      setAdminNote('')
      setSelectedItem(null)
      await fetchData()
    } catch (error) {
      console.error('Error:', error)
      alert('เกิดข้อผิดพลาด')
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (id: string) => {
    const reason = prompt('เหตุผลที่ปฏิเสธ:')
    if (!reason) return
    
    setProcessing(id)
    try {
      await updateWithdrawalStatus(id, 'rejected', reason)
      await fetchData()
    } catch (error) {
      console.error('Error:', error)
      alert('เกิดข้อผิดพลาด')
    } finally {
      setProcessing(null)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('คัดลอกแล้ว: ' + text)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">⏳</span>
            <p className="text-amber-700 font-medium">รอโอนเงิน</p>
          </div>
          <p className="text-4xl font-bold text-amber-800">{summary.pendingCount}</p>
          <p className="text-amber-600 text-sm mt-1">รวม {summary.pendingAmount.toLocaleString()} บาท</p>
        </div>
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">✅</span>
            <p className="text-emerald-700 font-medium">โอนแล้ววันนี้</p>
          </div>
          <p className="text-4xl font-bold text-emerald-800">{summary.completedTodayCount}</p>
          <p className="text-emerald-600 text-sm mt-1">รวม {summary.completedTodayAmount.toLocaleString()} บาท</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'pending', label: '⏳ รอโอน', count: summary.pendingCount },
          { id: 'completed', label: '✅ โอนแล้ว', count: null },
          { id: 'rejected', label: '❌ ปฏิเสธ', count: null },
          { id: 'all', label: '📋 ทั้งหมด', count: null },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === f.id
                ? 'bg-red-500 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f.label} {f.count !== null && f.count > 0 && `(${f.count})`}
          </button>
        ))}
        <button
          onClick={fetchData}
          className="ml-auto px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
        >
          🔄 รีเฟรช
        </button>
      </div>

      {/* Withdrawals List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-800">💳 รายการแลกเงิน ({withdrawals.length} รายการ)</h3>
          {filter === 'pending' && summary.pendingCount > 0 && (
            <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm rounded-full animate-pulse">
              มี {summary.pendingCount} รายการรอดำเนินการ
            </span>
          )}
        </div>
        {withdrawals.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-5xl block mb-4">📭</span>
            <p className="text-gray-500">ไม่มีรายการ</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {withdrawals.map((item) => (
              <div 
                key={item.id} 
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  item.status === 'pending' ? 'bg-amber-50/50' : ''
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* User Info */}
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                      item.status === 'pending' ? 'bg-amber-100' :
                      item.status === 'completed' ? 'bg-emerald-100' : 'bg-red-100'
                    }`}>
                      <span className="text-2xl">
                        {item.status === 'pending' ? '⏳' :
                         item.status === 'completed' ? '✅' : '❌'}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-lg">{item.users?.username || 'ไม่ทราบชื่อ'}</p>
                      <p className="text-sm text-gray-500">{item.users?.phone || '-'}</p>
                      <p className="text-xs text-gray-400 mt-1">📅 {formatDate(item.created_at)}</p>
                    </div>
                  </div>

                  {/* Amount & PromptPay */}
                  <div className="flex-1 lg:text-center">
                    <p className="text-3xl font-bold text-emerald-600">{item.amount} บาท</p>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <span className="text-gray-500 text-sm">พร้อมเพย์:</span>
                      <button
                        onClick={() => copyToClipboard(item.promptpay_number)}
                        className="font-mono text-blue-600 hover:text-blue-800 hover:underline font-medium"
                      >
                        {item.promptpay_number}
                      </button>
                      <button
                        onClick={() => copyToClipboard(item.promptpay_number)}
                        className="text-gray-400 hover:text-gray-600"
                        title="คัดลอก"
                      >
                        📋
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 min-w-[150px]">
                    {item.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleTransfer(item.id)}
                          disabled={processing === item.id}
                          className="w-full px-4 py-3 bg-emerald-500 text-white font-medium rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                        >
                          {processing === item.id ? (
                            <>⏳ กำลังบันทึก...</>
                          ) : (
                            <>✅ โอนแล้ว</>
                          )}
                        </button>
                        <button
                          onClick={() => handleReject(item.id)}
                          disabled={processing === item.id}
                          className="w-full px-4 py-2 bg-white text-red-600 font-medium rounded-xl border-2 border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors text-sm"
                        >
                          ❌ ปฏิเสธ
                        </button>
                      </>
                    ) : (
                      <div className="text-right">
                        <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                          item.status === 'completed' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {item.status === 'completed' ? '✅ โอนแล้ว' : '❌ ปฏิเสธ'}
                        </span>
                        {item.completed_at && (
                          <p className="text-xs text-gray-400 mt-1">{formatDate(item.completed_at)}</p>
                        )}
                        {item.admin_note && (
                          <p className="text-xs text-gray-500 mt-1">📝 {item.admin_note}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Copy Section for Pending */}
                {item.status === 'pending' && (
                  <div className="mt-4 pt-4 border-t border-amber-200 bg-amber-50 -mx-4 -mb-4 px-4 pb-4">
                    <p className="text-xs text-amber-700 font-medium mb-2">📋 ข้อมูลสำหรับโอนเงิน:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => copyToClipboard(item.promptpay_number)}
                        className="px-3 py-2 bg-white rounded-lg text-sm text-left hover:bg-amber-100 transition-colors border border-amber-200"
                      >
                        <span className="text-gray-500 text-xs block">เลขพร้อมเพย์</span>
                        <span className="font-mono font-medium">{item.promptpay_number}</span>
                      </button>
                      <button
                        onClick={() => copyToClipboard(item.amount.toString())}
                        className="px-3 py-2 bg-white rounded-lg text-sm text-left hover:bg-amber-100 transition-colors border border-amber-200"
                      >
                        <span className="text-gray-500 text-xs block">จำนวนเงิน</span>
                        <span className="font-mono font-medium">{item.amount} บาท</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Users Tab - Real Data
function UsersTab() {
  const [users, setUsers] = useState<Array<{
    id: string
    username: string
    phone: string
    created_at: string
    user_points?: Array<{ points: number }> | { points: number }
  }>>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAllUsers(search || undefined)
      setUsers(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    const timer = setTimeout(fetchData, 500)
    return () => clearTimeout(timer)
  }, [fetchData])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Search */}
      <div className="flex gap-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 ค้นหาผู้ใช้ (ชื่อหรือเบอร์โทร)..."
          className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <button 
          onClick={fetchData}
          className="px-6 py-3 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600"
        >
          🔄 รีเฟรช
        </button>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">👥 รายชื่อผู้ใช้งาน ({users.length} คน)</h3>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : users.length === 0 ? (
          <p className="text-gray-500 text-center py-12">ไม่พบผู้ใช้</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">ผู้ใช้</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">เบอร์โทร</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">แต้ม</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">สมัครเมื่อ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                          <span className="text-emerald-600 font-medium">{user.username?.[0] || '?'}</span>
                        </div>
                        <span className="font-medium text-gray-800">{user.username}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-600">{user.phone}</td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                        {(
                          Array.isArray(user.user_points)
                            ? user.user_points[0]?.points || 0
                            : user.user_points?.points || 0
                        ).toLocaleString()} แต้ม
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-500 text-sm">{formatDate(user.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Pricing Settings Tab
function PricingTab() {
  const [pricing, setPricing] = useState({
    glass: { points: 5, name: 'ขวดแก้ว', emoji: '🍾' },
    plastic: { points: 3, name: 'ขวดพลาสติก', emoji: '🥤' },
    can: { points: 4, name: 'กระป๋อง', emoji: '🥫' },
    points_per_baht: 100,
    min_withdrawal: 100,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // ดึงค่า pricing จาก API
  const fetchPricing = useCallback(async () => {
    try {
      const response = await fetch('/api/pricing')
      const data = await response.json()
      if (data.success && data.pricing) {
        setPricing(data.pricing)
      }
    } catch (error) {
      console.error('Error fetching pricing:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPricing()
  }, [fetchPricing])

  // บันทึกค่า pricing
  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    
    try {
      const response = await fetch('/api/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pricing })
      })
      const data = await response.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: 'บันทึกสำเร็จ!' })
        // Refresh pricing from server to confirm
        await fetchPricing()
      } else {
        setMessage({ type: 'error', text: data.error || 'เกิดข้อผิดพลาด' })
      }
    } catch (error) {
      console.error('Error saving pricing:', error)
      setMessage({ type: 'error', text: 'ไม่สามารถบันทึกได้' })
    } finally {
      setSaving(false)
    }
  }

  // รีเซ็ตเป็นค่า default
  const handleReset = () => {
    if (!confirm('ต้องการรีเซ็ตเป็นค่าเริ่มต้น?')) return
    setPricing({
      glass: { points: 5, name: 'ขวดแก้ว', emoji: '🍾' },
      plastic: { points: 3, name: 'ขวดพลาสติก', emoji: '🥤' },
      can: { points: 4, name: 'กระป๋อง', emoji: '🥫' },
      points_per_baht: 100,
      min_withdrawal: 100,
    })
    setMessage({ type: 'success', text: 'รีเซ็ตเรียบร้อย (ยังไม่ได้บันทึก)' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">💰 ตั้งค่าราคา</h2>
          <p className="text-sm text-gray-500">กำหนดแต้มสำหรับขยะแต่ละประเภท</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm text-gray-700 font-medium"
          >
            🔄 รีเซ็ต
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-sm text-white font-medium disabled:opacity-50"
          >
            {saving ? '⏳ กำลังบันทึก...' : '💾 บันทึก'}
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-xl ${
          message.type === 'success' 
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      {/* Item Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Glass */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center">
              <span className="text-3xl">{pricing.glass.emoji}</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-800">{pricing.glass.name}</h3>
              <p className="text-sm text-gray-500">Glass Bottle</p>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-600 font-medium">แต้มต่อขวด</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={pricing.glass.points}
                onChange={(e) => setPricing({
                  ...pricing,
                  glass: { ...pricing.glass, points: parseInt(e.target.value) || 0 }
                })}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-xl font-bold text-center focus:outline-none focus:border-amber-400"
              />
              <span className="text-gray-500 font-medium">แต้ม</span>
            </div>
          </div>
        </div>

        {/* Plastic */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
              <span className="text-3xl">{pricing.plastic.emoji}</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-800">{pricing.plastic.name}</h3>
              <p className="text-sm text-gray-500">Plastic Bottle</p>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-600 font-medium">แต้มต่อขวด</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={pricing.plastic.points}
                onChange={(e) => setPricing({
                  ...pricing,
                  plastic: { ...pricing.plastic, points: parseInt(e.target.value) || 0 }
                })}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-xl font-bold text-center focus:outline-none focus:border-blue-400"
              />
              <span className="text-gray-500 font-medium">แต้ม</span>
            </div>
          </div>
        </div>

        {/* Can */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center">
              <span className="text-3xl">{pricing.can.emoji}</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-800">{pricing.can.name}</h3>
              <p className="text-sm text-gray-500">Aluminum Can</p>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-600 font-medium">แต้มต่อกระป๋อง</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={pricing.can.points}
                onChange={(e) => setPricing({
                  ...pricing,
                  can: { ...pricing.can, points: parseInt(e.target.value) || 0 }
                })}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-xl font-bold text-center focus:outline-none focus:border-gray-400"
              />
              <span className="text-gray-500 font-medium">แต้ม</span>
            </div>
          </div>
        </div>
      </div>

      {/* Exchange Rate Settings */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4">💱 อัตราแลกเปลี่ยน</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Points per Baht */}
          <div className="space-y-2">
            <label className="text-sm text-gray-600 font-medium">แต้มต่อ 1 บาท</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="1000"
                value={pricing.points_per_baht}
                onChange={(e) => setPricing({
                  ...pricing,
                  points_per_baht: parseInt(e.target.value) || 100
                })}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-lg font-bold focus:outline-none focus:border-emerald-400"
              />
              <span className="text-gray-500 font-medium whitespace-nowrap">แต้ม = 1 ฿</span>
            </div>
            <p className="text-xs text-gray-400">ตัวอย่าง: 100 แต้ม = 1 บาท</p>
          </div>

          {/* Min Withdrawal */}
          <div className="space-y-2">
            <label className="text-sm text-gray-600 font-medium">แต้มขั้นต่ำในการถอน</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="10000"
                value={pricing.min_withdrawal}
                onChange={(e) => setPricing({
                  ...pricing,
                  min_withdrawal: parseInt(e.target.value) || 100
                })}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-lg font-bold focus:outline-none focus:border-emerald-400"
              />
              <span className="text-gray-500 font-medium">แต้ม</span>
            </div>
            <p className="text-xs text-gray-400">ต้องมีแต้มอย่างน้อยนี้ถึงจะแลกเงินได้</p>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-linear-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200">
        <h3 className="font-bold text-emerald-800 mb-4">📋 ตัวอย่างการคำนวณ</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/70 rounded-xl p-4">
            <p className="text-sm text-gray-600">ขวดแก้ว 10 ขวด</p>
            <p className="text-xl font-bold text-emerald-700">{pricing.glass.points * 10} แต้ม</p>
            <p className="text-sm text-gray-500">= {(pricing.glass.points * 10 / pricing.points_per_baht).toFixed(2)} บาท</p>
          </div>
          <div className="bg-white/70 rounded-xl p-4">
            <p className="text-sm text-gray-600">ขวดพลาสติก 10 ขวด</p>
            <p className="text-xl font-bold text-blue-700">{pricing.plastic.points * 10} แต้ม</p>
            <p className="text-sm text-gray-500">= {(pricing.plastic.points * 10 / pricing.points_per_baht).toFixed(2)} บาท</p>
          </div>
          <div className="bg-white/70 rounded-xl p-4">
            <p className="text-sm text-gray-600">กระป๋อง 10 ใบ</p>
            <p className="text-xl font-bold text-gray-700">{pricing.can.points * 10} แต้ม</p>
            <p className="text-sm text-gray-500">= {(pricing.can.points * 10 / pricing.points_per_baht).toFixed(2)} บาท</p>
          </div>
          <div className="bg-white/70 rounded-xl p-4">
            <p className="text-sm text-gray-600">รวม 30 ชิ้น</p>
            <p className="text-xl font-bold text-purple-700">
              {(pricing.glass.points + pricing.plastic.points + pricing.can.points) * 10} แต้ม
            </p>
            <p className="text-sm text-gray-500">
              = {((pricing.glass.points + pricing.plastic.points + pricing.can.points) * 10 / pricing.points_per_baht).toFixed(2)} บาท
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Machine Service Tab - Real Data
function MachineTab() {
  const [machineStatus, setMachineStatus] = useState<{
    machine_id: string
    status: string
    cpu_temp: number
    storage_used: number
    bottle_count: number
    max_bottles: number
    last_heartbeat: string
    updated_at: string
  } | null>(null)
  const [maintenanceLogs, setMaintenanceLogs] = useState<Array<{
    id: string
    action: string
    performed_by: string
    created_at: string
  }>>([])
  const [bottleCounts, setBottleCounts] = useState<{
    glass: number
    plastic: number
    can: number
    total: number
  }>({ glass: 0, plastic: 0, can: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchBottleCounts = async () => {
    try {
      const res = await fetch('/api/bottleCounts')
      const data = await res.json()
      if (data.success) {
        setBottleCounts({
          glass: data.counts.glass,
          plastic: data.counts.plastic,
          can: data.counts.can,
          total: data.total
        })
      }
    } catch (error) {
      console.error('Error fetching bottle counts:', error)
    }
  }

  const fetchData = useCallback(async () => {
    try {
      const [statusData, logsData] = await Promise.all([
        getMachineStatus(),
        getMaintenanceLogs()
      ])
      setMachineStatus(statusData)
      setMaintenanceLogs(logsData)
      await fetchBottleCounts()
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10000) // Refresh every 10s
    return () => clearInterval(interval)
  }, [fetchData])

  const handleMaintenanceToggle = async () => {
    if (!machineStatus) return
    const newMode = machineStatus.status !== 'maintenance'
    
    setActionLoading(true)
    try {
      await toggleMaintenanceMode('main', newMode)
      await fetchData()
    } catch (error) {
      console.error('Error:', error)
      alert('เกิดข้อผิดพลาด')
    } finally {
      setActionLoading(false)
    }
  }

  const handleAction = async (action: string) => {
    if (!confirm(`ยืนยัน: ${action}?`)) return
    
    setActionLoading(true)
    try {
      await addMaintenanceLog('main', action, 'Admin')
      
      if (action === 'รีสตาร์ทเครื่อง') {
        await updateMachineStatus('main', { status: 'online', cpu_temp: 35 })
      } else if (action === 'เคลียร์ขวด' || action === 'รีเซ็ตจำนวนขวด') {
        await updateMachineStatus('main', { bottle_count: 0, storage_used: 0 })
        // รีเซ็ตจำนวนขวดผ่าน API
        await fetch('/api/bottleCounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reset_all' })
        })
      }
      
      await fetchData()
      alert('ดำเนินการสำเร็จ!')
    } catch (error) {
      console.error('Error:', error)
      alert('เกิดข้อผิดพลาด')
    } finally {
      setActionLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!machineStatus) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
        <span className="text-4xl block mb-4">⚠️</span>
        <h3 className="text-lg font-bold text-amber-800 mb-2">ยังไม่มีข้อมูลเครื่อง</h3>
        <p className="text-amber-700 text-sm">กรุณารัน SQL ใน MIGRATION_WITHDRAWALS.sql ก่อน</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Maintenance Mode Toggle */}
      <div className={`p-5 rounded-2xl border-2 ${
        machineStatus.status === 'maintenance' ? 'bg-amber-50 border-amber-300' : 'bg-white border-gray-100'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-800">🔧 โหมดซ่อมบำรุง</h3>
            <p className="text-sm text-gray-500">เปิดเมื่อต้องการปิดเครื่องชั่วคราว</p>
          </div>
          <button
            onClick={handleMaintenanceToggle}
            disabled={actionLoading}
            className={`px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 ${
              machineStatus.status === 'maintenance'
                ? 'bg-amber-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {machineStatus.status === 'maintenance' ? '🔴 กำลังซ่อมบำรุง' : '🟢 เครื่องทำงานปกติ'}
          </button>
        </div>
      </div>

      {/* Machine Status */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">สถานะ</p>
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${
              machineStatus.status === 'online' ? 'bg-emerald-500 animate-pulse' :
              machineStatus.status === 'maintenance' ? 'bg-amber-500' : 'bg-red-500'
            }`}></span>
            <span className="font-bold text-gray-800">
              {machineStatus.status === 'online' ? 'Online' :
               machineStatus.status === 'maintenance' ? 'Maintenance' : 'Offline'}
            </span>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">อัปเดตล่าสุด</p>
          <p className="font-bold text-gray-800 text-sm">{formatDate(machineStatus.updated_at)}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">อุณหภูมิ CPU</p>
          <p className={`font-bold ${machineStatus.cpu_temp > 70 ? 'text-red-600' : 'text-gray-800'}`}>
            {machineStatus.cpu_temp}°C
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">ขวดในถัง</p>
          <p className="font-bold text-gray-800">{bottleCounts.glass + bottleCounts.plastic + bottleCounts.can} / {machineStatus.max_bottles}</p>
        </div>
      </div>

      {/* Storage Status - 3 Bottle Type Bars */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">📦 พื้นที่เก็บขวดแยกประเภท</h3>
          <button
            onClick={() => handleAction('รีเซ็ตจำนวนขวด')}
            disabled={actionLoading}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <span>🔄</span>
            รีเซ็ตทั้งหมด
          </button>
        </div>
        
        {/* Glass Bottles */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 flex items-center gap-2">
              <span className="text-xl">🍶</span> ขวดแก้ว
            </span>
            <span className="font-bold text-emerald-600">{bottleCounts.glass} ขวด</span>
          </div>
          <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
              style={{ width: `${Math.min((bottleCounts.glass / 100) * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Plastic Bottles */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 flex items-center gap-2">
              <span className="text-xl">🥤</span> ขวดพลาสติก
            </span>
            <span className="font-bold text-blue-600">{bottleCounts.plastic} ขวด</span>
          </div>
          <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
              style={{ width: `${Math.min((bottleCounts.plastic / 100) * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Cans */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 flex items-center gap-2">
              <span className="text-xl">🥫</span> กระป๋อง
            </span>
            <span className="font-bold text-amber-600">{bottleCounts.can} ขวด</span>
          </div>
          <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-500"
              style={{ width: `${Math.min((bottleCounts.can / 100) * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Total Summary */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">รวมทั้งหมด</span>
            <span className="text-2xl font-bold text-gray-800">{bottleCounts.total} ขวด</span>
          </div>
        </div>

        {bottleCounts.total > 80 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            ⚠️ พื้นที่เก็บขวดใกล้เต็ม กรุณาเก็บขวดออก
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4">⚡ การดำเนินการด่วน</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button 
            onClick={() => handleAction('รีสตาร์ทเครื่อง')}
            disabled={actionLoading}
            className="p-4 bg-blue-50 hover:bg-blue-100 rounded-xl text-center transition-all disabled:opacity-50"
          >
            <span className="text-2xl block mb-2">🔄</span>
            <span className="text-sm text-blue-700 font-medium">รีสตาร์ทเครื่อง</span>
          </button>
          <button 
            onClick={() => handleAction('ทำความสะอาดเซ็นเซอร์')}
            disabled={actionLoading}
            className="p-4 bg-emerald-50 hover:bg-emerald-100 rounded-xl text-center transition-all disabled:opacity-50"
          >
            <span className="text-2xl block mb-2">🧹</span>
            <span className="text-sm text-emerald-700 font-medium">ทำความสะอาด</span>
          </button>
          <button 
            onClick={() => handleAction('เคลียร์ขวด')}
            disabled={actionLoading}
            className="p-4 bg-amber-50 hover:bg-amber-100 rounded-xl text-center transition-all disabled:opacity-50"
          >
            <span className="text-2xl block mb-2">📦</span>
            <span className="text-sm text-amber-700 font-medium">เคลียร์ขวด</span>
          </button>
          <button 
            onClick={() => handleAction('รายงานสถานะ')}
            disabled={actionLoading}
            className="p-4 bg-purple-50 hover:bg-purple-100 rounded-xl text-center transition-all disabled:opacity-50"
          >
            <span className="text-2xl block mb-2">📊</span>
            <span className="text-sm text-purple-700 font-medium">รายงานสถานะ</span>
          </button>
        </div>
      </div>

      {/* Maintenance Logs */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4">📋 ประวัติการซ่อมบำรุง</h3>
        {maintenanceLogs.length === 0 ? (
          <p className="text-gray-500 text-center py-8">ยังไม่มีประวัติ</p>
        ) : (
          <div className="space-y-3">
            {maintenanceLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🔧</span>
                  <div>
                    <p className="font-medium text-gray-800">{log.action}</p>
                    <p className="text-sm text-gray-500">โดย {log.performed_by}</p>
                  </div>
                </div>
                <span className="text-sm text-gray-400">{formatDate(log.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Debug Tab - Real Data
function DebugTab() {
  const [systemInfo, setSystemInfo] = useState<Record<string, string>>({})
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; error?: string } | null>(null)
  const [logs, setLogs] = useState<Array<{ time: string; level: string; message: string }>>([])
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    const info = getSystemInfo()
    setSystemInfo(info)
    
    testDatabaseConnection().then(setDbStatus)
  }, [])

  const addLog = (level: string, message: string) => {
    const newLog = {
      time: new Date().toLocaleTimeString(),
      level,
      message
    }
    setLogs(prev => [newLog, ...prev].slice(0, 50))
  }

  const testApi = async (endpoint: string) => {
    addLog('INFO', `Testing API: ${endpoint}...`)
    try {
      const response = await fetch(endpoint)
      const status = response.ok ? 'SUCCESS' : 'FAILED'
      addLog(response.ok ? 'INFO' : 'ERROR', `${endpoint} - ${status} (${response.status})`)
    } catch (error) {
      addLog('ERROR', `${endpoint} - FAILED: ${error}`)
    }
  }

  const handleDangerAction = async (action: string) => {
    if (!confirm(`⚠️ คุณแน่ใจหรือไม่ที่จะ ${action}? การกระทำนี้ไม่สามารถย้อนกลับได้!`)) return
    
    setActionLoading(true)
    addLog('WARN', `Executing: ${action}...`)
    
    try {
      if (action === 'Reset All Points') {
        await resetAllUserPoints()
      } else if (action === 'Clear Withdrawals') {
        await clearWithdrawalHistory()
      }
      addLog('INFO', `${action} completed successfully`)
      alert('ดำเนินการสำเร็จ!')
    } catch (error) {
      addLog('ERROR', `${action} failed: ${error}`)
      alert('เกิดข้อผิดพลาด!')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* System Info */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4">💻 ข้อมูลระบบ</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Object.entries(systemInfo).map(([key, value]) => (
            <div key={key} className="p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 uppercase">{key}</p>
              <p className="font-mono text-sm font-medium text-gray-800">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Database Status */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4">🗄️ Database Connection</h3>
        {dbStatus ? (
          <div className={`p-4 rounded-xl ${dbStatus.connected ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${dbStatus.connected ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
              <span className={`font-medium ${dbStatus.connected ? 'text-emerald-700' : 'text-red-700'}`}>
                {dbStatus.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            {dbStatus.error && <p className="text-red-600 text-sm mt-2">{dbStatus.error}</p>}
          </div>
        ) : (
          <p className="text-gray-500">กำลังตรวจสอบ...</p>
        )}
      </div>

      {/* API Testing */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4">🔌 ทดสอบ API</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button 
            onClick={() => testApi('/api/getPoint')}
            className="p-3 bg-blue-50 hover:bg-blue-100 rounded-xl text-sm text-blue-700 font-medium"
          >
            GET /api/getPoint
          </button>
          <button 
            onClick={() => testApi('/api/addPoint')}
            className="p-3 bg-emerald-50 hover:bg-emerald-100 rounded-xl text-sm text-emerald-700 font-medium"
          >
            POST /api/addPoint
          </button>
          <button 
            onClick={() => testApi('/api/loginPhone')}
            className="p-3 bg-purple-50 hover:bg-purple-100 rounded-xl text-sm text-purple-700 font-medium"
          >
            POST /api/loginPhone
          </button>
        </div>
      </div>

      {/* Console Logs */}
      <div className="bg-gray-900 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-800">
          <h3 className="font-medium text-white">🐛 Console Logs</h3>
          <button
            onClick={() => setLogs([])}
            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg"
          >
            Clear
          </button>
        </div>
        <div className="p-4 h-80 overflow-y-auto font-mono text-sm">
          {logs.length === 0 ? (
            <p className="text-gray-500">No logs - ทดสอบ API เพื่อดู logs</p>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="flex gap-3 py-1">
                <span className="text-gray-500">{log.time}</span>
                <span className={`
                  ${log.level === 'INFO' ? 'text-blue-400' : ''}
                  ${log.level === 'WARN' ? 'text-amber-400' : ''}
                  ${log.level === 'ERROR' ? 'text-red-400' : ''}
                `}>
                  [{log.level}]
                </span>
                <span className="text-gray-300">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 rounded-2xl p-6 border-2 border-red-200">
        <h3 className="font-bold text-red-800 mb-4">⚠️ Danger Zone</h3>
        <div className="space-y-3">
          <button 
            onClick={() => handleDangerAction('Reset All Points')}
            disabled={actionLoading}
            className="w-full p-4 bg-white border-2 border-red-300 rounded-xl text-red-700 font-medium hover:bg-red-100 text-left disabled:opacity-50"
          >
            🔄 Reset All User Points
          </button>
          <button 
            onClick={() => handleDangerAction('Clear Withdrawals')}
            disabled={actionLoading}
            className="w-full p-4 bg-white border-2 border-red-300 rounded-xl text-red-700 font-medium hover:bg-red-100 text-left disabled:opacity-50"
          >
            🗑️ Clear Completed Withdrawal History
          </button>
        </div>
      </div>
    </motion.div>
  )
}
