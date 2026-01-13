'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useUserStore } from '@/store/userStore'
import { getUserPoints } from '@/lib/supabase'

export default function WelcomePage() {
    // State สำหรับประวัติการถอนเงิน
    const [withdrawals, setWithdrawals] = useState<Array<{
      id: string
      amount: number
      points_used: number
      status: string
      created_at: string
      completed_at?: string
    }>>([])
     const { user, points, setPoints, isAuthenticated } = useUserStore()
    // โหลดประวัติการถอนเงิน
    useEffect(() => {
      const fetchWithdrawals = async () => {
        if (user?.id) {
          try {
            const res = await fetch(`/api/withdrawals?user_id=${user.id}`)
            const data = await res.json()
            if (data.success && Array.isArray(data.withdrawals)) {
              setWithdrawals(data.withdrawals.slice(0, 5)) // 5 รายการล่าสุด
            }
          } catch (err) {
            console.error('Error fetching withdrawals:', err)
          }
        }
      }
      fetchWithdrawals()
    }, [user])
  const router = useRouter()
  const safePoints = Number(points ?? 0)
  
  // State สำหรับ pricing จาก API
  const [pricing, setPricing] = useState({
    glass: { points: 10 },
    plastic: { points: 8 },
    can: { points: 6 }
  })

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    const fetchPoints = async () => {
      if (user?.id) {
        try {
          const userPoints = await getUserPoints(user.id)
          setPoints(userPoints)
        } catch (error) {
          console.error('Error fetching points:', error)
        }
      }
    }
    fetchPoints()
  }, [user, setPoints])
  
  // โหลด pricing จาก API
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await fetch('/api/pricing')
        const data = await response.json()
        if (data.pricing) {
          setPricing(data.pricing)
        }
      } catch (error) {
        console.error('Error fetching pricing:', error)
      }
    }
    fetchPricing()
  }, [])

  if (!isAuthenticated) {
    return null
  }

  const menuItems = [
    { icon: '📊', title: 'สถิติ & ประวัติ', desc: 'ดูแต้มที่สะสม', path: '/stats', primary: true },
    { icon: '💳', title: 'แลกเงิน', desc: 'ถอนเงินสด', path: '/payment', primary: false },
  ]

  // ใช้ pricing จาก API
  const rateInfo = [
    { icon: '/glass.png', label: `${pricing.glass.points} แต้ม/ขวดแก้ว` },
    { icon: '/plastic.png', label: `${pricing.plastic.points} แต้ม/พลาสติก` },
    { icon: '/can.png', label: `${pricing.can.points} แต้ม/กระป๋อง` },
  ]

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 sm:px-8 lg:px-10 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[340px] sm:max-w-[400px] lg:max-w-[460px]"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center mb-6 sm:mb-8"
        >
          <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-linear-to-br from-emerald-400 to-teal-500 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/30 border-4 border-white mb-4">
            <Image src="/bottle.svg" alt="Sorting Machine" width={48} height={48} className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-1 text-center">
            สวัสดี, {user?.username || 'User'}!
          </h1>
          <p className="text-gray-500 text-sm sm:text-base text-center">ยินดีต้อนรับสู่ Sorting Machine</p>
        </motion.div>

        {/* Points Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-linear-to-br from-emerald-500 to-teal-500 rounded-2xl sm:rounded-3xl px-6 sm:px-8 lg:px-10 py-5 sm:py-6 lg:py-8 mb-4 sm:mb-6 text-white shadow-xl shadow-emerald-500/30 text-center"
        >
          <p className="text-sm sm:text-base opacity-90 mb-2">แต้มสะสมทั้งหมด</p>
          <p className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-1">{safePoints.toLocaleString('th-TH')}</p>
          <p className="text-sm sm:text-base opacity-80">แต้ม • {(safePoints / 100).toFixed(2)} บาท</p>
        </motion.div>

        {/* Rate Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 lg:p-5 mb-4 sm:mb-6 shadow-lg shadow-emerald-500/10 border border-emerald-100"
        >
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {rateInfo.map((item, i) => (
              <div key={i} className="flex flex-col items-center py-2 sm:py-3">
                <img src={item.icon} alt="item" className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 object-contain" />
                <p className="text-[10px] sm:text-xs lg:text-sm text-gray-600 mt-1 sm:mt-2 text-center leading-tight">{item.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Menu Grid */}
        <div className="space-y-2 sm:space-y-3">
          {menuItems.map((item, i) => (
            <motion.button
              key={item.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(item.path)}
              className={`w-full p-4 sm:p-5 rounded-xl sm:rounded-2xl text-left transition-all flex items-center gap-3 sm:gap-4 ${
                item.primary
                  ? 'bg-linear-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-white border border-emerald-100 shadow-md shadow-emerald-500/10 hover:border-emerald-200'
              }`}
            >
              <div className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${
                item.primary ? 'bg-white/20' : 'bg-emerald-50'
              }`}>
                <span className="text-xl sm:text-2xl lg:text-3xl">{item.icon}</span>
              </div>
              <div className="min-w-0">
                <p className={`font-semibold text-sm sm:text-base lg:text-lg ${item.primary ? 'text-white' : 'text-gray-800'}`}>
                  {item.title}
                </p>
                <p className={`text-xs sm:text-sm ${item.primary ? 'text-white/80' : 'text-gray-500'}`}>
                  {item.desc}
                </p>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Withdrawals History */}
        <div className="mt-6">
          <h3 className="text-base font-bold text-gray-800 mb-2">💳 ประวัติการถอนเงินล่าสุด</h3>
          {withdrawals.length === 0 ? (
            <p className="text-gray-400 text-sm">ยังไม่มีรายการถอนเงิน</p>
          ) : (
            <div className="space-y-2">
              {withdrawals.map((w) => (
                <div key={w.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-800">{w.amount.toLocaleString()} บาท</div>
                    <div className="text-xs text-gray-500">{new Date(w.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                    w.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : w.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {w.status === 'completed' ? 'สำเร็จ' : w.status === 'pending' ? 'รอดำเนินการ' : w.status}
                  </div>
                </div>
              ))}
              <button
                onClick={() => router.push('/withdrawals-history')}
                className="w-full mt-3 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium rounded-xl text-sm"
              >
                ดูประวัติการถอนเงินทั้งหมด
              </button>
            </div>
          )}
        </div>

        {/* Logout */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={() => {
            useUserStore.getState().logout()
            router.push('/')
          }}
          className="w-full py-4 sm:py-5 text-gray-400 text-sm sm:text-base hover:text-red-500 transition-colors mt-6 sm:mt-8"
        >
          ออกจากระบบ
        </motion.button>
      </motion.div>
    </div>
  )
}
