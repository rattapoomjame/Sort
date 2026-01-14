'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useUserStore } from '@/store/userStore'
import { getTopUsers, getTotalPointsStats, getUserPoints } from '@/lib/supabase'
import { User } from '@/lib/supabase'

interface UserWithPoints extends User {
  points: number
  rank?: number
}

interface PointsStats {
  totalPoints: number
  averagePoints: number
  maxPoints: number
  minPoints: number
  userCount: number
}

export default function LeaderboardPage() {
  const { user } = useUserStore()
  
  const [topUsers, setTopUsers] = useState<UserWithPoints[]>([])
  const [stats, setStats] = useState<PointsStats | null>(null)
  const [userRank, setUserRank] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLeaderboard()
  }, [])

  const loadLeaderboard = async () => {
    try {
      setLoading(true)
      const [top, pointsStats] = await Promise.all([
        getTopUsers(50),
        getTotalPointsStats()
      ])

      setTopUsers(top.map((u, index) => ({ ...u, rank: index + 1 })))
      setStats(pointsStats)

      // Get user's rank
      if (user?.id) {
        const userPoints = await getUserPoints(user.id)
        const rank = top.findIndex(u => u.id === user.id) + 1
        setUserRank(rank)
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getMedalEmoji = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇'
      case 2:
        return '🥈'
      case 3:
        return '🥉'
      default:
        return `#${rank}`
    }
  }

  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-400 to-yellow-500'
      case 2:
        return 'from-gray-300 to-gray-400'
      case 3:
        return 'from-orange-400 to-orange-500'
      default:
        return 'from-emerald-400 to-teal-500'
    }
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-emerald-50 via-cyan-50 to-blue-50 px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
            🏆 ลีดเดอร์บอร์ด
          </h1>
          <p className="text-gray-600">แสดงผู้ใช้ที่มีแต้มสูงสุด</p>
        </motion.div>

        {/* Stats Cards */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
          >
            <div className="bg-white rounded-2xl p-4 shadow-lg border border-emerald-100 text-center">
              <div className="text-sm text-gray-600 mb-2">ผู้ใช้ทั้งหมด</div>
              <div className="text-3xl font-bold text-emerald-600">{stats.userCount}</div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-lg border border-blue-100 text-center">
              <div className="text-sm text-gray-600 mb-2">แต้มรวม</div>
              <div className="text-3xl font-bold text-blue-600">{(stats.totalPoints / 1000).toFixed(1)}k</div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-lg border border-purple-100 text-center">
              <div className="text-sm text-gray-600 mb-2">ค่าเฉลี่ย</div>
              <div className="text-3xl font-bold text-purple-600">{stats.averagePoints}</div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-lg border border-orange-100 text-center">
              <div className="text-sm text-gray-600 mb-2">สูงสุด</div>
              <div className="text-3xl font-bold text-orange-600">{stats.maxPoints.toLocaleString()}</div>
            </div>
          </motion.div>
        )}

        {/* Your Rank (if logged in) */}
        {user && userRank > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl p-6 mb-8 text-white shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm opacity-90">อันดับของคุณ</div>
                <div className="text-3xl font-bold">#{userRank}</div>
              </div>
              <div className="text-6xl opacity-80">{getMedalEmoji(userRank)}</div>
            </div>
          </motion.div>
        )}

        {/* Leaderboard List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-100 overflow-hidden"
        >
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              กำลังโหลดลีดเดอร์บอร์ด...
            </div>
          ) : topUsers.length > 0 ? (
            <div className="space-y-2">
              {topUsers.map((topUser, index) => {
                const isCurrentUser = user?.id === topUser.id
                return (
                  <motion.div
                    key={topUser.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                      isCurrentUser
                        ? 'bg-gradient-to-r from-emerald-100 to-teal-100 border-2 border-emerald-500'
                        : index < 3
                        ? `bg-gradient-to-r ${getMedalColor(index + 1)} bg-opacity-10`
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* Medal/Rank */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                      index < 3
                        ? `bg-gradient-to-br ${getMedalColor(index + 1)} text-white`
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {getMedalEmoji(index + 1)}
                    </div>

                    {/* User Info */}
                    <div className="flex-1">
                      <div className="font-bold text-gray-800">
                        {topUser.username}
                        {isCurrentUser && <span className="ml-2 text-sm text-emerald-600">(คุณ)</span>}
                      </div>
                      <div className="text-sm text-gray-500">{topUser.phone}</div>
                    </div>

                    {/* Points */}
                    <div className="text-right">
                      <div className="text-2xl font-bold text-emerald-600">
                        {topUser.points.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">แต้ม</div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📭</div>
              <p className="text-gray-500">ไม่มีข้อมูลผู้ใช้</p>
            </div>
          )}
        </motion.div>

        {/* Achievement Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-100"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-6">🎖️ เหรียญรางวัล</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-5xl mb-2">🥇</div>
              <div className="text-sm font-medium text-gray-700">อันดับ 1</div>
              <div className="text-xs text-gray-500">เฉพาะตัวจริง</div>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-2">🥈</div>
              <div className="text-sm font-medium text-gray-700">อันดับ 2</div>
              <div className="text-xs text-gray-500">คุณอยู่ใกล้!</div>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-2">🥉</div>
              <div className="text-sm font-medium text-gray-700">อันดับ 3</div>
              <div className="text-xs text-gray-500">ทำได้ดี!</div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
