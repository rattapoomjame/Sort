'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { registerUser } from '@/lib/supabase'
import { useUserStore } from '@/store/userStore'

/**
 * Register Page – Eco-Friendly Theme
 */
export default function RegisterPage() {
  const router = useRouter()
  const { setUser, setError, isLoading, setLoading } = useUserStore()

  const [phone, setPhone] = useState('')
  const [username, setUsername] = useState('')
  const [error, setLocalError] = useState('')
  const [phoneError, setPhoneError] = useState('')

  // ตรวจสอบเบอร์โทรศัพท์ไทย
  const isValidThaiPhone = (phoneNumber: string) => {
    // เบอร์ไทย: 10 หลัก, ขึ้นต้นด้วย 0 ตามด้วย 6, 8, หรือ 9
    const thaiPhoneRegex = /^0[689]\d{8}$/
    return thaiPhoneRegex.test(phoneNumber)
  }

  // ตรวจสอบเบอร์แบบ real-time
  const handlePhoneChange = (value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, '')
    setPhone(cleanValue)
    
    if (cleanValue.length === 0) {
      setPhoneError('')
    } else if (cleanValue.length > 0 && cleanValue[0] !== '0') {
      setPhoneError('เบอร์ต้องขึ้นต้นด้วย 0')
    } else if (cleanValue.length >= 2 && !['06', '08', '09'].includes(cleanValue.substring(0, 2))) {
      setPhoneError('เบอร์ต้องขึ้นต้นด้วย 06, 08 หรือ 09')
    } else if (cleanValue.length === 10 && !isValidThaiPhone(cleanValue)) {
      setPhoneError('เบอร์โทรศัพท์ไม่ถูกต้อง')
    } else {
      setPhoneError('')
    }
  }

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLocalError('')
    setLoading(true)

    try {
      if (!phone.trim() || !username.trim()) {
        throw new Error('กรุณากรอกข้อมูลให้ครบ')
      }

      if (!isValidThaiPhone(phone)) {
        throw new Error('เบอร์โทรศัพท์ไม่ถูกต้อง (ต้องขึ้นต้นด้วย 06, 08 หรือ 09)')
      }

      const user = await registerUser(phone, username)
      setUser(user)
      router.push('/welcome')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการลงทะเบียน'
      setLocalError(message)
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 sm:px-8 lg:px-10 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[340px] sm:max-w-[400px] lg:max-w-[460px]"
      >
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-gray-500 hover:text-emerald-600 mb-6 text-sm sm:text-base group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> กลับหน้าหลัก
        </motion.button>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xl shadow-emerald-500/10 border border-emerald-100"
        >
          {/* Header */}
          <div className="flex flex-col items-center mb-6 sm:mb-8">
            <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-linear-to-br from-emerald-400 to-teal-500 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/30 border-4 border-white mb-4">
              <Image src="/bottle.svg" alt="Sorting Machine" width={48} height={48} className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16" />
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-emerald-600 mb-2 text-center">สมัครสมาชิก</h1>
            <p className="text-gray-500 text-sm sm:text-base text-center">เริ่มสะสมแต้มรักโลกได้เลย!</p>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 text-red-600 border border-red-200 rounded-xl px-4 py-3 text-sm mb-5 sm:mb-6 text-center"
            >
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                📱 เบอร์โทรศัพท์
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="08XXXXXXXX"
                className={`w-full px-4 py-3 sm:py-4 bg-gray-50 border-2 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all text-base sm:text-lg ${phoneError ? 'border-red-300 bg-red-50' : 'border-gray-100'}`}
                disabled={isLoading}
                maxLength={10}
              />
              {phoneError && (
                <p className="text-red-500 text-xs sm:text-sm mt-1">⚠️ {phoneError}</p>
              )}
              {phone.length > 0 && phone.length < 10 && !phoneError && (
                <p className="text-gray-400 text-xs mt-1">กรอกอีก {10 - phone.length} หลัก</p>
              )}
              {phone.length === 10 && !phoneError && (
                <p className="text-emerald-500 text-xs sm:text-sm mt-1">✅ เบอร์ถูกต้อง</p>
              )}
            </div>

            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                👤 ชื่อที่แสดง
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ชื่อของคุณ"
                className="w-full px-4 py-3 sm:py-4 bg-gray-50 border-2 border-gray-100 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all text-base sm:text-lg"
                disabled={isLoading}
              />
            </div>

            <motion.button
              type="submit"
              disabled={isLoading || !isValidThaiPhone(phone) || !username.trim()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-5 sm:py-6 bg-linear-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-lg sm:text-xl"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                  กำลังสมัคร...
                </span>
              ) : (
                'สมัครสมาชิกฟรี'
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-5 sm:my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="px-4 text-sm text-gray-400">หรือ</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Login link */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/login')}
            className="w-full py-5 sm:py-6 bg-emerald-50 text-emerald-600 font-semibold rounded-xl border-2 border-emerald-200 hover:bg-emerald-100 transition-colors text-lg sm:text-xl"
          >
            มีบัญชีแล้ว? เข้าสู่ระบบ
          </motion.button>

          {/* Terms */}
          <p className="text-xs sm:text-sm text-gray-400 text-center mt-5 sm:mt-6">
            การสมัครถือว่าคุณยอมรับ{' '}
            <span className="underline text-emerald-600 cursor-pointer hover:text-emerald-700">
              ข้อกำหนดการใช้งาน
            </span>
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
