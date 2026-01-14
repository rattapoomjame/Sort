'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useUserStore } from '@/store/userStore'
import { getUserById, getUserPoints, getHistory, updateUserInfo } from '@/lib/supabase'
import { User, PointHistory } from '@/lib/supabase'

export default function ProfilePage() {
  const router = useRouter()
  const { user, isAuthenticated } = useUserStore()
  
  const [userData, setUserData] = useState<User | null>(null)
  const [points, setPoints] = useState(0)
  const [recentHistory, setRecentHistory] = useState<PointHistory[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      router.push('/login')
      return
    }

    loadUserData()
  }, [isAuthenticated, user])

  const loadUserData = async () => {
    try {
      if (!user?.id) return
      
      const [userInfo, userPoints, history] = await Promise.all([
        getUserById(user.id),
        getUserPoints(user.id),
        getHistory(user.id, 5)
      ])

      setUserData(userInfo)
      setPoints(userPoints)
      setRecentHistory(history)
      setUsername(userInfo?.username || '')
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const handleUpdateUsername = async () => {
    if (!user?.id || !username.trim()) return
    
    setLoading(true)
    try {
      await updateUserInfo(user.id, username.trim())
      setMessage('✅ อัปเดตชื่อผู้ใช้สำเร็จ')
      setIsEditing(false)
      await loadUserData()
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('❌ อัปเดตล้มเหลว')
      console.error('Error updating username:', error)
    } finally {
      setLoading(false)
    }
  }

  const getItemEmoji = (itemType: string) => {
    const emojis: { [key: string]: string } = {
      glass: '🍾',
      plastic: '🥤',
      can: '🥫'
    }
    return emojis[itemType] || '♻️'
  }

  if (!isAuthenticated || !userData) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-gray-500">กำลังโหลด...</div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-emerald-50 to-teal-50 px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-emerald-600 mb-6 text-sm"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> กลับ
        </motion.button>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-emerald-500/10 border border-emerald-100 mb-6"
        >
          {/* Profile Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-3xl sm:text-4xl shadow-lg">
              👤
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{userData.username}</h1>
              <p className="text-gray-500 text-sm">{userData.phone}</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-200"
            >
              <div className="text-gray-600 text-sm font-medium mb-2">แต้มทั้งหมด</div>
              <div className="text-3xl font-bold text-emerald-600">{points.toLocaleString()}</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 border border-blue-200"
            >
              <div className="text-gray-600 text-sm font-medium mb-2">เงิน (คำนวณ)</div>
              <div className="text-3xl font-bold text-blue-600">฿{Math.floor(points / 100)}</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-200"
            >
              <div className="text-gray-600 text-sm font-medium mb-2">สมาชิกตั้งแต่</div>
              <div className="text-lg font-bold text-purple-600">
                {new Date(userData.created_at).toLocaleDateString('th-TH')}
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-4 border border-orange-200"
            >
              <div className="text-gray-600 text-sm font-medium mb-2">ขวดที่ recycle</div>
              <div className="text-3xl font-bold text-orange-600">{recentHistory.length}+</div>
            </motion.div>
          </div>

          {/* Edit Username */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-200 mb-8">
            {isEditing ? (
              <div className="flex gap-3">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ชื่อผู้ใช้ใหม่"
                  className="flex-1 px-4 py-2 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleUpdateUsername}
                  disabled={loading}
                  className="px-6 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 disabled:opacity-50"
                >
                  {loading ? 'กำลังบันทึก...' : 'บันทึก'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setIsEditing(false)
                    setUsername(userData.username)
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400"
                >
                  ยกเลิก
                </motion.button>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <span className="text-gray-700">ต้องการแก้ไขชื่อผู้ใช้?</span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600"
                >
                  แก้ไข
                </motion.button>
              </div>
            )}
          </div>

          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-6 text-sm font-medium text-emerald-600"
            >
              {message}
            </motion.div>
          )}
        </motion.div>

        {/* Recent History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-emerald-500/10 border border-emerald-100"
        >
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">ประวัติการรีไซเคิลล่าสุด</h2>
          
          {recentHistory.length > 0 ? (
            <div className="space-y-3">
              {recentHistory.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{getItemEmoji(item.item_type)}</span>
                    <div>
                      <div className="font-medium text-gray-800">
                        {item.item_type === 'glass' && 'ขวดแก้ว'}
                        {item.item_type === 'plastic' && 'ขวดพลาสติก'}
                        {item.item_type === 'can' && 'กระป๋อง'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(item.created_at).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-600">+{item.points}</div>
                    <div className="text-xs text-gray-500">แต้ม</div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              ยังไม่มีประวัติการรีไซเคิล
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/transaction-history')}
            className="w-full mt-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600"
          >
            ดูประวัติทั้งหมด →
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  )
}
