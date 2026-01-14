'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useUserStore } from '@/store/userStore'
import { getHistory, getWithdrawals } from '@/lib/supabase'
import { PointHistory, Withdrawal } from '@/lib/supabase'

type Transaction = (PointHistory & { type: 'point' }) | (Withdrawal & { type: 'withdrawal' })

export default function TransactionHistoryPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useUserStore()
  
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filter, setFilter] = useState<'all' | 'points' | 'withdrawals'>('all')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      router.push('/login')
      return
    }

    loadTransactions()
  }, [isAuthenticated, user, filter])

  const loadTransactions = async () => {
    try {
      if (!user?.id) return
      
      setLoading(true)
      const [history, withdrawals] = await Promise.all([
        getHistory(user.id, 100),
        getWithdrawals(user.id)
      ])

      let combined: Transaction[] = [
        ...history.map(h => ({ ...h, type: 'point' as const })),
        ...withdrawals.map(w => ({ ...w, type: 'withdrawal' as const }))
      ]

      // Filter
      if (filter === 'points') {
        combined = combined.filter(t => t.type === 'point')
      } else if (filter === 'withdrawals') {
        combined = combined.filter(t => t.type === 'withdrawal')
      }

      // Sort by date
      combined.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      setTransactions(combined)
    } catch (error) {
      console.error('Error loading transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const getItemEmoji = (itemType: string) => {
    const emojis: { [key: string]: string } = {
      glass: '🍾',
      plastic: '🥤',
      can: '🥫',
      withdrawal: '💰'
    }
    return emojis[itemType] || '♻️'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '✅ สำเร็จ'
      case 'pending':
        return '⏳ รอดำเนิน'
      case 'cancelled':
        return '❌ ยกเลิก'
      default:
        return status
    }
  }

  if (!isAuthenticated) {
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
          <span>←</span> กลับ
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-emerald-500/10 border border-emerald-100 mb-6"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">📊 ประวัติธุรกรรม</h1>
          <p className="text-gray-500">ดูประวัติการรีไซเคิลและการถอนเงินทั้งหมด</p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-3 mb-6 overflow-x-auto pb-2"
        >
          {(['all', 'points', 'withdrawals'] as const).map((f) => (
            <motion.button
              key={f}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(f)}
              className={`px-6 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
                filter === f
                  ? 'bg-emerald-500 text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-emerald-200 hover:border-emerald-500'
              }`}
            >
              {f === 'all' && '📋 ทั้งหมด'}
              {f === 'points' && '♻️ แต้ม'}
              {f === 'withdrawals' && '💰 การถอน'}
            </motion.button>
          ))}
        </motion.div>

        {/* Transactions List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-emerald-500/10 border border-emerald-100"
        >
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              กำลังโหลด...
            </div>
          ) : transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((tx, index) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 hover:border-emerald-400 transition-all"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm">
                      {tx.type === 'point' 
                        ? getItemEmoji((tx as PointHistory).item_type)
                        : '💰'
                      }
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">
                        {tx.type === 'point' 
                          ? `${(tx as PointHistory).item_type === 'glass' && 'ขวดแก้ว'} ${(tx as PointHistory).item_type === 'plastic' && 'ขวดพลาสติก'} ${(tx as PointHistory).item_type === 'can' && 'กระป๋อง'}`
                          : `ขอถอนเงิน`
                        }
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(tx.created_at).toLocaleDateString('th-TH', {
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
                    {tx.type === 'point' ? (
                      <div className="text-2xl font-bold text-emerald-600">
                        +{(tx as PointHistory).points}
                      </div>
                    ) : (
                      <div>
                        <div className="text-lg font-bold text-blue-600">
                          ฿{(tx as Withdrawal).amount}
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor((tx as Withdrawal).status)}`}>
                          {getStatusText((tx as Withdrawal).status)}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📭</div>
              <p className="text-gray-500">ไม่มีธุรกรรม</p>
            </div>
          )}
        </motion.div>

        {/* Summary */}
        {filter !== 'withdrawals' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 grid grid-cols-2 gap-4"
          >
            <div className="bg-white rounded-2xl p-4 shadow-lg border border-emerald-100">
              <div className="text-sm text-gray-600 mb-1">รวมแต้มที่ได้</div>
              <div className="text-2xl font-bold text-emerald-600">
                {(transactions.filter(t => t.type === 'point') as PointHistory[])
                  .reduce((sum, t) => sum + t.points, 0)
                  .toLocaleString()}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-lg border border-blue-100">
              <div className="text-sm text-gray-600 mb-1">จำนวนครั้ง</div>
              <div className="text-2xl font-bold text-blue-600">
                {transactions.filter(t => t.type === 'point').length}
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
