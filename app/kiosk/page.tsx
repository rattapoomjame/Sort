'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

/**
 * Kiosk Page - หน้าจอสำหรับ Touch Screen บนเครื่อง Sorting Machine
 * ออกแบบมาสำหรับหน้าจอ 800x480 (Raspberry Pi Official Display)
 */

// ประเภทขยะและคะแนน
const ITEM_TYPES = {
  glass: { name: 'ขวดแก้ว', points: 5, rate: 0.50, emoji: '🍾', color: 'from-blue-400 to-blue-600' },
  plastic: { name: 'ขวดพลาสติก', points: 3, rate: 0.30, emoji: '🧴', color: 'from-cyan-400 to-cyan-600' },
  can: { name: 'กระป๋อง', points: 2, rate: 0.20, emoji: '🥫', color: 'from-orange-400 to-orange-600' },
}

type ItemType = keyof typeof ITEM_TYPES

interface SessionStats {
  glass: number
  plastic: number
  can: number
  totalPoints: number
}

export default function KioskPage() {
  const router = useRouter()
  
  // States
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState('')
  const [userPhone, setUserPhone] = useState('')
  const [currentPoints, setCurrentPoints] = useState(0)
  const [machineStatus, setMachineStatus] = useState<'ready' | 'processing' | 'error'>('ready')
  const [statusMessage, setStatusMessage] = useState('กรุณาล็อกอินเพื่อเริ่มใช้งาน')
  const [isRunning, setIsRunning] = useState(false)
  
  // Session stats
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    glass: 0,
    plastic: 0,
    can: 0,
    totalPoints: 0
  })

  // Phone input for login
  const [phoneInput, setPhoneInput] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  // API Base URL
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

  // Login function
  const handleLogin = async () => {
    if (phoneInput.length !== 10) {
      setLoginError('กรุณากรอกเบอร์โทร 10 หลัก')
      return
    }

    setIsLoggingIn(true)
    setLoginError('')

    try {
      const res = await fetch(`${API_BASE}/api/loginPhone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneInput })
      })

      const data = await res.json()

      if (data.user) {
        setUserName(data.user.username)
        setUserPhone(phoneInput)
        setCurrentPoints(data.points || 0)
        setIsLoggedIn(true)
        setStatusMessage('พร้อมใช้งาน - กดปุ่ม Start เพื่อเริ่ม')
        setMachineStatus('ready')
      } else {
        setLoginError('ไม่พบบัญชีผู้ใช้ กรุณาลงทะเบียนก่อน')
      }
    } catch {
      setLoginError('ไม่สามารถเชื่อมต่อ API ได้')
      setMachineStatus('error')
    } finally {
      setIsLoggingIn(false)
    }
  }

  // Logout function
  const handleLogout = () => {
    // Show session summary
    if (sessionStats.totalPoints > 0) {
      alert(`สรุปการใช้งาน:\n🍾 ขวดแก้ว: ${sessionStats.glass} ชิ้น\n🧴 พลาสติก: ${sessionStats.plastic} ชิ้น\n🥫 กระป๋อง: ${sessionStats.can} ชิ้น\n\n💰 แต้มที่ได้รับ: ${sessionStats.totalPoints} แต้ม`)
    }

    setIsLoggedIn(false)
    setUserName('')
    setUserPhone('')
    setPhoneInput('')
    setCurrentPoints(0)
    setSessionStats({ glass: 0, plastic: 0, can: 0, totalPoints: 0 })
    setStatusMessage('กรุณาล็อกอินเพื่อเริ่มใช้งาน')
    setIsRunning(false)
  }

  // Start machine
  const handleStart = () => {
    if (!isLoggedIn) return
    setIsRunning(true)
    setStatusMessage('กำลังทำงาน - ใส่ขวด/กระป๋องได้เลย')
    setMachineStatus('processing')
  }

  // Stop machine
  const handleStop = () => {
    setIsRunning(false)
    setStatusMessage('หยุดทำงาน - กด Start เพื่อเริ่มใหม่')
    setMachineStatus('ready')
  }

  // Simulate item detection (in real use, this comes from WebSocket/SSE from Raspberry Pi)
  const simulateItemDetection = useCallback((type: ItemType) => {
    if (!isRunning || !isLoggedIn) return

    const item = ITEM_TYPES[type]
    setStatusMessage(`ตรวจพบ ${item.emoji} ${item.name} (+${item.points} แต้ม)`)

    // Update session stats
    setSessionStats(prev => ({
      ...prev,
      [type]: prev[type] + 1,
      totalPoints: prev.totalPoints + item.points
    }))

    // Update total points
    setCurrentPoints(prev => prev + item.points)

    // Reset status after 2 seconds
    setTimeout(() => {
      if (isRunning) {
        setStatusMessage('กำลังทำงาน - ใส่ขวด/กระป๋องได้เลย')
      }
    }, 2000)
  }, [isRunning, isLoggedIn])

  // Keyboard shortcuts for testing (simulate item detection)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isRunning) return
      if (e.key === '1') simulateItemDetection('glass')
      if (e.key === '2') simulateItemDetection('plastic')
      if (e.key === '3') simulateItemDetection('can')
    }

    window.addEventListener('keypress', handleKeyPress)
    return () => window.removeEventListener('keypress', handleKeyPress)
  }, [isRunning, simulateItemDetection])

  // Number pad for phone input
  const handleNumberPad = (num: string) => {
    if (num === 'clear') {
      setPhoneInput('')
    } else if (num === 'backspace') {
      setPhoneInput(prev => prev.slice(0, -1))
    } else if (phoneInput.length < 10) {
      setPhoneInput(prev => prev + num)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 p-4 select-none">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-4 mb-4 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm">สวัสดี</p>
              <h1 className="text-white text-2xl font-bold">
                {isLoggedIn ? userName : 'Sorting Machine'}
              </h1>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
              <Image src="/recycle.svg" alt="Logo" width={40} height={40} className="opacity-90" />
            </div>
          </div>
        </motion.div>

        {/* Login Screen */}
        <AnimatePresence mode="wait">
          {!isLoggedIn ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 shadow-lg"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
                📱 กรอกเบอร์โทรศัพท์เพื่อเริ่มใช้งาน
              </h2>

              {/* Phone Display */}
              <div className="bg-gray-100 rounded-xl p-4 mb-4 text-center">
                <p className="text-3xl font-mono tracking-widest text-gray-800">
                  {phoneInput || '----------'}
                </p>
              </div>

              {loginError && (
                <p className="text-red-500 text-center mb-4">{loginError}</p>
              )}

              {/* Number Pad */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'backspace'].map((num) => (
                  <motion.button
                    key={num}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleNumberPad(num)}
                    className={`p-4 text-2xl font-bold rounded-xl transition-colors ${
                      num === 'clear' 
                        ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                        : num === 'backspace'
                        ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {num === 'clear' ? 'C' : num === 'backspace' ? '⌫' : num}
                  </motion.button>
                ))}
              </div>

              {/* Login Button */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleLogin}
                disabled={phoneInput.length !== 10 || isLoggingIn}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xl font-bold rounded-xl disabled:opacity-50 shadow-lg"
              >
                {isLoggingIn ? '🔄 กำลังตรวจสอบ...' : '✅ เข้าสู่ระบบ'}
              </motion.button>

              {/* Register Link */}
              <p className="text-center text-gray-500 mt-4">
                ยังไม่มีบัญชี? <span className="text-emerald-600 font-medium">สมัครที่เว็บ sortingmachine.vercel.app</span>
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="main"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              {/* Status Bar */}
              <div className="bg-white rounded-2xl p-4 mb-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">สถานะการทำงานของเครื่อง:</p>
                    <p className={`font-bold ${
                      machineStatus === 'error' ? 'text-red-500' : 
                      machineStatus === 'processing' ? 'text-emerald-500' : 'text-gray-700'
                    }`}>
                      {statusMessage}
                    </p>
                  </div>
                  
                  {/* Control Buttons */}
                  <div className="flex flex-col gap-2">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleStart}
                      disabled={isRunning}
                      className="px-8 py-3 bg-emerald-500 text-white font-bold rounded-xl disabled:opacity-50 shadow-md"
                    >
                      Start
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleStop}
                      disabled={!isRunning}
                      className="px-8 py-3 bg-red-500 text-white font-bold rounded-xl disabled:opacity-50 shadow-md"
                    >
                      Stop
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleLogout}
                      className="px-8 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl shadow-md"
                    >
                      ย้อนกลับ
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                {(Object.entries(ITEM_TYPES) as [ItemType, typeof ITEM_TYPES[ItemType]][]).map(([key, item]) => (
                  <motion.div
                    key={key}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white rounded-2xl p-4 shadow-lg text-center"
                  >
                    <div className="text-4xl mb-2">{item.emoji}</div>
                    <p className="text-gray-600 text-sm">{item.name}</p>
                    <div className={`inline-block px-4 py-1 mt-2 rounded-full bg-gradient-to-r ${item.color} text-white font-bold`}>
                      {sessionStats[key]}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Points Info */}
              <div className="bg-white rounded-2xl p-4 shadow-lg mb-4">
                <h3 className="font-bold text-gray-800 mb-3">คะแนนในการแลกเป็นเงิน</h3>
                <div className="space-y-2">
                  {(Object.entries(ITEM_TYPES) as [ItemType, typeof ITEM_TYPES[ItemType]][]).map(([key, item]) => (
                    <div key={key} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                      <span className="text-gray-600">{item.emoji} {item.name}</span>
                      <span className="font-bold text-emerald-600">{item.rate.toFixed(2)} บาท / ชิ้น</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Session Summary */}
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-4 shadow-lg">
                <div className="flex justify-between items-center text-white">
                  <div>
                    <p className="text-emerald-100 text-sm">แต้มที่ได้รับรอบนี้</p>
                    <p className="text-3xl font-bold">{sessionStats.totalPoints} แต้ม</p>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-100 text-sm">แต้มรวมทั้งหมด</p>
                    <p className="text-3xl font-bold">{currentPoints} แต้ม</p>
                  </div>
                </div>
              </div>

              {/* Test Buttons (for development) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 p-4 bg-amber-50 rounded-xl border-2 border-amber-200">
                  <p className="text-amber-800 text-sm mb-2">🧪 ทดสอบ (กดปุ่ม 1, 2, 3 หรือคลิก):</p>
                  <div className="flex gap-2">
                    <button onClick={() => simulateItemDetection('glass')} className="px-4 py-2 bg-blue-500 text-white rounded-lg">🍾 แก้ว</button>
                    <button onClick={() => simulateItemDetection('plastic')} className="px-4 py-2 bg-cyan-500 text-white rounded-lg">🧴 พลาสติก</button>
                    <button onClick={() => simulateItemDetection('can')} className="px-4 py-2 bg-orange-500 text-white rounded-lg">🥫 กระป๋อง</button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
