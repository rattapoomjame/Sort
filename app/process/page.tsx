'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useProcessStore, useUserStore } from '@/store/userStore'

/**
 * Process Page – Eco-Friendly Theme
 * หน้าประมวลผลการรีไซเคิล
 * หมายเหตุ: การเพิ่มแต้มจะทำโดย Raspberry Pi ผ่าน API /api/addPoint
 */
export default function ProcessPage() {
  const router = useRouter()
  const { status, progress, setStatus, resetProcess, setProgress } = useProcessStore()
  const { user, isAuthenticated } = useUserStore()
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  const handleComplete = useCallback(async () => {
    // ไม่ต้องเพิ่มแต้มที่นี่ เพราะ Raspberry Pi จะเรียก API /api/addPoint โดยตรง
    // เปลี่ยนไปหน้า total เพื่อแสดงผลลัพธ์
    router.push('/total')
  }, [router])

  // จำลอง IoT process
  useEffect(() => {
    if (status === 'processing') {
      const interval = setInterval(() => {
        setProgress((prev: number) => {
          const newProgress = prev + 5
          if (newProgress >= 100) {
            setStatus('completed')
            return 100
          }
          return newProgress
        })
      }, 200)
      return () => clearInterval(interval)
    }
  }, [status, setProgress, setStatus])

  // Auto complete
  useEffect(() => {
    if (status === 'completed') {
      const timer = setTimeout(() => handleComplete(), 2000)
      return () => clearTimeout(timer)
    }
  }, [status, handleComplete])

  const handleStartProcess = () => {
    resetProcess()
    setStatus('scanning')
    setIsProcessing(true)
    setTimeout(() => setStatus('processing'), 1400)
  }

  const statusConfig = {
    standby: { icon: '⏸️', title: 'พร้อมรับวัสดุ', color: 'bg-gray-100 text-gray-600' },
    scanning: { icon: '🔍', title: 'กำลังสแกน...', color: 'bg-blue-100 text-blue-600' },
    processing: { icon: '⚙️', title: 'กำลังประมวลผล', color: 'bg-amber-100 text-amber-600' },
    completed: { icon: '✅', title: 'เสร็จสิ้น!', color: 'bg-emerald-100 text-emerald-600' },
  }

  const currentStatus = statusConfig[status as keyof typeof statusConfig] || statusConfig.standby

  if (!isAuthenticated) return null

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 sm:px-8 lg:px-10 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[340px] sm:max-w-[400px] lg:max-w-[460px]"
      >
        {/* Back */}
        <button
          onClick={() => router.push('/welcome')}
          className="flex items-center gap-2 text-gray-500 hover:text-emerald-600 mb-6 text-sm"
        >
          <span>←</span> กลับ
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">ประมวลผลรีไซเคิล</h1>
          <p className="text-gray-500 text-sm">ใส่ขวด/กระป๋องเพื่อรับแต้ม</p>
        </div>

        {/* Status Card */}
        <motion.div
          key={status}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${currentStatus.color}`}>
              {currentStatus.title}
            </span>
            <span className="text-2xl">{currentStatus.icon}</span>
          </div>

          {/* Progress Circle */}
          <div className="flex justify-center my-8">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                  fill="none"
                />
                <motion.circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#10b981"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={351.86}
                  strokeDashoffset={351.86 - (351.86 * progress) / 100}
                  transition={{ duration: 0.3 }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-gray-800">{Math.round(progress)}%</span>
              </div>
            </div>
          </div>

          {/* Progress text */}
          <p className="text-center text-sm text-gray-500">
            {status === 'standby' && 'กดปุ่มด้านล่างเพื่อเริ่ม'}
            {status === 'scanning' && 'ตรวจสอบวัสดุ...'}
            {status === 'processing' && 'คำนวณคะแนน...'}
            {status === 'completed' && 'กำลังไปหน้าสรุป...'}
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {['ใส่วัสดุ', 'สแกน', 'คำนวณ', 'เสร็จ'].map((step, i) => {
            const stepProgress = i * 25
            const isActive = progress >= stepProgress && progress < stepProgress + 25
            const isDone = progress > stepProgress + 24

            return (
              <div
                key={step}
                className={`flex flex-col items-center p-3 rounded-xl text-xs transition-all ${
                  isDone ? 'bg-emerald-50 text-emerald-700' :
                  isActive ? 'bg-emerald-100 text-emerald-800 font-medium' :
                  'bg-gray-50 text-gray-400'
                }`}
              >
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm mb-1 ${
                  isDone ? 'bg-emerald-500 text-white' :
                  isActive ? 'bg-emerald-500 text-white animate-pulse' :
                  'bg-gray-200 text-gray-500'
                }`}>
                  {isDone ? '✓' : i + 1}
                </span>
                {step}
              </div>
            )
          })}
        </div>

        {/* Start Button */}
        {status === 'standby' ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStartProcess}
            disabled={isProcessing}
            className="w-full py-6 text-lg bg-linear-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-200/50 disabled:opacity-50"
          >
            🚀 เริ่มประมวลผล
          </motion.button>
        ) : (
          <div className="text-center text-emerald-600 font-medium flex items-center justify-center gap-2">
            <motion.span
              animate={{ opacity: [0.4, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="w-2 h-2 bg-emerald-500 rounded-full"
            />
            {status === 'completed' ? 'กำลังไปหน้าสรุป...' : 'กำลังทำงาน...'}
          </div>
        )}
      </motion.div>
    </div>
  )
}
