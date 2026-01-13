'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useUserStore } from '@/store/userStore'

export default function WithdrawalsHistoryPage() {
  const { user, isAuthenticated } = useUserStore()
  const router = useRouter()
  const [withdrawals, setWithdrawals] = useState<Array<{
    id: string
    amount: number
    points_used: number
    status: string
    created_at: string
    completed_at?: string
  }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    const fetchWithdrawals = async () => {
      if (user?.id) {
        try {
          const res = await fetch(`/api/withdrawals?user_id=${user.id}`)
          const data = await res.json()
          if (data.success && Array.isArray(data.withdrawals)) {
            setWithdrawals(data.withdrawals)
          }
        } catch (err) {
          console.error('Error fetching withdrawals:', err)
        } finally {
          setLoading(false)
        }
      }
    }
    fetchWithdrawals()
  }, [user, isAuthenticated, router])

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[340px] sm:max-w-[400px] lg:max-w-[460px]"
      >
        <button
          onClick={() => router.push('/welcome')}
          className="self-start flex items-center gap-2 text-gray-500 hover:text-emerald-600 text-sm mb-4"
        >
          <span>←</span> กลับ
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 text-center mb-6">💳 ประวัติการถอนเงิน</h1>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-4xl mb-2">📭</p>
            <p className="text-sm">ยังไม่มีรายการถอนเงิน</p>
          </div>
        ) : (
          <div className="space-y-3">
            {withdrawals.map((w) => (
              <div key={w.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-800">{w.amount.toLocaleString()} บาท</div>
                  <div className="text-xs text-gray-500">{new Date(w.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                  w.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : w.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {w.status === 'completed' ? 'สำเร็จ' : w.status === 'pending' ? 'รอดำเนินการ' : w.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
