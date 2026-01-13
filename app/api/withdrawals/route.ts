import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET - ดึงรายการ withdrawals
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const userId = searchParams.get('user_id')

    let query = supabaseAdmin
      .from('withdrawals')
      .select(`
        *,
        users (id, username, phone)
      `)
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching withdrawals:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // ดึง summary
    const { data: pending } = await supabaseAdmin
      .from('withdrawals')
      .select('amount')
      .eq('status', 'pending')

    const today = new Date().toISOString().split('T')[0]
    const { data: completed } = await supabaseAdmin
      .from('withdrawals')
      .select('amount')
      .eq('status', 'completed')
      .gte('completed_at', today)

    const summary = {
      pendingCount: pending?.length || 0,
      pendingAmount: pending?.reduce((sum, w) => sum + w.amount, 0) || 0,
      completedTodayCount: completed?.length || 0,
      completedTodayAmount: completed?.reduce((sum, w) => sum + w.amount, 0) || 0
    }

    return NextResponse.json({
      success: true,
      withdrawals: data || [],
      summary
    })
  } catch (error) {
    console.error('Withdrawals GET error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

/**
 * POST - สร้างหรืออัปเดต withdrawal
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, withdrawalId, status, adminNote, userId, amount, pointsUsed, promptpayNumber } = body

    // อัปเดตสถานะ withdrawal
    if (action === 'updateStatus' && withdrawalId) {
      const updateData: Record<string, unknown> = {
        status,
        admin_note: adminNote
      }

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString()
      }

      const { data, error } = await supabaseAdmin
        .from('withdrawals')
        .update(updateData)
        .eq('id', withdrawalId)
        .select()

      if (error) {
        console.error('Error updating withdrawal:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }

      // Log activity
      await supabaseAdmin
        .from('activity_logs')
        .insert([{ 
          user_id: null, 
          action: 'withdrawal_status_update', 
          details: `อัปเดตสถานะเป็น ${status}` 
        }])

      return NextResponse.json({ success: true, data: data?.[0] })
    }

    // สร้าง withdrawal ใหม่
    if (action === 'create' && userId) {
      const { data, error } = await supabaseAdmin
        .from('withdrawals')
        .insert([{
          user_id: userId,
          amount,
          points_used: pointsUsed,
          promptpay_number: promptpayNumber,
          status: 'pending'
        }])
        .select()

      if (error) {
        console.error('Error creating withdrawal:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }

      // Log activity
      await supabaseAdmin
        .from('activity_logs')
        .insert([{ 
          user_id: userId, 
          action: 'withdraw_request', 
          details: `ขอแลกเงิน ${amount} บาท` 
        }])

      return NextResponse.json({ success: true, data: data?.[0] })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Withdrawals POST error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
