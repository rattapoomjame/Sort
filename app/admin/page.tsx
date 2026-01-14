'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useUserStore } from '@/store/userStore'
import {
  getDashboardStats,
  getWithdrawals,
  getMachineStatus,
  getAllUsers,
} from '@/lib/adminApi'
import {
  getTopUsers,
  getTotalPointsStats,
  User,
} from '@/lib/supabase'

interface DashboardStats {
  userCount: number
  totalPoints: number
  pendingWithdrawals: number
  bottleCount: number
}

export default function AdminPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useUserStore()
  
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([])
  const [topUsers, setTopUsers] = useState<(User & { points: number })[]>([])
  const [pointsStats, setPointsStats] = useState<any>(null)
  const [machineStats, setMachineStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      router.push('/login')
      return
    }

    loadDashboard()
  }, [isAuthenticated, user])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const [
        dashStats,
        pending,
        top,
        pStats,
        mStats,
      ] = await Promise.all([
        getDashboardStats(),
        getWithdrawals('pending'),
        getTopUsers(5),
        getTotalPointsStats(),
        getMachineStatus(),
      ])

      setStats(dashStats)
      setPendingWithdrawals(pending)
      setTopUsers(top)
      setPointsStats(pStats)
      setMachineStats(mStats)
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
          📊 Admin Dashboard
        </h1>
        <p className="text-slate-400 mt-2">System Overview & Management</p>
      </motion.div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Users', value: stats?.userCount || 0, icon: '👥', color: 'from-blue-500 to-blue-600' },
          { label: 'Total Points', value: stats?.totalPoints || 0, icon: '💎', color: 'from-purple-500 to-purple-600' },
          { label: 'Pending Withdrawals', value: stats?.pendingWithdrawals || 0, icon: '⏳', color: 'from-orange-500 to-orange-600' },
          { label: 'Bottle Count', value: stats?.bottleCount || 0, icon: '♻️', color: 'from-green-500 to-green-600' },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`bg-gradient-to-br ${stat.color} rounded-2xl p-6 text-white shadow-lg border border-white/10`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">{stat.label}</p>
                <p className="text-3xl font-bold mt-2">{stat.value.toLocaleString()}</p>
              </div>
              <span className="text-4xl">{stat.icon}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Machine Status */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 backdrop-blur"
        >
          <h3 className="text-lg font-bold text-white mb-4">🤖 Machine Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Status</span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                machineStats?.online ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {machineStats?.online ? '🟢 Online' : '🔴 Offline'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">CPU Temp</span>
              <span className="text-white">{machineStats?.cpuTemp || 'N/A'}°C</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Storage</span>
              <span className="text-white">{machineStats?.storagePercent || 'N/A'}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Bottle Level</span>
              <span className="text-white">{machineStats?.bottleLevel || 'N/A'}%</span>
            </div>
          </div>
        </motion.div>

        {/* Points Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 backdrop-blur"
        >
          <h3 className="text-lg font-bold text-white mb-4">📈 Points Statistics</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Average/User</span>
              <span className="text-white font-semibold">{Math.round(pointsStats?.average || 0)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Highest</span>
              <span className="text-white font-semibold text-green-400">{pointsStats?.max || 0}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Lowest</span>
              <span className="text-white font-semibold text-red-400">{pointsStats?.min || 0}</span>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Total Distributed</span>
                <span className="text-white font-bold text-purple-400">{pointsStats?.total || 0}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 backdrop-blur"
        >
          <h3 className="text-lg font-bold text-white mb-4">⚙️ Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/admin/withdrawals')}
              className="w-full p-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg text-sm font-semibold transition"
            >
              💰 Manage Withdrawals
            </button>
            <button
              onClick={() => router.push('/admin/users')}
              className="w-full p-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg text-sm font-semibold transition"
            >
              👥 Manage Users
            </button>
            <button
              onClick={() => router.push('/admin/pricing')}
              className="w-full p-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg text-sm font-semibold transition"
            >
              💵 Pricing Settings
            </button>
          </div>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Withdrawals */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 backdrop-blur"
        >
          <h3 className="text-lg font-bold text-white mb-4">⏳ Pending Withdrawals</h3>
          {pendingWithdrawals.length === 0 ? (
            <p className="text-slate-400 text-sm">No pending withdrawals</p>
          ) : (
            <div className="space-y-2">
              {pendingWithdrawals.slice(0, 5).map((withdrawal: any, idx) => (
                <div key={idx} className="p-3 bg-slate-700/50 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold">{withdrawal.user_phone}</p>
                    <p className="text-xs text-slate-400">Waiting...</p>
                  </div>
                  <span className="text-white font-bold text-orange-400">{withdrawal.baht} ฿</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Top 5 Users */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 backdrop-blur"
        >
          <h3 className="text-lg font-bold text-white mb-4">🏆 Top 5 Users</h3>
          {topUsers.length === 0 ? (
            <p className="text-slate-400 text-sm">No users yet</p>
          ) : (
            <div className="space-y-2">
              {topUsers.map((topUser: any, idx) => (
                <div key={idx} className="p-3 bg-slate-700/50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-yellow-400">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                    </span>
                    <p className="text-white font-semibold">{topUser.username || topUser.phone}</p>
                  </div>
                  <span className="text-white font-bold text-purple-400">{topUser.points}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
