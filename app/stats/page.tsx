'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useUserStore } from '@/store/userStore'
import { supabase } from '@/lib/supabase'

interface HistoryItem {
  id: string
  type: string
  amount: number
  points: number
  date: string
  time: string
}

interface Stats {
  totalRecycled: number
  totalEarned: number
  thisMonth: number
  lastMonth: number
  glassBottles: number
  plasticBottles: number
  cans: number
}

/**
 * Stats Page – ประวัติการรีไซเคิล
 * ดึงข้อมูลจริงจาก Supabase
 */
export default function StatsPage() {
  const router = useRouter()
  const { user, points, isAuthenticated } = useUserStore()
  const safePoints = Number(points ?? 0)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({
    totalRecycled: 0,
    totalEarned: safePoints,
    thisMonth: 0,
    lastMonth: 0,
    glassBottles: 0,
    plasticBottles: 0,
    cans: 0,
  })
  const [recentHistory, setRecentHistory] = useState<HistoryItem[]>([])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  // ดึงข้อมูลจาก database
  useEffect(() => {
    async function fetchStats() {
      if (!user?.id) return
      
      try {
        setLoading(true)
        
        // ดึงประวัติการรีไซเคิลจาก point_history
        const { data: historyData, error: historyError } = await supabase
          .from('point_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (historyError) {
          console.error('Error fetching history:', historyError)
        }

        const history = historyData || []
        
        // คำนวณสถิติ
        let glassCount = 0
        let plasticCount = 0
        let canCount = 0
        let thisMonthCount = 0
        let lastMonthCount = 0
        
        const now = new Date()
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

        history.forEach((item: { label?: string; created_at?: string }) => {
          // นับตามประเภท
          const itemType = item.label?.toLowerCase() || ''
          if (itemType.includes('glass')) glassCount++
          else if (itemType.includes('plastic')) plasticCount++
          else if (itemType.includes('can') || itemType.includes('aluminum')) canCount++

          // นับตามเดือน
          const itemDate = new Date(item.created_at || '')
          if (itemDate >= thisMonthStart) {
            thisMonthCount++
          } else if (itemDate >= lastMonthStart && itemDate <= lastMonthEnd) {
            lastMonthCount++
          }
        })

        setStats({
          totalRecycled: history.length,
          totalEarned: safePoints,
          thisMonth: thisMonthCount,
          lastMonth: lastMonthCount,
          glassBottles: glassCount,
          plasticBottles: plasticCount,
          cans: canCount,
        })

        // จัดรูปแบบประวัติล่าสุด 5 รายการ
        const formattedHistory: HistoryItem[] = history.slice(0, 5).map((item: { id: string; label?: string; points?: number; created_at?: string }) => {
          const itemDate = new Date(item.created_at || '')
          const thaiDate = itemDate.toLocaleDateString('th-TH', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
          })
          const time = itemDate.toLocaleTimeString('th-TH', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })

          let type = 'ขวด'
          const itemType = (item.label || '').toLowerCase()
          if (itemType.includes('glass')) type = 'ขวดแก้ว'
          else if (itemType.includes('plastic')) type = 'ขวดพลาสติก'
          else if (itemType.includes('can') || itemType.includes('aluminum')) type = 'กระป๋อง'

          return {
            id: item.id,
            type,
            amount: 1,
            points: item.points || 0,
            date: thaiDate,
            time,
          }
        })

        setRecentHistory(formattedHistory)
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user?.id, safePoints])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ขวดแก้ว': return '🍾'
      case 'ขวดพลาสติก': return '🧴'
      case 'กระป๋อง': return '🥫'
      default: return '♻️'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ขวดแก้ว': return 'bg-emerald-100 text-emerald-700'
      case 'ขวดพลาสติก': return 'bg-blue-100 text-blue-700'
      case 'กระป๋อง': return 'bg-amber-100 text-amber-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (!isAuthenticated) return null

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 sm:px-8 lg:px-10 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[340px] sm:max-w-[400px] lg:max-w-[460px]">
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <button
            onClick={() => router.push('/welcome')}
            className="self-start flex items-center gap-2 text-gray-500 hover:text-emerald-600 text-sm mb-4"
          >
            <span>←</span> กลับ
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 text-center">📊 สถิติ & ประวัติ</h1>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-linear-to-br from-emerald-500 to-teal-500 rounded-2xl p-4 text-white shadow-lg text-center"
          >
            <p className="text-xs sm:text-sm opacity-80">แต้มสะสม</p>
            <p className="text-2xl sm:text-3xl font-bold">{stats.totalEarned.toLocaleString()}</p>
            <p className="text-xs opacity-70 mt-1">= {(stats.totalEarned / 100).toFixed(2)} บาท</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center"
          >
            <p className="text-xs sm:text-sm text-gray-500">รีไซเคิลทั้งหมด</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-800">{stats.totalRecycled}</p>
            <p className="text-xs text-gray-400 mt-1">ชิ้น</p>
          </motion.div>
        </div>

        {/* Monthly Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-4 sm:p-5 mb-4 shadow-sm border border-gray-100"
        >
          <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-4 text-center">เปรียบเทียบรายเดือน</h3>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span>เดือนนี้</span>
                <span className="font-medium text-emerald-600">{stats.thisMonth} ชิ้น</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(stats.thisMonth / 50) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="h-full bg-linear-to-r from-emerald-400 to-teal-500 rounded-full"
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span>เดือนก่อน</span>
                <span className="font-medium text-gray-600">{stats.lastMonth} ชิ้น</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(stats.lastMonth / 50) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="h-full bg-gray-400 rounded-full"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* By Type */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl p-4 sm:p-5 mb-4 shadow-sm border border-gray-100"
        >
          <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-4 text-center">แยกตามประเภท</h3>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="flex flex-col items-center p-2 sm:p-3 bg-emerald-50 rounded-xl">
              <img src="/glass.png" alt="glass" className="w-6 h-6 sm:w-8 sm:h-8 object-contain" />
              <p className="text-base sm:text-lg font-bold text-emerald-700 mt-1">{stats.glassBottles}</p>
              <p className="text-[10px] sm:text-xs text-emerald-600">ขวดแก้ว</p>
            </div>
            <div className="flex flex-col items-center p-2 sm:p-3 bg-blue-50 rounded-xl">
              <img src="/plastic.png" alt="plastic" className="w-6 h-6 sm:w-8 sm:h-8 object-contain" />
              <p className="text-base sm:text-lg font-bold text-blue-700 mt-1">{stats.plasticBottles}</p>
              <p className="text-[10px] sm:text-xs text-blue-600">พลาสติก</p>
            </div>
            <div className="flex flex-col items-center p-2 sm:p-3 bg-amber-50 rounded-xl">
              <img src="/can.png" alt="can" className="w-6 h-6 sm:w-8 sm:h-8 object-contain" />
              <p className="text-base sm:text-lg font-bold text-amber-700 mt-1">{stats.cans}</p>
              <p className="text-[10px] sm:text-xs text-amber-600">กระป๋อง</p>
            </div>
          </div>
        </motion.div>

        {/* Recent History */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100"
        >
          <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-4 text-center">ประวัติล่าสุด</h3>
          {recentHistory.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {recentHistory.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + index * 0.05 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-10 h-10 rounded-full flex items-center justify-center ${getTypeColor(item.type)}`}>
                      {getTypeIcon(item.type)}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.type} x{item.amount}</p>
                      <p className="text-xs text-gray-400">{item.date} • {item.time}</p>
                    </div>
                  </div>
                  <span className="text-emerald-600 font-semibold">+{item.points} แต้ม</span>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400">
              <p className="text-4xl mb-2">📭</p>
              <p className="text-sm">ยังไม่มีประวัติการรีไซเคิล</p>
            </div>
          )}
        </motion.div>

        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push('/welcome')}
          className="w-full mt-4 py-3 sm:py-4 bg-linear-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl shadow-lg text-sm sm:text-base"
        >
          ← กลับหน้าหลัก
        </motion.button>
      </motion.div>
    </div>
  )
}
