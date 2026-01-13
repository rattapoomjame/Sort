import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, getBottleCounts } from '@/lib/supabase'

// GET - ดึงจำนวนขวดแต่ละประเภทจาก machine_status
export async function GET() {
  try {
    const counts = await getBottleCounts('main')

    return NextResponse.json({
      success: true,
      counts,
      total: counts.total
    })
  } catch (err) {
    console.error('Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - รีเซ็ตจำนวนขวด หรือเพิ่มจำนวน
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, bottle_type } = body

    if (action === 'reset_all') {
      // รีเซ็ตจำนวนขวดทั้งหมด
      const { error } = await supabaseAdmin
        .from('machine_status')
        .update({ 
          glass_count: 0,
          plastic_count: 0,
          can_count: 0,
          bottle_count: 0, 
          storage_used: 0,
          updated_at: new Date().toISOString()
        })
        .eq('machine_id', 'main')

      if (error) {
        console.error('Error resetting bottle counts:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // บันทึก log
      await supabaseAdmin.from('activity_logs').insert({
        user_id: null,
        action: 'bottle_reset',
        details: 'Reset all bottle counts'
      })

      return NextResponse.json({ success: true, message: 'Reset all bottle counts successfully' })
    }

    if (action === 'increment' && bottle_type) {
      // เพิ่มจำนวนขวดตามประเภท
      const columnMap: Record<string, string> = {
        glass: 'glass_count',
        plastic: 'plastic_count',
        can: 'can_count'
      }
      
      const column = columnMap[bottle_type.toLowerCase()]
      if (!column) {
        return NextResponse.json({ error: 'Invalid bottle type' }, { status: 400 })
      }

      // ดึงค่าปัจจุบัน
      const { data: current } = await supabaseAdmin
        .from('machine_status')
        .select('glass_count, plastic_count, can_count')
        .eq('machine_id', 'main')
        .single()

      const counts = current as { glass_count?: number; plastic_count?: number; can_count?: number } | null
      let currentCount = 0
      if (column === 'glass_count') currentCount = counts?.glass_count || 0
      else if (column === 'plastic_count') currentCount = counts?.plastic_count || 0
      else if (column === 'can_count') currentCount = counts?.can_count || 0
      
      // อัปเดตเพิ่ม 1
      const { error } = await supabaseAdmin
        .from('machine_status')
        .update({ 
          [column]: currentCount + 1,
          updated_at: new Date().toISOString()
        })
        .eq('machine_id', 'main')

      if (error) {
        console.error('Error incrementing bottle count:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: `Incremented ${bottle_type} count` })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    console.error('Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
