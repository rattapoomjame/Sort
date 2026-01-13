'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useUserStore, useProcessStore } from '@/store/userStore'

/**
 * Total Page – Eco-Friendly Theme
 * หน้าสรุปคะแนน - ใช้ข้อมูลจริงจาก processStore
 */
export default function TotalPage() {
  const router = useRouter()
  const { points } = useUserStore()
  const { lastPoints, lastLabel, sessionTotalPoints, sessionItems, getSessionSummary } = useProcessStore()
  const safePoints = Number(points ?? 0)
  const [countdown, setCountdown] = useState(15)

  // คำนวณข้อมูลสรุป
  const summary = getSessionSummary()
  const earnedPoints = sessionTotalPoints > 0 ? sessionTotalPoints : (lastPoints || 1)

  // แปลงประเภทเป็นภาษาไทย
  const getItemTypeThai = (type: string | null) => {
    if (!type) return 'รายการ'
    const lowerType = type.toLowerCase()
    if (lowerType.includes('glass')) return 'ขวดแก้ว'
    if (lowerType.includes('plastic')) return 'ขวดพลาสติก'
    if (lowerType.includes('can') || lowerType.includes('aluminum')) return 'กระป๋อง'
    return 'รายการ'
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.push('/standby')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [router])

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 sm:px-8 lg:px-10 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[340px] sm:max-w-[400px] lg:max-w-[460px]"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          className="flex justify-center mb-6"
        >
          <div className="w-24 h-24 rounded-full bg-linear-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200/50">
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-5xl"
            >
              ✨
            </motion.span>
          </div>
        </motion.div>

        {/* Title */}
        <div className="text-center mb-6">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-gray-800"
          >
            🎉 ยินดีด้วย!
          </motion.h1>
          <p className="text-gray-500 text-sm mt-1">คะแนนถูกเพิ่มเรียบร้อยแล้ว</p>
        </div>

        {/* Points Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 mb-5 shadow-sm border border-gray-100 text-center"
        >
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">คะแนนรวมทั้งหมด</p>
          <motion.p
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 150, delay: 0.5 }}
            className="text-5xl font-bold text-emerald-600"
          >
            {safePoints.toLocaleString('th-TH')}
          </motion.p>
          <p className="text-gray-400 text-sm mt-2">แต้ม</p>

          {/* Points Added */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full">
              <span className="text-emerald-600 font-semibold">+{earnedPoints}</span>
              <span className="text-emerald-700 text-sm">แต้มที่เพิ่ม</span>
            </div>
            {lastLabel && (
              <p className="text-gray-500 text-xs mt-2">
                จาก {getItemTypeThai(lastLabel)}
              </p>
            )}
          </div>
        </motion.div>

        {/* Session Summary - แสดงเมื่อมีรายการใน session */}
        {summary.totalCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-white rounded-2xl p-4 mb-5 shadow-sm border border-gray-100"
          >
            <h3 className="text-sm font-medium text-gray-700 mb-3 text-center">📦 สรุปเซสชันนี้</h3>
            <div className="space-y-2">
              {sessionItems.glassBottle.count > 0 && (
                <div className="flex items-center justify-between px-3 py-2 bg-emerald-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <img src="/glass.png" alt="glass" className="w-5 h-5 object-contain" />
                    <span className="text-sm text-gray-700">ขวดแก้ว</span>
                  </div>
                  <span className="text-sm font-medium text-emerald-600">x{sessionItems.glassBottle.count}</span>
                </div>
              )}
              {sessionItems.plasticBottle.count > 0 && (
                <div className="flex items-center justify-between px-3 py-2 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <img src="/plastic.png" alt="plastic" className="w-5 h-5 object-contain" />
                    <span className="text-sm text-gray-700">ขวดพลาสติก</span>
                  </div>
                  <span className="text-sm font-medium text-blue-600">x{sessionItems.plasticBottle.count}</span>
                </div>
              )}
              {sessionItems.can.count > 0 && (
                <div className="flex items-center justify-between px-3 py-2 bg-amber-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <img src="/can.png" alt="can" className="w-5 h-5 object-contain" />
                    <span className="text-sm text-gray-700">กระป๋อง</span>
                  </div>
                  <span className="text-sm font-medium text-amber-600">x{sessionItems.can.count}</span>
                </div>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 text-center">
              <span className="text-gray-600 text-sm">รวม {summary.totalCount} ชิ้น = </span>
              <span className="text-emerald-600 font-bold">{summary.totalMoney} บาท</span>
            </div>
          </motion.div>
        )}

        {/* Info */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col items-center p-3 bg-white rounded-lg">
              <span className="text-2xl mb-1">💰</span>
              <span className="text-xs text-gray-600 text-center">100 แต้ม = 1 บาท</span>
            </div>
            <div className="flex flex-col items-center p-3 bg-white rounded-lg">
              <span className="text-2xl mb-1">🔄</span>
              <span className="text-xs text-gray-600 text-center">ซิงค์อัตโนมัติ</span>
            </div>
          </div>
        </div>

        {/* Countdown */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 text-gray-500 text-sm">
            <motion.div
              animate={{ opacity: [0.4, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="w-2 h-2 bg-emerald-500 rounded-full"
            />
            กลับหน้าสแตนบายใน {countdown} วินาที
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 10, ease: 'linear' }}
              className="h-full bg-emerald-500 rounded-full"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/standby')}
            className="w-full py-6 text-lg bg-linear-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-200/50"
          >
            ⏸️ กลับหน้าสแตนบาย
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/process')}
            className="w-full py-5 text-lg bg-white text-emerald-600 font-medium rounded-xl border border-emerald-200 hover:bg-emerald-50 transition-colors"
          >
            ♻️ รีไซเคิลต่อ
          </motion.button>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          ขอบคุณที่ร่วมรักษ์โลก 🌍💚
        </p>
      </motion.div>
    </div>
  )
}
