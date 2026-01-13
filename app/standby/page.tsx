'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/store/userStore'
import Image from 'next/image'

/**
 * Standby Page – หน้าพักเครื่อง (Screensaver Mode)
 * แสดงหน้าจอพักเมื่อไม่มีการใช้งาน
 */
export default function StandbyPage() {
  const router = useRouter()
  const { isAuthenticated } = useUserStore()
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  // อัพเดทเวลาทุกวินาที
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  if (!isAuthenticated) return null

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('th-TH', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  return (
    <div 
      className="min-h-dvh flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12 bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 cursor-pointer"
      onClick={() => router.push('/welcome')}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="w-full max-w-[340px] sm:max-w-[400px] lg:max-w-[460px] text-center"
      >
        {/* Floating Logo */}
        <motion.div
          animate={{ 
            y: [0, -15, 0],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 6, 
            repeat: Infinity, 
            ease: 'easeInOut' 
          }}
          className="mb-8 sm:mb-12 flex justify-center"
        >
          <div className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 bg-linear-to-br from-emerald-400 to-teal-500 rounded-3xl sm:rounded-4xl flex items-center justify-center shadow-2xl shadow-emerald-500/30 border-4 border-white/20">
            <Image src="/bottle.svg" alt="Sorting Machine" width={80} height={80} className="w-14 h-14 sm:w-20 sm:h-20 lg:w-24 lg:h-24" />
          </div>
        </motion.div>

        {/* Time Display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-4"
        >
          <motion.p 
            className="text-6xl sm:text-7xl lg:text-8xl font-bold text-white tracking-wider"
            animate={{ opacity: [1, 0.7, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {formatTime(currentTime)}
          </motion.p>
        </motion.div>

        {/* Date Display */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-lg sm:text-xl text-gray-400 mb-8 sm:mb-12"
        >
          {formatDate(currentTime)}
        </motion.p>

        {/* Status Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-8"
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gray-800/50 rounded-full border border-gray-700"
          >
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-2 h-2 sm:w-3 sm:h-3 bg-emerald-500 rounded-full"
            />
            <span className="text-sm sm:text-base text-gray-300 font-medium">โหมดพักเครื่อง</span>
          </motion.div>
        </motion.div>

        {/* Sorting Machine Branding */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mb-8"
        >
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-emerald-400 mb-2">Sorting Machine</h1>
          <p className="text-sm sm:text-base text-gray-500">ระบบคัดแยกขยะอัตโนมัติ</p>
        </motion.div>

        {/* Touch to Wake */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
        >
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-sm sm:text-base text-gray-500"
          >
            👆 แตะหน้าจอเพื่อเริ่มใช้งาน
          </motion.p>
        </motion.div>

        {/* Decorative Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{ 
              x: [0, 100, 0],
              y: [0, -50, 0],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 15, repeat: Infinity }}
            className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-500 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ 
              x: [0, -80, 0],
              y: [0, 60, 0],
              opacity: [0.1, 0.15, 0.1]
            }}
            transition={{ duration: 20, repeat: Infinity, delay: 2 }}
            className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500 rounded-full blur-3xl"
          />
        </div>
      </motion.div>
    </div>
  )
}
