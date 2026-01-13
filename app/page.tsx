'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

interface Stats {
  kiosks: number
  users: string
  totalPoints: string
}

/**
 * Home Page – Eco-Friendly Theme
 * ธีมรักโลก สะอาด สวยงาม พอดีจอ
 * ดึงข้อมูลจริงจาก Supabase
 */
export default function Home() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats>({
    kiosks: 1,
    users: '0',
    totalPoints: '0'
  })
  const [loading, setLoading] = useState(true)

  // ดึงข้อมูลสถิติจาก database
  useEffect(() => {
    async function fetchStats() {
      try {
        // นับจำนวนผู้ใช้
        const { count: userCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })

        // รวมแต้มทั้งหมด
        const { data: pointsData } = await supabase
          .from('user_points')
          .select('points')

        const totalPoints = pointsData?.reduce((sum, p) => sum + (p.points || 0), 0) || 0

        // นับจำนวนเครื่อง (kiosks)
        const { count: machineCount } = await supabase
          .from('machine_status')
          .select('*', { count: 'exact', head: true })

        // Format ตัวเลขให้อ่านง่าย
        const formatNumber = (num: number): string => {
          if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M+`
          if (num >= 1000) return `${(num / 1000).toFixed(0)}K+`
          return num.toString()
        }

        setStats({
          kiosks: machineCount || 1,
          users: formatNumber(userCount || 0),
          totalPoints: formatNumber(totalPoints)
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const features = [
    { icon: '🌍', title: 'ช่วยโลก', desc: 'ลดขยะด้วยการรีไซเคิล' },
    { icon: '♻️', title: 'รับแต้ม', desc: 'สะสมคะแนนทุกครั้ง' },
    { icon: '💰', title: 'แลกเงิน', desc: 'แปลงแต้มเป็นเงินสด' },
  ]

  const statsDisplay = [
    { value: stats.kiosks.toString(), label: 'Kiosks' },
    { value: stats.users, label: 'ผู้ใช้' },
    { value: stats.totalPoints, label: 'แต้มสะสม' },
  ]

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 sm:px-8 lg:px-10 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[340px] sm:max-w-[400px] lg:max-w-[460px] text-center"
      >
        {/* Logo */}
        <motion.div
          animate={{ y: [-3, 3, -3] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="mb-6 sm:mb-8 flex justify-center"
        >
          <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 bg-linear-to-br from-emerald-400 to-teal-500 rounded-3xl sm:rounded-4xl flex items-center justify-center shadow-2xl shadow-emerald-500/30 border-4 border-white">
            <Image src="/bottle.svg" alt="ขวดพลาสติก" width={64} height={64} className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-bold text-emerald-600 mb-2"
        >
          Sorting Machine
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-emerald-500 font-medium text-base sm:text-lg lg:text-xl mb-1"
        >
          ระบบสะสมแต้มรีไซเคิล
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-gray-500 text-sm sm:text-base mb-8 sm:mb-10"
        >
          รักโลก • รับแต้ม • แลกเงินสด
        </motion.p>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl shadow-emerald-500/10 border border-emerald-100 mb-5 sm:mb-6"
        >
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex flex-col items-center text-center"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-emerald-50 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-3">
                  <span className="text-2xl sm:text-3xl lg:text-4xl">{f.icon}</span>
                </div>
                <p className="text-xs sm:text-sm lg:text-base font-semibold text-gray-800">{f.title}</p>
                <p className="text-[10px] sm:text-xs lg:text-sm text-gray-500 mt-0.5 leading-tight">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 shadow-lg shadow-emerald-500/10 border border-emerald-100 mb-6 sm:mb-8"
        >
          <div className="grid grid-cols-3 divide-x divide-emerald-100">
            {statsDisplay.map((stat, i) => (
              <div key={i} className="text-center px-2">
                {loading ? (
                  <div className="animate-pulse">
                    <div className="h-7 sm:h-8 bg-emerald-100 rounded w-12 mx-auto mb-1"></div>
                    <div className="h-3 bg-gray-100 rounded w-10 mx-auto"></div>
                  </div>
                ) : (
                  <>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-600">{stat.value}</p>
                    <p className="text-[10px] sm:text-xs lg:text-sm text-gray-500">{stat.label}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Buttons */}
        <div className="space-y-3">
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/login')}
            className="w-full py-5 sm:py-6 bg-linear-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl sm:rounded-2xl shadow-xl shadow-emerald-500/30 text-lg sm:text-xl"
          >
            เข้าสู่ระบบ
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/register')}
            className="w-full py-5 sm:py-6 bg-white text-emerald-600 font-semibold rounded-xl sm:rounded-2xl border-2 border-emerald-200 shadow-lg text-lg sm:text-xl"
          >
            สมัครสมาชิกฟรี
          </motion.button>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-xs sm:text-sm text-gray-400 mt-6 sm:mt-8"
        >
          © 2025 Sorting Machine • รักโลก รักษ์สิ่งแวดล้อม 🌍
        </motion.p>
      </motion.div>
    </div>
  )
}
