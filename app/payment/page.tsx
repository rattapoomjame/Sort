'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore, useProcessStore } from '@/store/userStore'
import { createWithdrawal } from '@/lib/adminApi'

async function updateUserPointsAPI(userId: string, points: number) {
  const response = await fetch('/api/updatePoints', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, points })
  })
  const data = await response.json()
  if (!data.success) {
    throw new Error(data.error || 'Failed to update points')
  }
  return data
}

/**
 * Payment Page - Single Column Layout for 800x600
 */
export default function PaymentPage() {
  const router = useRouter()
  const { user, points, isAuthenticated, setPoints } = useUserStore()
  const { resetSession, getSessionSummary } = useProcessStore()
  const [promptpayId, setPromptpayId] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [showProcessingModal, setShowProcessingModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState(0)
  const safePoints = Number(points ?? 0)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  const summary = getSessionSummary()
  const totalCount = summary.totalCount
  const totalMoney = summary.totalMoney
  const moneyFromPoints = Math.floor(safePoints / 100)
  const finalTotal = totalCount > 0 ? totalMoney : moneyFromPoints

  const handlePayment = async () => {
    if (!promptpayId || promptpayId.length < 10) {
      setError('กรุณากรอกหมายเลขพร้อมเพย์ให้ถูกต้อง (10-13 หลัก)')
      return
    }
    if (finalTotal <= 0) {
      setError('ยอดเงินไม่เพียงพอสำหรับการถอน')
      return
    }
    if (safePoints < 100) {
      setError('ต้องมีแต้มอย่างน้อย 100 แต้มเพื่อแลกเงิน')
      return
    }

    setIsProcessing(true)
    setError('')
    setWithdrawAmount(finalTotal)
    setShowProcessingModal(true)

    try {
      if (!user?.id) throw new Error('ไม่พบข้อมูลผู้ใช้')

      const pointsToUse = finalTotal * 100
      await createWithdrawal(user.id, finalTotal, pointsToUse, promptpayId)
      
      const newPoints = safePoints - pointsToUse
      await updateUserPointsAPI(user.id, newPoints)
      setPoints(newPoints)
      resetSession()

      setTimeout(() => {
        setShowProcessingModal(false)
        setShowSuccessModal(true)
      }, 3000)

    } catch (err) {
      console.error('Payment error:', err)
      setShowProcessingModal(false)
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่')
      setIsProcessing(false)
    }
  }

  const handleSuccessClose = () => {
    setShowSuccessModal(false)
    setIsProcessing(false)
    router.push('/welcome')
  }

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-linear-to-br from-gray-50 to-emerald-50">
{/* Processing Modal */}
      <AnimatePresence>
        {showProcessingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-xs w-full text-center shadow-2xl"
            >
              {/* ✅ เพิ่ม div ครอบ และสั่ง flex justify-center */}
              <div className="w-full flex justify-center mb-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full"
                />
              </div>

              <h2 className="text-xl font-bold text-gray-800 mb-2">กำลังดำเนินการ</h2>
              <p className="text-gray-500 text-sm">กรุณารอสักครู่...</p>
              
              {/* ✅ เพิ่ม div ครอบจุด 3 จุด */}
              <div className="mt-3 flex justify-center gap-1">
                {[0, 0.2, 0.4].map((delay, i) => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay }}
                    className="w-2 h-2 bg-emerald-500 rounded-full"
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-xs w-full text-center shadow-2xl"
            >
              {/* ✅ เพิ่ม div ครอบ และสั่ง flex justify-center */}
              <div className="w-full flex justify-center mb-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}
                  className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center"
                >
                  <svg className="w-12 h-12 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <motion.path
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </motion.div>
              </div>

              <h2 className="text-xl font-bold text-gray-800 mb-2">ส่งคำขอสำเร็จ!</h2>
              <p className="text-gray-600 text-sm mb-3">
                คุณจะได้รับเงิน <span className="font-bold text-emerald-600">{withdrawAmount} บาท</span>
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                <p className="text-amber-800 font-medium flex items-center justify-center gap-2 text-sm">
                  <span>⏰</span> ภายใน 24 ชั่วโมง
                </p>
                <p className="text-amber-600 text-xs mt-1">พร้อมเพย์: {promptpayId}</p>
              </div>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleSuccessClose}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors"
              >
                ตกลง
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Main Content - Single Column Centered */}
      <div className="w-[800px] h-[600px] flex flex-col items-center justify-center px-8 py-4">
        <div className="w-full max-w-md flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-gray-500 hover:text-emerald-600 text-sm"
          >
            <span>←</span> กลับ
          </button>
          <h1 className="text-xl font-bold text-gray-800">💳 แลกเงิน</h1>
          <div className="w-12" />
        </div>

        {/* User Points Card */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-linear-to-r from-emerald-500 to-teal-500 rounded-xl p-4 text-white shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">♻️</div>
              <div>
                <p className="text-xs opacity-80">สวัสดี</p>
                <p className="font-bold text-lg">{user?.username || 'ผู้ใช้'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-80">แต้มคงเหลือ</p>
              <p className="text-2xl font-bold">{safePoints.toLocaleString()}</p>
              <p className="text-xs opacity-80">= {(safePoints / 100).toFixed(2)} บาท</p>
            </div>
          </div>
        </motion.div>

        {/* Amount to Withdraw */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-4 shadow-lg border border-gray-100 text-center"
        >
          <p className="text-gray-600 text-sm mb-1">จำนวนเงินที่จะได้รับ</p>
          <p className="text-4xl font-bold text-emerald-600">{finalTotal} <span className="text-xl">บาท</span></p>
          <p className="text-xs text-gray-400 mt-1">({safePoints.toLocaleString()} แต้ม ÷ 100)</p>
        </motion.div>

        {/* PromptPay Input */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-4 shadow-lg border border-gray-100"
        >
          <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
            💳 หมายเลขพร้อมเพย์
          </label>
          <div className="relative">
            <input
              type="tel"
              value={promptpayId}
              onChange={(e) => {
                setPromptpayId(e.target.value.replace(/\D/g, ''))
                setError('')
              }}
              placeholder="เบอร์โทรหรือเลขบัตรประชาชน"
              maxLength={13}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-center text-xl"
            />
            {promptpayId && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {promptpayId.length >= 10 ? (
                  <span className="text-emerald-500 text-xl">✓</span>
                ) : (
                  <span className="text-amber-500 text-sm">{promptpayId.length}/10</span>
                )}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">* เงินจะโอนไปยังบัญชีพร้อมเพย์นี้</p>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl p-3"
          >
            <p className="text-red-600 text-sm text-center">⚠️ {error}</p>
          </motion.div>
        )}

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-amber-50 rounded-xl p-3 border border-amber-100"
        >
          <div className="flex items-center justify-center gap-6 text-xs text-amber-700">
            <span>• 100 แต้ม = 1 บาท</span>
            <span>• ขั้นต่ำ 100 แต้ม</span>
            <span>• โอนภายใน 24 ชม.</span>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex gap-3"
        >
          <motion.button
            onClick={() => router.back()}
            whileTap={{ scale: 0.98 }}
            className="flex-1 py-4 bg-white text-gray-700 font-semibold rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all text-lg"
          >
            ← ย้อนกลับ
          </motion.button>
          <motion.button
            onClick={handlePayment}
            disabled={isProcessing || !promptpayId || promptpayId.length < 10 || finalTotal <= 0}
            whileTap={{ scale: 0.98 }}
            className="flex-2 py-4 bg-linear-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            {isProcessing ? 'กำลังดำเนินการ...' : `💰 แลกเงิน ${finalTotal} บาท`}
          </motion.button>
        </motion.div>
        </div>
      </div>
    </div>
  )
}
